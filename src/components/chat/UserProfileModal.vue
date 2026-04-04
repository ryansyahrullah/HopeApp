<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-content-wrapper animate-zoom-in">
        <div class="user-profile-card">
          
          <!-- Header / Close -->
          <button class="close-btn" @click="close">&times;</button>

          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
             <Loader2 class="spin-icon" :size="40" />
             <p>Memuat profil...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
             <p>{{ error }}</p>
             <button @click="close" class="retry-btn">Tutup</button>
          </div>

          <!-- Profil Data -->
          <template v-else-if="user">
            <div class="profile-header-image">
               <img v-if="user.avatar_url" :src="user.avatar_url" alt="User Avatar" class="full-avatar-img" />
               <div v-else class="initial-avatar-bg flex-center zh">
                  <span>{{ userInitial }}</span>
               </div>
            </div>

            <div class="profile-details">
              <div class="details-header-row">
                <div class="name-role-col">
                  <h2 class="user-full-name">{{ user.full_name }}</h2>
                  <div class="role-badge-container">
                    <span v-for="role in user.roles" :key="role" class="role-pill" :class="role">
                      {{ roleLabel(role) }}
                    </span>
                  </div>
                </div>
                
                <!-- Action Links Pojok Kanan Atas -->
                <div class="header-action-links">
                  <button v-if="canMessage" class="text-link-btn" @click="handlePesanClick">Pesan</button>
                  <button v-if="isOwnProfile" class="text-link-btn" @click="showAnonPopup = true">Anonim</button>
                  <button v-if="isOwnProfile" class="text-link-btn" @click="router.push('/profile')">Edit Profil</button>
                </div>
              </div>

              <!-- PENJELASAN ANONIM (POPUP KECIL) -->
              <div v-if="showAnonPopup" class="anon-explanation-popup animate-zoom-in">
                 <div class="anon-pop-inner">
                    <div class="pop-header">
                       <span class="pop-title">Mode Anonim</span>
                       <div class="toggle-switch" :class="{ 'on': user?.is_anonymous }" @click="toggleAnonStatus">
                          <div class="switch-handle"></div>
                       </div>
                    </div>
                    <p class="pop-desc">
                       Identitas Anda akan disembunyikan di grup chat & data pribadi akan disensor dari mahasiswa lain. Admin & Dosen tetap dapat melihat data asli Anda.
                    </p>
                    <button class="pop-close-btn" @click="showAnonPopup = false">Tutup</button>
                 </div>
              </div>




              <div class="info-grid">
                 <div v-if="user.nim" class="info-row">
                    <span class="label">NIM</span>
                    <span class="value">{{ maskedValue(user.nim) }}</span>
                 </div>
                 <div v-if="user.student_number" class="info-row">
                    <span class="label">No. Anggota</span>
                    <span class="value">{{ maskedValue(user.student_number) }}</span>
                 </div>
                 <div v-if="user.jurusan" class="info-row">
                    <span class="label">Jurusan</span>
                    <span class="value">{{ maskedValue(user.jurusan) }}</span>
                 </div>
                 <div v-if="user.prodi" class="info-row">
                    <span class="label">Prodi</span>
                    <span class="value">{{ maskedValue(user.prodi) }}</span>
                 </div>
                 <div v-if="user.semester" class="info-row">
                    <span class="label">Semester</span>
                    <span class="value">{{ maskedValue(user.semester) }}</span>
                 </div>
              </div>

            </div>
          </template>
        </div>

        <!-- Tombol Aksi Terpisah (Hanya jika orang lain dan bisa di-DM) -->
        <div v-if="user && !isLoading && !error && !isOwnProfile && canMessage" class="action-footer">
          <button class="message-action-btn" @click="goToPrivateChat">
             <Send :size="18" /> Kirim Pesan
          </button>
        </div>
      </div>



    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, Send } from 'lucide-vue-next'
import { profileService } from '@/services/profileService'
import { useAuth } from '@/composables/useAuth'


const router = useRouter()
const props = defineProps({
  isOpen: Boolean,
  userId: String
})

const emit = defineEmits(['close'])

const isLoading = ref(false)
const user = ref(null)
const error = ref(null)

const close = () => {
  emit('close')
  user.value = null
  error.value = null
}

const { currentUser } = useAuth()

const isOwnProfile = computed(() => {
  return currentUser.value?.id === props.userId
})

// Restrict DM: Hanya Mahasiswa & Admin yang bisa kirim/terima pesan
const canMessage = computed(() => {
  if (!user.value || isOwnProfile.value) return false
  const isTargetValid = !user.value.roles?.includes('dosen')
  const isUserValid = currentUser.value?.roles?.some(r => ['mahasiswa', 'admin'].includes(r))
  return isTargetValid && isUserValid
})

const handlePesanClick = () => {
  if (isOwnProfile.value) {
    close()
    router.push('/chat/inbox')
  } else {
    goToPrivateChat()
  }
}

const goToPrivateChat = () => {
  const id = props.userId
  close()
  router.push(`/chat/private/${id}`)
}



const userInitial = computed(() => {
  return (user.value?.full_name || '?').charAt(0).toUpperCase()
})

const roleLabel = (role) => {
  const map = { admin: 'Admin', dosen: 'Dosen', mahasiswa: 'Mahasiswa', ai_assistant: 'AI' }
  return map[role] || role
}

const formatPhone = (phone) => {
  if (!phone) return ''
  // Bersihkan karakter non-digit
  let cleaned = phone.replace(/\D/g, '')
  // Jika mulai dengan 0, ubah ke 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }
  return cleaned
}

const fetchUserProfile = async (id) => {
  if (!id) return
  isLoading.value = true
  error.value = null
  try {
    user.value = await profileService.getProfileById(id)
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
    error.value = 'Gagal memuat profil pengguna.'
  } finally {
    isLoading.value = false
  }
}

// Fitur Anonim
const showAnonPopup = ref(false)
const toggleAnonStatus = async () => {
  if (!user.value) return
  const newStatus = !user.value.is_anonymous
  try {
    user.value = await profileService.updateAnonymousStatus(props.userId, newStatus)
  } catch (e) {
    alert('Gagal mengubah status anonim.')
  }
}

const maskedValue = (val) => {
  if (!user.value?.is_anonymous || isOwnProfile.value) return val
  // Admin & Dosen tetap bisa lihat data asli
  const role = currentUser.value?.roles || []
  if (role.includes('admin') || role.includes('dosen')) return val
  return 'Cencored'
}


watch(() => props.userId, (newId) => {
  if (newId && props.isOpen) {
    fetchUserProfile(newId)
  }
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.userId) {
    fetchUserProfile(props.userId)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.5rem;
  backdrop-filter: blur(4px);
}

.modal-content-wrapper {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-profile-card {
  width: 100%;
  max-height: 60vh; /* Sedikit dikurangi agar sisa tempat untuk tombol */
  background-color: var(--c-surface);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--c-border);
}


/* Scrollbar Tipis & Cantik */
.user-profile-card::-webkit-scrollbar {
  width: 5px;
}
.user-profile-card::-webkit-scrollbar-track {
  background: transparent;
}
.user-profile-card::-webkit-scrollbar-thumb {
  background: var(--c-border);
  border-radius: 10px;
}
.user-profile-card::-webkit-scrollbar-thumb:hover {
  background: var(--c-text-muted);
}



.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-header-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: var(--c-bg);
}

.full-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initial-avatar-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  color: white;
  font-size: 5rem;
  font-weight: 800;
}

.profile-details {
  padding: 1.5rem;
}

.details-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.header-action-links {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.text-link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--c-primary);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.text-link-btn:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.user-full-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--c-text-main);
  margin-bottom: 0.25rem;
}

.role-badge-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}


.role-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  text-transform: uppercase;
}

.role-pill.admin { background-color: #fee2e2; color: #dc2626; }
.role-pill.dosen { background-color: #eff6ff; color: #2563eb; }
.role-pill.mahasiswa { background-color: #f0fdf4; color: #16a34a; }
.role-pill.ai_assistant {
  background-color: #f3e8ff;
  color: #9333ea;
}

/* Anonim UI */
.anon-explanation-popup {
  position: absolute;
  top: 15%;
  left: 5%;
  right: 5%;
  background: white;
  z-index: 100;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  border: 1px solid var(--c-border);
}

.anon-pop-inner {
  padding: 1.25rem;
}

.pop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.pop-title {
  font-weight: 800;
  color: var(--c-text-main);
  font-size: 1.1rem;
}

.pop-desc {
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--c-text-muted);
  margin-bottom: 1rem;
}

.pop-close-btn {
  width: 100%;
  padding: 0.5rem;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

/* Toggle Switch */
.toggle-switch {
  width: 44px;
  height: 24px;
  background-color: #e2e8f0;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-switch.on {
  background-color: var(--c-success);
}

.switch-handle {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.toggle-switch.on .switch-handle {
  left: calc(100% - 21px);
}


.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  flex-direction: column;
}

.info-row .label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-row .value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text-main);
}

.message-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 1rem;
  background-color: var(--c-surface);
  color: var(--c-primary);
  border: 1px solid var(--c-border);
  font-weight: 700;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.message-action-btn:hover {
  background-color: var(--c-primary);
  color: white;
  transform: translateY(-2px);
  border-color: var(--c-primary);
}


.message-action-btn:active {
  transform: translateY(0);
}

.wa-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background-color: #25d366;
  color: white;
  text-decoration: none;
  font-weight: 700;
  border-radius: var(--radius-md);
  transition: opacity 0.2s;
}

.wa-action-btn:hover {
  opacity: 0.9;
}

.loading-state, .error-state {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
  color: var(--c-primary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-zoom-in {
  animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
</style>
