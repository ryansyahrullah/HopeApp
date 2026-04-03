import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

const unreadCount = ref(0)
let realtimeChannel = null
let isInitialized = false

export function useChatBadge() {
  const { currentUser, isMahasiswa } = useAuth()

  const initBadge = async () => {
    if (isInitialized || !currentUser.value || !isMahasiswa.value) return
    isInitialized = true

    const userId = currentUser.value.id
    const key = `hopeapp_last_chat_read_${userId}`
    let lastRead = localStorage.getItem(key)
    
    // Jika belum pernah baca chat, set last read ke 24 jam yg lalu sebagai fallback
    if (!lastRead) {
      lastRead = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      localStorage.setItem(key, lastRead)
    }

    try {
      // Hitung pesan unread (dibuat setelah lastRead dan bukan oleh user ini)
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', lastRead)
        .neq('user_id', userId)

      if (!error && count) {
        unreadCount.value = count
      }
    } catch (err) {
      console.error('[useChatBadge] Error fetching unread count:', err)
    }

    // Subscribe realtime
    if (!realtimeChannel) {
      realtimeChannel = supabase
        .channel('public:messages:badge')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          // Abaikan pesan sendiri
          if (payload.new.user_id !== userId) {
            // Tambah badge jika user di luar halaman chat
            if (window.location.pathname !== '/chat') {
              unreadCount.value++
            } else {
              // Jika sedang di chat, cukup update timestamp lastRead dan reset badge
              localStorage.setItem(key, new Date().toISOString())
              unreadCount.value = 0
            }
          }
        })
        .subscribe()
    }
  }

  const resetBadge = () => {
    if (currentUser.value?.id) {
      const key = `hopeapp_last_chat_read_${currentUser.value.id}`
      localStorage.setItem(key, new Date().toISOString())
    }
    unreadCount.value = 0
  }

  // Watcher untuk auto-init saat login via composable
  watch(() => currentUser.value, (user) => {
    if (user && isMahasiswa.value && !isInitialized) {
      initBadge()
    }
  }, { immediate: true })

  return { unreadCount, resetBadge }
}
