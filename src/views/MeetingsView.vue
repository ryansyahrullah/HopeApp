<template>
  <div class="meetings-page">
    <!-- ==============================================
         DESKTOP HEADER
         ============================================== -->
    <div class="page-header desktop-only flex-between mb-2">
      <div>
        <h2 class="page-title">Daftar Pertemuan</h2>
        <p class="page-subtitle">Pilih pertemuan untuk melihat detail materi dan resume.</p>
      </div>
      
      <div class="header-actions">
        <!-- Sort Toggle -->
        <div class="sort-control">
          <label>Urutkan:</label>
          <BaseSelect 
            v-model="sortOrder"
            :options="[
              { label: 'Terbaru ke Terlama', value: 'desc' },
              { label: 'Terlama ke Terbaru', value: 'asc' }
            ]"
            style="min-width: 200px;"
          />
        </div>
        
        <BaseButton v-if="isAdmin" variant="primary" @click="openAddModal" style="display: flex; align-items: center; gap: 0.5rem">
          <Plus :size="18" /> Tambah Pertemuan
        </BaseButton>
      </div>
    </div>

    <!-- ==============================================
         MOBILE HEADER
         ============================================== -->
    <div class="mobile-meetings-header mobile-only">
      <div class="flex-between">
        <h2 style="font-size: 1.4rem; font-weight: 700; color: white; margin:0;">Materi Kelas</h2>
        <button class="mobile-sort-btn" @click="toggleSort">
          <ArrowUpDown :size="18" />
        </button>
      </div>
      <p style="font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 0.2rem;">Pilih sesi di bawah untuk lanjut belajar.</p>
    </div>

    <!-- Skeleton Loading -->
    <template v-if="isLoading">
      <div class="desktop-only">
        <PageSkeleton variant="cards" :count="6" />
      </div>
      <div class="mobile-only">
        <PageSkeleton variant="mobile-list" :count="8" />
      </div>
    </template>

    <!-- Empty State -->
    <EmptyState 
      v-else-if="meetings.length === 0" 
      title="Belum ada pertemuan" 
      description="Jadwal pertemuan masih kosong."
    >
      <template #action v-if="isAdmin">
        <BaseButton variant="primary" @click="openAddModal">Buat Pertemuan Pertama</BaseButton>
      </template>
    </EmptyState>

    <template v-else>
      <!-- ==============================================
           DESKTOP GRID VIEWER
           ============================================== -->
      <div class="meetings-grid desktop-only animate-fade-in">
        <MeetingCard 
          v-for="(meeting, index) in sortedMeetings" 
          :key="meeting.id" 
          :meeting="meeting" 
          @open="goToDetail"
          @edit="openEditModal"
          @delete="openDeleteModal"
          style="animation: fadeIn 0.4s ease-out forwards; opacity: 0;"
          :style="{ animationDelay: `${index * 0.05}s` }"
        />
      </div>

      <!-- ==============================================
           MOBILE LIST VIEWER (CHAT-LIKE)
           ============================================== -->
      <div class="mobile-meetings-list mobile-only animate-fade-in">
        <div 
          v-for="(meeting, index) in sortedMeetings" 
          :key="'mob-' + meeting.id"
          class="mobile-meeting-item"
          @click="goToDetail(meeting.id)"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <!-- Left: Session Circle -->
          <div class="mobile-session-circle">
            <span style="font-size: 0.6rem; text-transform: uppercase; font-weight: 800;">Sesi</span>
            <span style="font-size: 1.1rem; line-height: 1;">{{ meeting.meeting_number }}</span>
          </div>

          <!-- Middle: Info -->
          <div class="mobile-meeting-info">
            <h4 class="mobile-meeting-title">{{ meeting.title }}</h4>
            <span class="mobile-meeting-date">
               <Calendar :size="12" /> {{ formatDateShort(meeting.meeting_date) }}
            </span>
          </div>

          <!-- Right: Arrow & Admin Actions -->
          <div class="mobile-meeting-right">
             <div v-if="isAdmin" class="mobile-admin-actions" @click.stop>
               <button class="m-action-btn edit" @click.stop="openEditModal(meeting)"><Edit2 :size="14" /></button>
               <button class="m-action-btn delete" @click.stop="openDeleteModal(meeting)"><Trash2 :size="14" /></button>
             </div>
             <ChevronRight :size="20" class="mobile-chevron" v-else />
          </div>
        </div>
      </div>
      
      <!-- ADMIN FAB MOBILE -->
      <button v-if="isAdmin" class="mobile-fab mobile-only" @click="openAddModal">
        <Plus :size="24" />
      </button>

    </template>

    <!-- Modal Tambah/Edit Pertemuan As Admin -->
    <BaseModal :isOpen="isAddModalOpen" :title="isEditing ? 'Edit Sesi Pertemuan' : 'Tambah Pertemuan Baru'" @close="closeAddModal">
      
      <!-- Pemberitahuan Error Sesi Duplikat -->
      <div v-if="errorMessage" class="error-alert mb-2">
        <span class="icon" style="display: flex; align-items: center;"><AlertTriangle :size="18" /></span> {{ errorMessage }}
      </div>

      <form @submit.prevent="submitMeeting" class="form-container">
        <div class="form-row">
          <div class="form-group">
            <label>Sesi Ke</label>
            <input type="number" v-model="formData.meeting_number" min="1" required class="form-input">
          </div>
          <div class="form-group">
            <label>Tanggal Pertemuan</label>
            <input type="date" v-model="formData.meeting_date" required class="form-input">
          </div>
        </div>

        <div class="form-group">
          <label>Judul Sesi</label>
          <input type="text" v-model="formData.title" placeholder="Contoh: Pengenalan Karakter" required class="form-input">
        </div>

        <div class="form-group">
          <label>Topik Bahasan</label>
          <textarea v-model="formData.topic" rows="3" placeholder="Deskripsikan yang akan dipelajari..." required class="form-input"></textarea>
        </div>

        <div class="form-group">
          <label>Link Video YouTube (Opsional)</label>
          <input type="url" v-model="formData.video_url" placeholder="https://youtube.com/watch?v=..." class="form-input">
        </div>
      </form>

      <template #footer>
        <BaseButton variant="outline" @click="closeAddModal" :disabled="isSubmitting">Batal</BaseButton>
        <BaseButton variant="primary" @click="submitMeeting" :disabled="isSubmitting">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal Delete Confirm -->
    <BaseModal :isOpen="isDeleteDialogOpen" title="Konfirmasi Hapus" @close="isDeleteDialogOpen = false">
      <p style="margin-bottom:1.5rem;">Apakah kamu yakin ingin menghapus sesi <strong>{{ meetingToDelete?.title }}</strong>?</p>
      <div style="display:flex; gap:1rem; justify-content:flex-end;">
         <BaseButton variant="outline" @click="isDeleteDialogOpen = false">Batal</BaseButton>
         <BaseButton variant="primary" style="background-color:var(--c-danger); border-color:var(--c-danger);" @click="confirmDelete" :disabled="isDeleting">
            {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
         </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, Plus, ArrowUpDown, Calendar, ChevronRight, Edit2, Trash2 } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { meetingService } from '@/services/meetingService'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MeetingCard from '@/components/meeting/MeetingCard.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import PageSkeleton from '@/components/common/PageSkeleton.vue'

const router = useRouter()
const { isAdmin } = useAuth()

const meetings = ref([])
const isLoading = ref(true)

// State Sorting (Default descending / terbaru di atas)
const sortOrder = ref('desc')

const sortedMeetings = computed(() => {
  return [...meetings.value].sort((a, b) => {
    if (sortOrder.value === 'asc') {
      return a.meeting_number - b.meeting_number
    } else {
      return b.meeting_number - a.meeting_number
    }
  })
})

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short'
  })
}

// Modal State
const isAddModalOpen = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const errorMessage = ref('')
const formData = ref({
  id: '',
  meeting_number: 1,
  title: '',
  topic: '',
  meeting_date: new Date().toISOString().split('T')[0],
  video_url: ''
})

// Delete State
const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)
const meetingToDelete = ref(null)

const loadMeetings = async () => {
  isLoading.value = true
  try {
    const data = await meetingService.getMeetings()
    meetings.value = data
    
    // Auto-increment nomor sesi di form biar makin gampang untuk admin
    if(data.length > 0) {
       formData.value.meeting_number = Math.max(...data.map(m => m.meeting_number)) + 1
    } else {
       formData.value.meeting_number = 1
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/meetings/${id}`)
}

const openAddModal = () => {
  errorMessage.value = ''
  isEditing.value = false
  if(meetings.value.length > 0) {
     formData.value.meeting_number = Math.max(...meetings.value.map(m => m.meeting_number)) + 1
  } else {
     formData.value.meeting_number = 1
  }
  formData.value.id = ''
  formData.value.title = ''
  formData.value.topic = ''
  formData.value.video_url = ''
  formData.value.meeting_date = new Date().toISOString().split('T')[0]
  isAddModalOpen.value = true
}

const openEditModal = (meeting) => {
  errorMessage.value = ''
  isEditing.value = true
  formData.value = { ...meeting }
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  if (isSubmitting.value) return
  isAddModalOpen.value = false
}

const submitMeeting = async () => {
  // Reset previous error
  errorMessage.value = ''

  if (!formData.value.title || !formData.value.meeting_date) {
    errorMessage.value = "Mohon melengkapi judul dan tanggal pertemuan."
    return
  }
  
  isSubmitting.value = true
  try {
    if (isEditing.value) {
      await meetingService.updateMeeting(formData.value.id, {...formData.value})
    } else {
      await meetingService.createMeeting({...formData.value})
    }
    
    closeAddModal()
    await loadMeetings()

  } catch(e) {
    errorMessage.value = e.message
  } finally {
    isSubmitting.value = false
  }
}

const openDeleteModal = (meeting) => {
  meetingToDelete.value = meeting
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if(!meetingToDelete.value) return
  isDeleting.value = true
  try {
     await meetingService.deleteMeeting(meetingToDelete.value.id)
     isDeleteDialogOpen.value = false
     await loadMeetings()
  } catch(e) { console.error(e) }
  finally { isDeleting.value = false }
}

onMounted(() => {
  loadMeetings()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--c-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.sort-control label {
  color: var(--c-text-muted);
}

.mb-2 {
  margin-bottom: 2rem;
}

.meetings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Form Styles */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--c-text-main);
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background-color: var(--c-bg);
  color: var(--c-text-main);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.1);
}

textarea.form-input {
  resize: vertical;
}

.error-alert {
  background-color: var(--c-danger-bg);
  color: var(--c-danger);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(198, 40, 40, 0.2);
}

/* ==============================================
   MOBILE NATIVE STYLES
   ============================================== */
.mobile-meetings-header {
  margin: -1rem -1rem 1.5rem -1rem;
  padding: 1.5rem 1.5rem 2.5rem 1.5rem;
  background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
  color: white;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  position: relative;
  z-index: 1;
}

.mobile-sort-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-meetings-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: -3.5rem; /* Overlap effect */
  background: var(--c-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 15px -3px rgba(0,0,0,0.05);
  position: relative;
  z-index: 2;
  overflow: hidden;
  border: 1px solid var(--c-border);
}

.mobile-meeting-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
  gap: 1rem;
  background: var(--c-surface);
  transition: background-color 0.2s;
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}

.mobile-meeting-item:last-child {
  border-bottom: none;
}

.mobile-meeting-item:active {
  background: var(--c-bg);
}

.mobile-session-circle {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--c-danger-bg);
  color: var(--c-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-meeting-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-meeting-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.2rem;
}

.mobile-meeting-date {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mobile-meeting-right {
  display: flex;
  align-items: center;
}

.mobile-chevron {
  color: var(--c-border);
}

.mobile-admin-actions {
  display: flex;
  gap: 0.5rem;
}

.m-action-btn {
  background: var(--c-bg);
  border: none;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  color: var(--c-text-muted);
}
.m-action-btn.edit { color: var(--c-info); background: var(--c-info-bg); }
.m-action-btn.delete { color: var(--c-danger); background: var(--c-danger-bg); }

.mobile-fab {
  position: fixed;
  bottom: calc(64px + 1.5rem); /* Bottom nav height + margin */
  right: 1.5rem;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--c-primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.4);
  z-index: 30; /* sit above typical content */
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
