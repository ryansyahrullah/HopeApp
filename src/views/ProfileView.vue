<template>
  <div class="profile-page">

    <!-- Profile Header -->
    <div class="profile-hero animate-fade-in">
      <div class="profile-avatar-wrapper" @click="triggerFileInput" :class="{ 'loading': isUploading }">
        <div class="profile-avatar flex-center zh">
          <img v-if="currentUser.avatar_url" :src="currentUser.avatar_url" alt="Avatar" class="avatar-img" />
          <span v-else>{{ userInitial }}</span>
          
          <!-- Hover Overlay -->
          <div class="avatar-overlay">
            <Loader2 v-if="isUploading || isSyncing" class="spin-icon" :size="24" />
            <Camera v-else :size="24" />
          </div>
          
          <!-- Sync Indicator (Mini) -->
          <div v-if="isSyncing" class="sync-indicator-mini" title="Sinkronisasi foto...">
             <Loader2 class="spin-icon" :size="12" />
          </div>

        </div>
        <div class="role-ribbon">{{ roleLabel }}</div>
        
        <!-- Hidden File Input -->
        <input 
          type="file" 
          ref="fileInput" 
          style="display: none" 
          accept="image/*"
          @change="handleAvatarUpload"
        />
      </div>

      <div class="profile-identity">
        <h1 class="profile-name">{{ currentUser.full_name }}</h1>
        <p class="profile-role">{{ roleLabel }}</p>
        <div class="profile-actions">
          <button class="edit-profile-btn" @click="openEditModal" title="Edit Profil">
            <Edit2 :size="14" /> Edit Profil
          </button>
        </div>


      </div>
    </div>

    <!-- Info Cards Bento -->
    <div class="profile-bento animate-fade-in" style="animation-delay: 0.1s;">

      <!-- Card: Informasi Akademik (Mahasiswa Only) -->
      <BaseCard v-if="isMahasiswa" class="info-card info-card--wide">
        <h3 class="card-title" style="display:flex; align-items:center; gap:0.5rem;"><BookOpen :size="20"/> Informasi Akademik</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">NIM</span>
            <span class="info-value">{{ currentUser.nim || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Nomor Anggota HOPE</span>
            <span class="info-value">{{ currentUser.student_number || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Jurusan</span>
            <span class="info-value">{{ currentUser.jurusan || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Program Studi</span>
            <span class="info-value">{{ currentUser.prodi || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Semester</span>
            <span class="info-value">{{ currentUser.semester || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">No. WhatsApp / HP</span>
            <span class="info-value">{{ currentUser.phone || '-' }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- Card: Statistik Kegiatan -->
      <BaseCard class="info-card">
        <h3 class="card-title" style="display:flex; align-items:center; gap:0.5rem;"><BarChart :size="20"/> Statistik Kegiatan</h3>
        <div class="stat-list">
          <div class="stat-row">
            <span class="stat-label">Total Pertemuan</span>
            <span class="stat-val">{{ stats.totalMeetings }}</span>
          </div>
          <div class="stat-row" v-if="isMahasiswa">
            <span class="stat-label">Kehadiran</span>
            <span class="stat-val text-success">{{ stats.attendanceCount }} Hadir</span>
          </div>
          <div class="stat-row" v-if="isMahasiswa">
            <span class="stat-label">Resume Terkumpul</span>
            <span class="stat-val">{{ stats.resumeCount }}</span>
          </div>
          <div class="stat-row" v-if="isAdmin || isDosen">
            <span class="stat-label">Mahasiswa Aktif</span>
            <span class="stat-val">{{ stats.totalStudents }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- Card: Tentang Akun -->
      <BaseCard v-if="isAdmin" class="info-card">
        <h3 class="card-title" style="display:flex; align-items:center; gap:0.5rem;"><Settings :size="20"/> Tentang Akun</h3>
        <div class="stat-list">
          <div class="stat-row">
            <span class="stat-label">User ID</span>
            <span class="stat-val mono">{{ currentUser.id }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Role</span>
            <StatusBadge :type="roleBadgeType">{{ roleLabel }}</StatusBadge>
          </div>
        </div>
      </BaseCard>

    </div>

    <!-- Modal Edit Profile -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-card animate-fade-in" style="max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>Edit Profil</h3>
            <button class="close-btn" @click="showEditModal = false">&times;</button>
          </div>
          <form @submit.prevent="saveEditProfile" class="modal-body">
            <div class="form-group">
              <label>Nama Lengkap</label>
              <input type="text" v-model="editUserForm.full_name" required />
            </div>
            <template v-if="isMahasiswa">
              <div class="form-group">
                <label>NIM</label>
                <input type="text" v-model="editUserForm.nim" placeholder="Cth: D0123001" />
              </div>
              <div class="form-group">
                <label>Nomor Anggota HOPE</label>
                <input type="text" v-model="editUserForm.student_number" placeholder="Cth: D001" />
              </div>
              <div class="form-group">
                <label>Jurusan</label>
                <input type="text" v-model="editUserForm.jurusan" />
              </div>
              <div class="form-group">
                <label>Program Studi</label>
                <input type="text" v-model="editUserForm.prodi" />
              </div>
              <div class="form-group">
                <label>Semester</label>
                <input type="number" v-model="editUserForm.semester" />
              </div>
              <div class="form-group">
                <label>No. WhatsApp / HP</label>
                <input type="text" v-model="editUserForm.phone" placeholder="Cth: 08123456789" />
              </div>
            </template>
            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click="showEditModal = false">Batal</button>
              <button type="submit" class="submit-btn">
                <Edit2 :size="16" /> Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { BookOpen, BarChart, Settings, Edit2, Camera, Loader2 } from 'lucide-vue-next'


import { useAuth } from '@/composables/useAuth'
import { meetingService } from '@/services/meetingService'
import { presensiService } from '@/services/presensiService'
import { resumeService } from '@/services/resumeService'
import { profileService } from '@/services/profileService'
import { useAvatarSync } from '@/composables/useAvatarSync'
import { useProfileSync } from '@/composables/useProfileSync'
import BaseCard from '@/components/common/BaseCard.vue'

import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const { currentUser, roleName, isAdmin, isDosen, isMahasiswa, refreshProfile } = useAuth()
const { isSyncing, enqueueUpload } = useAvatarSync()
const { enqueueProfileUpdate } = useProfileSync()



const userInitial = computed(() => {
  return (currentUser.value?.full_name || '?').charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const map = { admin: 'Koordinator (Admin)', dosen: 'Dosen / Lǎoshī', mahasiswa: 'Mahasiswa' }
  return map[roleName.value] || roleName.value
})

const roleBadgeType = computed(() => {
  const map = { admin: 'danger', dosen: 'info', mahasiswa: 'success' }
  return map[roleName.value] || 'info'
})

// Edit Profile Modal
const showEditModal = ref(false)
const editUserForm = reactive({
  full_name: '',
  nim: '',
  student_number: '',
  jurusan: '',
  prodi: '',
  semester: '',
  phone: ''
})

const openEditModal = () => {
  editUserForm.full_name = currentUser.value?.full_name || ''
  editUserForm.nim = currentUser.value?.nim || ''
  editUserForm.student_number = currentUser.value?.student_number || ''
  editUserForm.jurusan = currentUser.value?.jurusan || ''
  editUserForm.prodi = currentUser.value?.prodi || ''
  editUserForm.semester = currentUser.value?.semester || ''
  editUserForm.phone = currentUser.value?.phone || ''
  showEditModal.value = true
}

const isSaving = ref(false)
const saveEditProfile = async () => {
  isSaving.value = true
  try {
    const updates = {
      full_name: editUserForm.full_name
    }
    if (isMahasiswa.value) {
      updates.nim = editUserForm.nim
      updates.student_number = editUserForm.student_number
      updates.jurusan = editUserForm.jurusan
      updates.prodi = editUserForm.prodi
      updates.semester = editUserForm.semester ? Number(editUserForm.semester) : null
      updates.phone = editUserForm.phone
    }
    
    await profileService.updateProfile(currentUser.value.id, updates)
    await refreshProfile() // Update global auth state profile
    showEditModal.value = false
  } catch (error) {
    console.error('Failed to update profile:', error)
    alert('Gagal memperbarui profil: ' + error.message)
  } finally {
    isSaving.value = false
  }
}

// Avatar Upload
const fileInput = ref(null)

const isUploading = ref(false)

const triggerFileInput = () => {
  if (!isUploading.value) fileInput.value?.click()
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('Ukuran file maksimal adalah 2MB')
    return
  }

  isUploading.value = true
  try {
    // Masukkan ke antrean sinkronisasi (Auto-Sync)
    await enqueueUpload(file)
    // alert('Foto profil sedang disinkronkan di latar belakang...')
  } catch (error) {
    console.error('Upload failed:', error)
    alert('Gagal memproses foto: ' + error.message)
  } finally {
    isUploading.value = false
    // Clear input
    if (fileInput.value) fileInput.value.value = ''
  }
}






// Stats
const stats = ref({
  totalMeetings: 0,
  totalStudents: 0,
  attendanceCount: 0,
  resumeCount: 0
})

const loadStats = async () => {
  try {
    if (!currentUser.value?.id) return

    const meetings = await meetingService.getMeetings()
    stats.value.totalMeetings = meetings.length

    if (isMahasiswa.value) {
      const allPresensi = await presensiService.getAllPresensi()
      stats.value.attendanceCount = allPresensi.filter(
        p => p.student_id === currentUser.value.id && p.status === 'hadir'
      ).length

      const myResumes = await resumeService.getMyAllResumes(currentUser.value.id)
      stats.value.resumeCount = myResumes.length
    }

    if (isAdmin.value || isDosen.value) {
      const allStudents = await profileService.getAllStudents()
      stats.value.totalStudents = allStudents.length
    }
  } catch (e) {
    console.error(e)
    alert('Gagal memuat statistik profil: ' + e.message)
  }
}

watch(roleName, () => loadStats())
onMounted(() => loadStats())
</script>

<style scoped>
/* Hero Section */
.profile-hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem 2.5rem;
  background: linear-gradient(135deg, var(--c-surface) 0%, var(--c-bg) 100%);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.profile-hero::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(198,40,40,0.05) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(30%, -30%);
}

.profile-avatar-wrapper {
  position: relative;
}

.profile-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  color: white;
  font-weight: bold;
  font-size: 2.5rem;
  box-shadow: 0 6px 20px rgba(198, 40, 40, 0.25);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
}

.profile-avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.profile-avatar-wrapper.loading .avatar-overlay {
  opacity: 1;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sync-indicator-mini {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: var(--c-primary);
  color: white;
  border-radius: 50%;
  border: 1px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}



.role-ribbon {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--c-primary);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-full);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-name {
  font-size: 2rem;
  font-weight: 800;
  color: var(--c-text-main);
  margin-bottom: 0.25rem;
}

.profile-role {
  font-size: 1.1rem;
  color: var(--c-text-muted);
  font-weight: 500;
}

.profile-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.edit-profile-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: var(--c-surface);
  color: var(--c-primary);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.edit-profile-btn:hover {
  background: rgba(198, 40, 40, 0.05);
  border-color: var(--c-primary);
  transform: translateY(-1px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-card {
  background: var(--c-surface);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  border: 1px solid var(--c-border);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--c-border);
}
.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--c-text-main);
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--c-text-muted);
  cursor: pointer;
  line-height:1;
}
.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--c-text-main);
}
.form-group input {
  padding: 0.8rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-text-main);
  font-family: inherit;
}
.form-group input:focus {
  outline: none;
  border-color: var(--c-primary);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}
.cancel-btn {
  padding: 0.65rem 1.25rem;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--c-text-main);
  font-weight: 600;
}
.submit-btn {
  padding: 0.65rem 1.25rem;
  background: var(--c-primary);
  border: none;
  color: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
}

/* Bento Layout */
.profile-bento {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-card {
  display: flex;
  flex-direction: column;
}

.info-card--wide {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--c-text-main);
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--c-border);
}

/* Info Grid (Akademik) */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--c-text-muted);
}

.info-value {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--c-text-main);
}

/* Stat List */
.stat-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed var(--c-border);
}

.stat-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-label {
  color: var(--c-text-muted);
  font-weight: 500;
}

.stat-val {
  font-weight: 700;
  color: var(--c-text-main);
}

.text-success {
  color: var(--c-success);
}

.mono {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  background: var(--c-bg);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}

/* Responsif */
@media (max-width: 600px) {
  .profile-hero {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .profile-avatar {
    width: 64px;
    height: 64px;
    font-size: 1.8rem;
  }
  
  .profile-name {
    font-size: 1.4rem;
  }
  
  .profile-role {
    font-size: 0.95rem;
  }

  .profile-actions {
    justify-content: center;
    margin-top: 1rem;
  }

  .role-ribbon {
    font-size: 0.55rem;
    padding: 0.1rem 0.5rem;
    bottom: -4px;
  }

  .profile-bento {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .info-card--wide {
    grid-column: span 1;
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .info-value, .stat-val {
    font-size: 0.95rem;
  }

  .info-label, .stat-label {
    font-size: 0.75rem;
  }
  
  .mono {
    font-size: 0.8rem;
  }
}
</style>
