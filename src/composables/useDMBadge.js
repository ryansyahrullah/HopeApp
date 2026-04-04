import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

const dmUnreadCount = ref(0)
let realtimeChannel = null
let isInitialized = false

export function useDMBadge() {
  const { currentUser } = useAuth()

  /**
   * Mengambil jumlah pesan pribadi yang belum dibaca
   */
  const fetchUnreadCount = async () => {
    if (!currentUser.value) return
    const { count, error } = await supabase
      .from('private_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', currentUser.value.id)
      .eq('is_read', false)

    if (!error) {
      dmUnreadCount.value = count || 0
    }
  }

  /**
   * Inisialisasi badge dan subscribe realtime
   */
  const initDMBadge = () => {
    if (isInitialized || !currentUser.value) return
    isInitialized = true
    
    fetchUnreadCount()

    if (!realtimeChannel) {
      realtimeChannel = supabase
        .channel('dm-badge-realtime')
        .on(
          'postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'private_messages' }, 
          (payload) => {
            // Jika pesan untuk user ini, tambah badge
            if (payload.new.recipient_id === currentUser.value.id) {
               dmUnreadCount.value++
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'private_messages' },
          (payload) => {
             // Jika status dibaca berubah, refresh hitungan
             if (payload.new.recipient_id === currentUser.value.id) {
                fetchUnreadCount()
             }
          }
        )
        .subscribe()
    }
  }

  // Auto-init saat user tersedia
  watch(() => currentUser.value, (user) => {
    if (user && !isInitialized) {
      initDMBadge()
    }
  }, { immediate: true })

  return { 
    dmUnreadCount, 
    refreshUnreadCount: fetchUnreadCount 
  }
}
