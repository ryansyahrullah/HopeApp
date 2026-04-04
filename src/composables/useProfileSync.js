import { ref } from 'vue'
import { profileService } from '@/services/profileService'
import { useAuth } from './useAuth'

const isSyncingProfile = ref(false)
const STORAGE_KEY = 'hopeapp_pending_profile_update'

export function useProfileSync() {
  const { currentUser, updateProfileLocal, refreshProfile } = useAuth()

  /**
   * Masukkan perubahan ke antrean (Optimistic)
   * @param {Object} updates - Objek field yang ingin diupdate (misal { is_anonymous: true })
   */
  const enqueueProfileUpdate = async (updates) => {
    if (!currentUser.value?.id) return
    
    // 1. Update UI segera (Optimistic)
    updateProfileLocal(updates)
    
    // 2. Simpan antrean di LocalStorage
    const currentQueue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const updatedQueue = { ...currentQueue, ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQueue))
    
    // 3. Picu sinkronisasi ke server
    syncPendingProfile()
  }

  /**
   * Sinkronisasi perubahan profil yang tertunda ke Supabase
   */
  const syncPendingProfile = async () => {
    if (isSyncingProfile.value) return
    
    const rawData = localStorage.getItem(STORAGE_KEY)
    if (!rawData) return
    
    const updates = JSON.parse(rawData)
    if (Object.keys(updates).length === 0) return
    
    if (!currentUser.value?.id) return

    isSyncingProfile.value = true
    try {
      // Kirim satu batch update semua field yang tertunda
      await profileService.updateProfile(currentUser.value.id, updates)
      
      // Sukses: Bersihkan antrean
      localStorage.removeItem(STORAGE_KEY)
      
      // Opsional: Tarik data terbaru dari server untuk memastikan konsistensi
      await refreshProfile()
      
      console.log('[useProfileSync] Profil berhasil disinkronkan ke server!')
    } catch (err) {
      console.warn('[useProfileSync] Gagal sinkronisasi profil, akan dicoba nanti:', err.message)
    } finally {
      isSyncingProfile.value = false
    }
  }

  return { 
    isSyncingProfile, 
    enqueueProfileUpdate, 
    syncPendingProfile 
  }
}
