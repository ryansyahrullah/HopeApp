<template>
  <div class="mahasiswa-detail-page">
    <div class="page-header mb-2">
      <div class="flex" style="align-items: center; gap: 1rem;">
        <BaseButton variant="outline" size="sm" @click="goBack" class="back-btn">
          <ArrowLeft :size="18" /> <span class="hide-on-mobile">Kembali</span>
        </BaseButton>
        <div>
          <h2 class="page-title">Detail Mahasiswa</h2>
          <p class="page-subtitle">Informasi lengkap data mahasiswa.</p>
        </div>
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="mobile-detail-header mobile-only">
      <div class="top-bar">
        <button class="mobile-back-btn" @click="goBack">
          <ArrowLeft :size="20" />
        </button>
        <span class="mobile-title">Detail Mahasiswa</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex-center" style="height: 200px">
      <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
    </div>
    
    <!-- Not Found -->
    <div v-else-if="!mahasiswa" class="error-alert">
      Data mahasiswa tidak ditemukan.
    </div>

    <template v-else>
      <div class="profile-hero animate-fade-in">
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar flex-center zh">
            <span>{{ userInitial }}</span>
          </div>
          <div class="role-ribbon">Mahasiswa</div>
        </div>
        <div class="profile-identity">
          <h1 class="profile-name">{{ mahasiswa.full_name }}</h1>
          <p class="profile-nim">{{ mahasiswa.nim || mahasiswa.id }}</p>
          <div class="profile-actions" v-if="isAdmin">
            <button class="action-btn edit-btn" @click="openEditModal" title="Edit Mahasiswa">
              <Edit2 :size="14" /> Edit
            </button>
            <button class="action-btn delete-btn" @click="deleteMahasiswa" title="Hapus Mahasiswa">
              <Trash2 :size="14" /> Hapus
            </button>
          </div>
        </div>
      </div>

      <!-- Detail Cards -->
      <div class="profile-bento animate-fade-in" style="animation-delay: 0.1s;">
        <!-- Card: Informasi Akademik -->
        <BaseCard class="info-card info-card--wide">
          <h3 class="card-title" style="display:flex; align-items:center; gap:0.5rem;"><BookOpen :size="20"/> Data Diri & Akademik</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">NIM</span>
              <span class="info-value">{{ mahasiswa.nim || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nomor Anggota</span>
              <span class="info-value">{{ mahasiswa.student_number || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Jurusan</span>
              <span class="info-value">{{ mahasiswa.jurusan || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Program Studi</span>
              <span class="info-value">{{ mahasiswa.prodi || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Semester</span>
              <span class="info-value">{{ mahasiswa.semester || '-' }}</span>
            </div>
            <div class="info-item" style="align-items: flex-start;">
              <span class="info-label">No. HP / WhatsApp</span>
              <button 
                v-if="mahasiswa.phone"
                class="wa-btn" 
                @click="openWhatsApp(mahasiswa.phone)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                {{ mahasiswa.phone }}
              </button>
              <span v-else class="info-value">-</span>
            </div>
          </div>
        </BaseCard>

      </div>
    </template>

    <!-- Modal Edit Mahasiswa -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-card animate-fade-in" style="max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>Edit Detail Mahasiswa</h3>
            <button class="close-btn" @click="showEditModal = false">&times;</button>
          </div>
          <form @submit.prevent="saveEditMahasiswa" class="modal-body">
            <div class="form-group">
              <label>Nama Lengkap</label>
              <input type="text" v-model="editForm.full_name" required />
            </div>
            <div class="form-group">
              <label>NIM</label>
              <input type="text" v-model="editForm.nim" placeholder="Cth: D0123001" />
            </div>
            <div class="form-group">
              <label>Nomor Anggota HOPE</label>
              <input type="text" v-model="editForm.student_number" placeholder="Cth: D001" />
            </div>
            <div class="form-group">
              <label>Jurusan</label>
              <input type="text" v-model="editForm.jurusan" />
            </div>
            <div class="form-group">
              <label>Program Studi</label>
              <input type="text" v-model="editForm.prodi" />
            </div>
            <div class="form-group">
              <label>Semester</label>
              <input type="number" v-model="editForm.semester" />
            </div>
            <div class="form-group">
              <label>No. HP / WhatsApp</label>
              <input type="text" v-model="editForm.phone" />
            </div>
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

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="Hapus Mahasiswa?"
      :message="`Apakah Anda yakin ingin menghapus mahasiswa '${mahasiswa?.full_name}'? Tindakan ini tidak dapat dibatalkan.`"
      confirmText="Ya, Hapus"
      variant="danger"
      :loading="isDeleting"
      @confirm="executeDeleteMahasiswa"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, BookOpen, Edit2, Trash2 } from 'lucide-vue-next'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { profileService } from '@/services/profileService'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'

const { isAdmin } = useAuth()
const { error: toastError, startWatchdog, stopWatchdog } = useToast()

const route = useRoute()
const router = useRouter()

const mahasiswa = ref(null)
const isLoading = ref(true)

const userInitial = computed(() => {
  return (mahasiswa.value?.full_name || '?').charAt(0).toUpperCase()
})

const goBack = () => {
  router.push('/mahasiswa')
}

const openWhatsApp = (phone) => {
  if (!phone) return
  // Ganti awalan 0 menjadi 62 agar link wa.me bisa langsung mendeteksi nomor Indonesia
  const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone
  window.open(`https://wa.me/${formattedPhone}`, '_blank')
}

// Edit & Delete logic
const showEditModal = ref(false)
const editForm = reactive({
  full_name: '',
  nim: '',
  student_number: '',
  jurusan: '',
  prodi: '',
  semester: '',
  phone: ''
})

const openEditModal = () => {
  if (!mahasiswa.value) return
  editForm.full_name = mahasiswa.value.full_name || ''
  editForm.nim = mahasiswa.value.nim || ''
  editForm.student_number = mahasiswa.value.student_number || ''
  editForm.jurusan = mahasiswa.value.jurusan || ''
  editForm.prodi = mahasiswa.value.prodi || ''
  editForm.semester = mahasiswa.value.semester || ''
  editForm.phone = mahasiswa.value.phone || ''
  showEditModal.value = true
}

const isSaving = ref(false)
const saveEditMahasiswa = async () => {
  if (!mahasiswa.value) return
  isSaving.value = true
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
    const updated = await profileService.updateProfile(mahasiswa.value.id, {
        full_name: editForm.full_name,
        nim: editForm.nim,
        student_number: editForm.student_number,
        jurusan: editForm.jurusan,
        prodi: editForm.prodi,
        semester: editForm.semester ? Number(editForm.semester) : null,
        phone: editForm.phone
    })
    mahasiswa.value = updated
    showEditModal.value = false
    toastSuccess('Data mahasiswa berhasil diperbarui')
  } catch (error) {
    console.error('Failed to update student', error)
    toastError('Gagal memperbarui data mahasiswa: ' + error.message)
  } finally {
    isSaving.value = false
    stopWatchdog()
  }
}

const isDeleting = ref(false)
const showDeleteDialog = ref(false)

const deleteMahasiswa = () => {
  showDeleteDialog.value = true
}

const executeDeleteMahasiswa = async () => {
  if (!mahasiswa.value) return
  isDeleting.value = true
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
    await profileService.deleteProfile(mahasiswa.value.id)
    showDeleteDialog.value = false
    router.push('/mahasiswa')
    toastSuccess('Mahasiswa berhasil dihapus')
  } catch (e) {
    console.error('Failed to delete student', e)
    toastError('Gagal menghapus mahasiswa: ' + e.message)
  } finally {
    isDeleting.value = false
    stopWatchdog()
  }
}

onMounted(async () => {
  const mhsId = route.params.id
  isLoading.value = true
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
      mahasiswa.value = await profileService.getProfileById(mhsId)
  } catch (e) {
      console.error(e)
      toastError('Gagal memuat detail mahasiswa: ' + e.message)
  } finally {
      isLoading.value = false
      stopWatchdog()
  }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--c-text-muted);
}

.mb-2 {
  margin-bottom: 2rem;
}

.flex {
  display: flex;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
}

/* Profile Hero */
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

.profile-nim {
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

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background: var(--c-surface);
  color: var(--c-primary);
  border: 1px solid var(--c-border);
}
.edit-btn:hover {
  background: rgba(198, 40, 40, 0.05);
  border-color: var(--c-primary);
  transform: translateY(-1px);
}

.delete-btn {
  background: var(--c-surface);
  color: var(--c-danger);
  border: 1px solid var(--c-border);
}
.delete-btn:hover {
  background: rgba(220, 38, 38, 0.05);
  border-color: var(--c-danger);
  transform: translateY(-1px);
}

/* Modal Styling */
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

.wa-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #25D366;
  color: white;
  border: none;
  padding: 0.5rem 0.8rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  width: fit-content;
  box-shadow: 0 4px 10px rgba(37, 211, 102, 0.2);
}

.wa-btn:hover {
  background-color: #1ebc5a;
}

.wa-btn:active {
  transform: scale(0.97);
}

/* Mobile styles */
.mobile-detail-header {
  display: none;
}

@media (max-width: 768px) {
  .page-header {
    display: none;
  }
  
  .hide-on-mobile {
    display: none;
  }

  .mobile-detail-header {
    display: block;
    margin: -1rem -1rem 1.5rem -1rem;
    padding: 1.5rem 1.5rem 2.5rem 1.5rem;
    background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
    color: white;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    position: relative;
    z-index: 1;
  }

  .top-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mobile-back-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-title {
    font-size: 1.2rem;
    font-weight: 700;
  }

  .profile-hero {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
    gap: 1rem;
    margin-top: -3.5rem;
    z-index: 2;
  }
  
  .profile-avatar {
    width: 64px;
    height: 64px;
    font-size: 1.8rem;
  }
  
  .profile-name {
    font-size: 1.4rem;
  }
  
  .profile-nim {
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

  .info-value {
    font-size: 0.95rem;
  }

  .info-label {
    font-size: 0.75rem;
  }
}
</style>



