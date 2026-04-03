<template>
  <div class="users-view">
    <div class="page-header mb-2">
      <div class="header-top">
        <div>
          <h2 class="page-title">Manajemen Pengguna</h2>
          <p class="page-subtitle">Kontrol akses multi-peran dan status pendaftaran.</p>
        </div>
        
        <!-- Registration Toggle -->
        <div class="registration-toggle">
          <span style="font-weight: 600; color: var(--c-text-main);">Pendaftaran Akun:</span>
          <label class="switch">
            <input type="checkbox" v-model="isRegistrationOpen">
            <span class="slider round"></span>
          </label>
        </div>
      </div>

      <!-- Tombol Tambah User -->
      <button class="add-user-btn" @click="showAddModal = true">
        <UserPlus :size="18" />
        <span>Tambah User</span>
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <Search :size="18" class="search-icon" />
      <input type="text" v-model="searchQuery" placeholder="Cari nama atau NIM..." />
    </div>

    <!-- Users Table -->
    <BaseCard>
      <div class="table-responsive animate-fade-in">
        <table class="styled-table matrix-table">
          <thead>
            <tr>
              <th class="sticky-col" style="min-width: 150px;">Nama / NIM</th>
              <th class="text-center" style="width: 100px;">Mahasiswa</th>
              <th class="text-center" style="width: 100px;">Dosen</th>
              <th class="text-center" style="width: 100px;">Admin</th>
              <th class="text-center" style="width: 100px;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="sticky-col">
                <strong class="mat-name" style="color: var(--c-text-main);">{{ user.full_name }}</strong><br/>
                <span class="mat-nim" style="font-size: 0.8rem; color: var(--c-text-muted)">{{ user.nim || user.id }}</span>
              </td>
              <td class="text-center" @click="toggleRole(user, 'mahasiswa')">
                <input type="checkbox" class="role-checkbox" :checked="(user.roles || []).includes('mahasiswa')" @change="toggleRole(user, 'mahasiswa')" @click.stop>
              </td>
              <td class="text-center" @click="toggleRole(user, 'dosen')">
                <input type="checkbox" class="role-checkbox" :checked="(user.roles || []).includes('dosen')" @change="toggleRole(user, 'dosen')" @click.stop>
              </td>
              <td class="text-center" @click="toggleRole(user, 'admin')">
                <input type="checkbox" class="role-checkbox" :checked="(user.roles || []).includes('admin')" @change="toggleRole(user, 'admin')" @click.stop>
              </td>
              <td class="text-center row-actions">
                <button class="action-icon-btn text-primary" @click.stop="openEditModal(user)" title="Edit Pengguna">
                  <Edit2 :size="16" />
                </button>
                <button class="action-icon-btn text-danger" @click.stop="deleteUser(user)" title="Hapus Pengguna">
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Modal Tambah User -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Tambah Pengguna Baru</h3>
            <button class="close-btn" @click="showAddModal = false">&times;</button>
          </div>
          <form @submit.prevent="addUser" class="modal-body">
            <div class="form-group">
              <label>Email</label>
              <input type="email" v-model="newUser.email" placeholder="nama@email.com" required />
            </div>
            <div class="form-group">
              <label>Kata Sandi</label>
              <input type="password" v-model="newUser.password" placeholder="Minimal 8 karakter" required />
            </div>
            <div class="form-group">
              <label>Peran (Role)</label>
              <div class="role-options">
                <label class="role-option">
                  <input type="checkbox" value="mahasiswa" v-model="newUser.roles" />
                  <span>Mahasiswa</span>
                </label>
                <label class="role-option">
                  <input type="checkbox" value="dosen" v-model="newUser.roles" />
                  <span>Dosen</span>
                </label>
                <label class="role-option">
                  <input type="checkbox" value="admin" v-model="newUser.roles" />
                  <span>Admin</span>
                </label>
              </div>
            </div>
            <div v-if="addError" class="form-error">{{ addError }}</div>
            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click="showAddModal = false">Batal</button>
              <button type="submit" class="submit-btn">
                <UserPlus :size="16" /> Tambah
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Edit User -->
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-card animate-fade-in" style="max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h3>Edit Pengguna</h3>
            <button class="close-btn" @click="showEditModal = false">&times;</button>
          </div>
          <form @submit.prevent="saveEditUser" class="modal-body">
            <div class="form-group">
              <label>Nama Lengkap</label>
              <input type="text" v-model="editUserForm.full_name" required />
            </div>
            <template v-if="editUserForm.roles.includes('mahasiswa')">
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
                <label>No. HP / WhatsApp</label>
                <input type="text" v-model="editUserForm.phone" />
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

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="Hapus Pengguna?"
      :message="`Apakah Anda yakin ingin menghapus pengguna '${deleteTarget?.full_name}'? Semua data terkait akan dihapus permanen.`"
      confirmText="Ya, Hapus"
      variant="danger"
      :loading="isDeleteLoading"
      @confirm="executeDeleteUser"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { UserPlus, Search, Edit2, Trash2 } from 'lucide-vue-next'
import BaseCard from '@/components/common/BaseCard.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { profileService } from '@/services/profileService'
import { useAuth } from '@/composables/useAuth'

const { signUpWithEmail } = useAuth()

const usersList = ref([])
const searchQuery = ref('')
const isRegistrationOpen = ref(true)

const loadData = async () => {
  try {
    usersList.value = await profileService.getAllProfiles()
    isRegistrationOpen.value = await profileService.getRegistrationSetting()
  } catch (error) {
    console.error('Failed to load users data', error)
    alert('Gagal memuat pengguna: ' + error.message)
  }
}

onMounted(() => {
  loadData()
})

watch(isRegistrationOpen, async (newVal) => {
  try {
    await profileService.setRegistrationSetting(newVal)
  } catch (error) {
    console.error('Failed to update registration setting', error)
    alert('Gagal mengubah status pendaftaran: ' + error.message)
  }
})

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return usersList.value
  return usersList.value.filter(u =>
    u.full_name?.toLowerCase().includes(q) ||
    u.nim?.toLowerCase().includes(q) ||
    u.id.toLowerCase().includes(q)
  )
})

// Modal state
const showAddModal = ref(false)
const addError = ref('')
const newUser = reactive({
  email: '',
  password: '',
  roles: []
})

const isAdding = ref(false)
const addUser = async () => {
  addError.value = ''

  if (newUser.roles.length === 0) {
    addError.value = 'Pilih minimal satu peran (role).'
    return
  }
  if (newUser.password.length < 8) {
    addError.value = 'Kata sandi harus minimal 8 karakter.'
    return
  }

  isAdding.value = true
  try {
    // Note: Calling signUp from frontend might log the admin as the new user
    // In production, consider using a Supabase Edge Function to create users on behalf of admin
    const name = newUser.email.split('@')[0]
    await signUpWithEmail(newUser.email, newUser.password, name)
    // Refresh list
    await loadData()
    // Reset form
    newUser.email = ''
    newUser.password = ''
    newUser.roles = []
    showAddModal.value = false
  } catch (e) {
    addError.value = e.message || 'Gagal menambahkan pengguna'
  } finally {
    isAdding.value = false
  }
}

const toggleRole = async (user, roleName) => {
  const currentRoles = [...(user.roles || [])]
  const index = currentRoles.indexOf(roleName)
  
  if (index !== -1) {
    if (currentRoles.length > 1) {
      currentRoles.splice(index, 1)
    } else {
      alert("Pengguna minimal harus memiliki 1 peran (role) aktif.")
      return
    }
  } else {
    currentRoles.push(roleName)
  }

  try {
    // Optimistic UI update
    user.roles = currentRoles
    await profileService.updateProfile(user.id, { roles: currentRoles })
  } catch (e) {
    console.error('Failed to update role', e)
    // Revert if failed
    loadData()
    alert('Gagal mengubah role pengguna: ' + e.message)
  }
}

// Edit User State
const showEditModal = ref(false)
const selectedUser = ref(null)
const editUserForm = reactive({
  full_name: '',
  nim: '',
  student_number: '',
  jurusan: '',
  prodi: '',
  semester: '',
  phone: '',
  roles: []
})

const openEditModal = (user) => {
  selectedUser.value = user
  editUserForm.full_name = user.full_name || ''
  editUserForm.nim = user.nim || ''
  editUserForm.student_number = user.student_number || ''
  editUserForm.jurusan = user.jurusan || ''
  editUserForm.prodi = user.prodi || ''
  editUserForm.semester = user.semester || ''
  editUserForm.phone = user.phone || ''
  editUserForm.roles = [...(user.roles || [])]
  showEditModal.value = true
}

const isSaving = ref(false)
const saveEditUser = async () => {
  if (selectedUser.value) {
    isSaving.value = true
    try {
      await profileService.updateProfile(selectedUser.value.id, {
        full_name: editUserForm.full_name,
        nim: editUserForm.nim,
        student_number: editUserForm.student_number,
        jurusan: editUserForm.jurusan,
        prodi: editUserForm.prodi,
        semester: editUserForm.semester ? Number(editUserForm.semester) : null,
        phone: editUserForm.phone
      })
      await loadData()
      showEditModal.value = false
    } catch (e) {
       console.error('Failed to update user', e)
       alert('Gagal menyimpan pengguna: ' + e.message)
    } finally {
       isSaving.value = false
    }
  }
}

const showDeleteDialog = ref(false)
const deleteTarget = ref(null)
const isDeleteLoading = ref(false)

const deleteUser = (user) => {
  deleteTarget.value = user
  showDeleteDialog.value = true
}

const executeDeleteUser = async () => {
  if (!deleteTarget.value) return
  isDeleteLoading.value = true
  try {
    await profileService.deleteProfile(deleteTarget.value.id)
    showDeleteDialog.value = false
    deleteTarget.value = null
    await loadData()
  } catch (e) {
    console.error('Failed to delete user', e)
    alert('Gagal menghapus pengguna: ' + e.message)
  } finally {
    isDeleteLoading.value = false
  }
}
</script>

<style scoped>
.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--c-text-muted);
}

.mb-2 { margin-bottom: 2rem; }

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-between {
  display: flex;
  justify-content: space-between;
}

.registration-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--c-surface);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
}

.text-success { color: var(--c-success); }
.text-danger { color: var(--c-danger); }

/* Switch Toggle Slider */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--c-border);
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  box-shadow: var(--shadow-sm);
}

input:checked + .slider {
  background-color: var(--c-primary);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--c-primary);
}

input:checked + .slider:before {
  -webkit-transform: translateX(24px);
  -ms-transform: translateX(24px);
  transform: translateX(24px);
  box-shadow: -2px 0 6px rgba(0,0,0,0.25); /* Shadow saat nyala agar gak nyatu */
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Table styles */
.table-responsive {
  overflow-x: auto;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.matrix-table th, .matrix-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
  border-right: 1px solid var(--c-border);
}

.matrix-table th {
  background-color: var(--c-bg);
  font-weight: 600;
  color: var(--c-text-muted);
  font-size: 0.85rem;
}

.sticky-col {
  position: sticky;
  left: 0;
  background-color: var(--c-surface);
  z-index: 2;
  box-shadow: 2px 0 5px rgba(0,0,0,0.02);
}
.matrix-table th.sticky-col {
  background-color: var(--c-bg);
  z-index: 3;
}

.text-center { text-align: center; cursor: pointer; }
.text-center:hover { background-color: rgba(0,0,0,0.02); }

.role-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--c-primary);
  pointer-events: none; /* Let the td catch the click */
}

@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .registration-toggle {
    width: 100%;
    justify-content: space-between;
  }

  .add-user-btn {
    width: 100%;
    justify-content: center;
    margin-top: 0.25rem;
  }
  
  .matrix-table th, .matrix-table td {
    padding: 0.5rem 0.4rem;
  }
  
  .matrix-table th {
    font-size: 0.75rem;
  }

  .mat-name {
    font-size: 0.8rem;
    display: inline-block;
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }

  .mat-nim {
    font-size: 0.65rem !important;
  }
  
  .role-checkbox {
    width: 16px;
    height: 16px;
  }
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  padding: 0.7rem 1rem;
  margin-bottom: 1.25rem;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--c-primary);
}

.search-icon {
  color: var(--c-text-muted);
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  color: var(--c-text-main);
  width: 100%;
}

.search-bar input::placeholder {
  color: var(--c-text-muted);
}

/* Tombol Tambah User */
.add-user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.25rem;
  background: var(--c-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.add-user-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220,38,38,0.25);
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
  line-height: 1;
}
.close-btn:hover { color: var(--c-danger); }

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-body .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.modal-body .form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--c-text-main);
}

.modal-body .form-group input[type="email"],
.modal-body .form-group input[type="password"] {
  padding: 0.8rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  font-size: 0.95rem;
  transition: border-color 0.2s;
}
.modal-body .form-group input:focus {
  outline: none;
  border-color: var(--c-primary);
}

.role-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--c-text-main);
}

.role-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--c-primary);
  cursor: pointer;
}

.form-error {
  color: var(--c-danger);
  font-size: 0.85rem;
  font-weight: 500;
  background: var(--c-danger-bg);
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-sm);
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
  color: var(--c-text-main);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: var(--c-surface);
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  background: var(--c-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.submit-btn:hover {
  background: #b91c1c;
}

/* Action Buttons in Table */
.row-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.action-icon-btn {
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  transition: all 0.2s;
  color: var(--c-text-muted);
}
.action-icon-btn:hover {
  background: var(--c-bg);
}
.text-primary { color: var(--c-primary); }
.text-primary:hover { background: rgba(198,40,40,0.1); }
.text-danger { color: #dc2626; }
.text-danger:hover { background: rgba(220,38,38,0.1); }
</style>
