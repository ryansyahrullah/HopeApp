import { ref, watch } from 'vue'
import { profileService } from '@/services/profileService'
import { useAuth } from './useAuth'

const isSyncing = ref(false)
const STORAGE_KEY = 'hopeapp_pending_avatar'

export function useAvatarSync() {
  const { currentUser, refreshProfile } = useAuth()

  /**
   * Mengonversi File ke Base64 untuk disimpan di LocalStorage
   */
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  /**
   * Mengonversi Base64 kembali ke Blob untuk diunggah
   */
  const base64ToBlob = async (base64) => {
     try {
       const res = await fetch(base64)
       return await res.blob()
     } catch (e) {
       return null
     }
  }

  /**
   * Masukkan file ke antrean unggah (lokal) dan mulai proses
   */
  const enqueueUpload = async (file) => {
    if (!currentUser.value?.id) return
    
    try {
      const base64 = await fileToBase64(file)
      const queueData = {
        userId: currentUser.value.id,
        base64,
        type: file.type,
        name: file.name,
        timestamp: Date.now()
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queueData))
      processQueue()
    } catch (e) {
      console.error('[useAvatarSync] Gagal enqueue:', e)
    }
  }

  /**
   * Proses antrean unggahan yang tertunda
   */
  const processQueue = async () => {
    if (isSyncing.value) return
    
    const rawData = localStorage.getItem(STORAGE_KEY)
    if (!rawData) return
    
    const data = JSON.parse(rawData)
    
    // Pastikan user saat ini adalah pemilik antrean ini
    if (!currentUser.value || currentUser.value.id !== data.userId) {
       // Abaikan jika user berbeda
       return
    }

    isSyncing.value = true
    try {
      const blob = await base64ToBlob(data.base64)
      if (!blob) throw new Error('Blob conversion failed')

      // Buat file object dari blob
      const file = new File([blob], data.name || 'avatar.jpg', { type: data.type || 'image/jpeg' })
      
      // 1. Upload ke Storage
      const publicUrl = await profileService.uploadAvatar(data.userId, file)
      
      // 2. Update field avatar_url di tabel profiles
      await profileService.updateProfile(data.userId, { avatar_url: publicUrl })
      
      // 3. Hapus dari antrean
      localStorage.removeItem(STORAGE_KEY)
      
      // 4. Sinkronkan state profil global
      await refreshProfile()
      
      console.log('[useAvatarSync] Sinkronisasi foto profil berhasil!')
    } catch (err) {
      console.warn('[useAvatarSync] Gagal sinkronisasi, akan dicoba lagi nanti:', err.message)
    } finally {
      isSyncing.value = false
    }
  }

  return { 
    isSyncing, 
    enqueueUpload, 
    processQueue 
  }
}
