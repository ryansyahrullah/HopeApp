import { ref } from 'vue'
import { chatService } from '@/services/chatService'
import { dmService } from '@/services/dmService'
import { useAuth } from './useAuth'

// State singleton agar konsisten di seluruh aplikasi
const pendingMessages = ref(JSON.parse(localStorage.getItem('hopeapp_pending_messages') || '[]'))
const isSyncing = ref(false)

export function useMessageSync() {
  const { currentUser } = useAuth()

  /**
   * Simpan antrean ke LocalStorage
   */
  const saveToStorage = () => {
    localStorage.setItem('hopeapp_pending_messages', JSON.stringify(pendingMessages.value))
  }

  /**
   * Tambahkan pesan ke antrean lokal (Optimistic)
   */
  const addPending = (type, payload) => {
    const newMessage = {
      localId: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type, // 'group' atau 'dm'
      payload,
      content: payload.content, // Untuk mempermudah filter di UI
      recipientId: payload.recipientId, // Hanya untuk DM
      authorName: payload.authorName,
      created_at: new Date().toISOString(),
      status: 'pending'
    }
    
    pendingMessages.value.push(newMessage)
    saveToStorage()
    
    // Langsung coba kirim
    syncPending()
    
    return newMessage
  }

  /**
   * Proses pengiriman pesan yang tertunda
   */
  const syncPending = async () => {
     if (isSyncing.value || pendingMessages.value.length === 0) return
     if (!currentUser.value) return

     isSyncing.value = true
     
     // Salinan antrean untuk iterasi
     const queue = [...pendingMessages.value]
     
     for (const msg of queue) {
       try {
         if (msg.type === 'group') {
           const p = msg.payload
           await chatService.sendMessage(
             currentUser.value.id, 
             p.content, 
             p.authorName, 
             p.authorNumber, 
             p.authorRoles, 
             p.authorAvatar, 
             p.isAnonymous
           )
         } else if (msg.type === 'dm') {
           const p = msg.payload
           await dmService.sendPrivateMessage(
             p.recipientId, 
             p.content, 
             p.authorName, 
             p.authorAvatar
           )
         }
         
         // Hapus dari antrean jika sukses
         pendingMessages.value = pendingMessages.value.filter(m => m.localId !== msg.localId)
         saveToStorage()
       } catch (err) {
         console.warn('[useMessageSync] Gagal kirim pesan tunggal, akan dicoba lagi:', err.message)
         // Jika error jaringan, stop iterasi dulu (coba lagi nanti)
         if (err.message.includes('fetch') || err.message.includes('network') || !window.navigator.onLine) {
            break
         }
       }
     }
     
     isSyncing.value = false
  }

  return { 
    pendingMessages, 
    addPending, 
    syncPending 
  }
}
