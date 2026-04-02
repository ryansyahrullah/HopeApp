<template>
  <div class="meeting-detail">
    <!-- ==============================================
         DESKTOP HEADER & BACK BUTTON
         ============================================== -->
    <button class="back-link desktop-only" @click="$router.push('/meetings')">
      ← Kembali ke Daftar Pertemuan
    </button>
    
    <!-- ==============================================
         MOBILE TOP APP BAR
         ============================================== -->
    <div class="mobile-app-bar mobile-only is-flex">
      <button class="m-back-btn" @click="$router.push('/meetings')">
        <ArrowLeft :size="24" />
      </button>
      <h2 class="m-app-bar-title">Detail Sesi</h2>
      <div class="m-app-bar-spacer"></div> <!-- Spacer for center-alignment -->
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex-center" style="height: 300px">
      <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
    </div>

    <!-- Main Content -->
    <template v-else-if="meeting">
      <header class="detail-header desktop-only animate-fade-in flex-between">
        <div class="header-content">
          <div class="badge-wrapper">
            <StatusBadge type="primary" class="sesi-badge">Sesi {{ meeting.meeting_number }}</StatusBadge>
            <span class="date-text" style="display:flex; align-items:center; gap:6px"><Calendar :size="15" /> {{ formattedDate }}</span>
          </div>
          <h1 class="title">{{ meeting.title }}</h1>
          <p class="topic">{{ meeting.topic }}</p>
        </div>
        
        <!-- Action Buttons Admin -->
        <div v-if="isAdmin" class="admin-actions">
           <BaseButton variant="outline" size="sm" @click="openEditModal" style="display:flex; align-items:center; gap:0.4rem"><Edit :size="16" /> Edit Sesi</BaseButton>
           <BaseButton variant="outline" size="sm" @click="handleDelete" style="color:var(--c-danger); border-color:var(--c-danger); display:flex; align-items:center; gap:0.4rem"><Trash2 :size="16" /> Hapus</BaseButton>
        </div>
      </header>

      <!-- ==============================================
           MOBILE COMPACT HEADER
           ============================================== -->
      <div class="mobile-session-card mobile-only animate-fade-in">
        <div class="m-session-meta">
           <div class="m-number-badge">Sesi {{ meeting.meeting_number }}</div>
           <span class="m-date-text"><Calendar :size="12" /> {{ formattedDate }}</span>
        </div>
        <h1 class="m-session-title">{{ meeting.title }}</h1>
        <p class="m-session-topic">{{ meeting.topic }}</p>
        
        <div v-if="isAdmin" class="m-admin-actions">
           <button class="m-icon-action edit" @click="openEditModal"><Edit :size="16"/> Edit</button>
           <button class="m-icon-action delete" @click="handleDelete"><Trash2 :size="16"/> Hapus</button>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <nav class="tabs-nav animate-fade-in" style="animation-delay: 0.1s">
        <button 
          v-for="tab in availableTabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
          style="display:flex; align-items:center; gap:6px;"
        >
          <component :is="tab.icon" :size="18" />
          {{ tab.label }}
        </button>
      </nav>

      <!-- Tabs Content Area -->
      <section class="tab-content animate-fade-in" style="animation-delay: 0.2s">
        
        <!-- TAB 1: Video -->
        <div v-show="activeTab === 'video'" class="tab-pane">
          <div class="video-container">
            <YouTubeEmbed :url="meeting.video_url" />
          </div>
          <div class="video-meta" v-if="isAdmin">
            <BaseButton variant="outline" size="sm">Edit Link Video</BaseButton>
          </div>
        </div>

        <!-- TAB 2: Presensi -->
        <div v-show="activeTab === 'presensi'" class="tab-pane">
          <PresensiCheckList :meetingId="meeting.id" />
        </div>

        <!-- TAB 3: Resume -->
        <div v-show="activeTab === 'resume'" class="tab-pane">
          <MeetingResumeManager :meetingId="meeting.id" />
        </div>

      </section>
    </template>
    
    <!-- Not Found -->
    <EmptyState v-else title="Pertemuan tidak ditemukan" description="ID pertemuan mungkin salah atau sudah dihapus." />

    <!-- Modal Delete Confirm -->
    <BaseModal v-model="isDeleteDialogOpen" title="Konfirmasi Hapus">
      <p style="margin-bottom:1.5rem;">Apakah kamu yakin ingin menghapus sesi <strong>{{ meeting?.title }}</strong>? Data absensi dan resume yang terkait sesi ini akan hilang.</p>
      <div style="display:flex; gap:1rem; justify-content:flex-end;">
         <BaseButton variant="outline" @click="isDeleteDialogOpen = false">Batal</BaseButton>
         <BaseButton variant="primary" style="background-color:var(--c-danger);" @click="confirmDelete" :disabled="isDeleting">
            {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
         </BaseButton>
      </div>
    </BaseModal>

    <!-- Modal Edit Sesi -->
    <BaseModal v-model="isEditModalOpen" title="Edit Sesi Pertemuan">
      <form @submit.prevent="submitEdit">
        <div class="form-group mb-1">
          <label class="form-label">Sesi Ke-</label>
          <input type="number" v-model="form.meeting_number" class="form-input" required min="1" />
        </div>
        <div class="form-group mb-1">
          <label class="form-label">Judul Materi</label>
          <input type="text" v-model="form.title" class="form-input" required placeholder="Contoh: Pengenalan Pinyin" />
        </div>
        <div class="form-group mb-1">
          <label class="form-label">Deskripsi / Topik</label>
          <textarea v-model="form.topic" class="form-input" required rows="3" placeholder="Garis besar yang akan dipelajari..."></textarea>
        </div>
        <div class="form-group mb-1">
          <label class="form-label">Tanggal Sesi</label>
          <input type="date" v-model="form.meeting_date" class="form-input" required />
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Link YouTube Materi</label>
          <input type="url" v-model="form.video_url" class="form-input" placeholder="https://youtube.com/watch?v=..." />
        </div>
        <div v-if="editError" class="alert-error mb-2" style="display: flex; align-items: center; gap: 0.5rem">
          <AlertCircle :size="16" /> {{ editError }}
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <BaseButton type="button" variant="outline" @click="isEditModalOpen = false">Batal</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="isSaving">
            {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Video, ClipboardCheck, BookText, Calendar, Edit, Trash2, AlertCircle, ArrowLeft } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { meetingService } from '@/services/meetingService'

import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import YouTubeEmbed from '@/components/meeting/YouTubeEmbed.vue'
import PresensiCheckList from '@/components/presensi/PresensiCheckList.vue'
import MeetingResumeManager from '@/components/resume/MeetingResumeManager.vue'

const route = useRoute()
const router = useRouter()
const { roleName, isAdmin } = useAuth()

const meeting = ref(null)
const isLoading = ref(true)
const activeTab = ref('video')

// Dynamically hide tabs if needed based on role (for now everyone sees all tabs conceptually)
const availableTabs = computed(() => {
  return [
    { id: 'video', label: 'Video Materi', icon: Video },
    { id: 'presensi', label: 'Presensi', icon: ClipboardCheck },
    { id: 'resume', label: 'Resume', icon: BookText }
  ]
})

const formattedDate = computed(() => {
  if (!meeting.value?.meeting_date) return '-'
  return new Date(meeting.value.meeting_date).toLocaleDateString('id-ID', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
})

const loadDetail = async () => {
  isLoading.value = true
  try {
    const data = await meetingService.getMeetingById(route.params.id)
    meeting.value = data
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

// Logic Delete
const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)

const handleDelete = () => {
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  isDeleting.value = true
  try {
     await meetingService.deleteMeeting(route.params.id)
     isDeleteDialogOpen.value = false
     router.push('/meetings') // Redirect ke daftar
  } catch(e) { console.error(e) }
  finally { isDeleting.value = false }
}

// Logic Edit
const isEditModalOpen = ref(false)
const isSaving = ref(false)
const editError = ref('')
const form = ref({
  meeting_number: 1,
  title: '',
  topic: '',
  meeting_date: '',
  video_url: ''
})

const openEditModal = () => {
  if(!meeting.value) return
  form.value = { ...meeting.value }
  editError.value = ''
  isEditModalOpen.value = true
}

const submitEdit = async () => {
  isSaving.value = true
  editError.value = ''
  try {
     const updated = await meetingService.updateMeeting(route.params.id, form.value)
     meeting.value = updated
     isEditModalOpen.value = false
  } catch(e) {
     editError.value = e.message
  } finally {
     isSaving.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.back-link {
  background: none;
  border: none;
  color: var(--c-primary);
  font-weight: 500;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  margin-bottom: 2rem;
  cursor: pointer;
  padding: 0;
}
.back-link:hover { text-decoration: underline; }

.flex-between { display: flex; justify-content: space-between; align-items: flex-start; gap:1rem;}
.header-content { flex: 1; }

.detail-header {
  margin-bottom: 2.5rem;
}

.admin-actions {
  display: flex;
  gap: 0.5rem;
}

.badge-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.sesi-badge {
  background-color: var(--c-danger-bg);
  color: var(--c-primary);
  border: 1px solid rgba(198,40,40,0.2);
}

.date-text { color: var(--c-text-muted); font-size: 0.9rem; font-weight: 500;}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--c-text-main);
  line-height: 1.2;
}

.topic {
  font-size: 1.1rem;
  color: var(--c-text-muted);
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--c-border);
  margin-bottom: 2rem;
  overflow-x: auto; /* Untuk responsif */
  padding-bottom: 2px;
  -ms-overflow-style: none;  /* IE/Edge hide scrollbar */
  scrollbar-width: none;  /* Firefox hide scrollbar */
}
.tabs-nav::-webkit-scrollbar {
  display: none; /* Chrome/Safari hide scrollbar */
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text-muted);
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.tab-btn:hover { color: var(--c-primary); }

.tab-btn--active {
  color: var(--c-primary);
}

.tab-btn--active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: var(--c-primary);
  border-radius: 4px 4px 0 0;
}

.tab-pane {
  min-height: 300px;
}

.video-container {
  max-width: 900px; /* Lebar wajar biar gak terlalu gede di layar Desktop ultrawide */
  margin: 0 auto;
}

.video-meta {
  max-width: 900px;
  margin: 1rem auto 0;
  display: flex;
  justify-content: flex-end;
}

/* Placeholder box */
.placeholder-box {
  background-color: var(--c-surface);
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-md);
  padding: 3rem;
  text-align: center;
  color: var(--c-text-muted);
}
.placeholder-box h3 {
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
}

/* Modal Form Styles */
.mb-1 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 1.5rem; }

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--c-text-muted);
  margin-bottom: 0.4rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background: var(--c-bg);
  color: var(--c-text-main);
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--c-primary);
}

.alert-error {
  padding: 0.75rem 1rem;
  background-color: var(--c-danger-bg);
  color: var(--c-danger);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
}

/* ==============================================
   MOBILE NATIVE STYLES
   ============================================== */
.mobile-app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -1rem -1rem 1rem -1rem; /* Negate the 1rem padding of main-content */
  padding: 0.75rem 1rem;
  background-color: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
}

.m-back-btn {
  background: transparent;
  border: none;
  color: var(--c-text-main);
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-app-bar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--c-text-main);
  margin: 0;
}

.m-app-bar-spacer {
  width: 24px;
}

.mobile-session-card {
  background-color: var(--c-surface);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
  border: 1px solid var(--c-border);
}

.m-session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.m-number-badge {
  background-color: var(--c-danger-bg);
  color: var(--c-primary);
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.m-date-text {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 500;
}

.m-session-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text-main);
  line-height: 1.3;
  margin-bottom: 0.4rem;
}

.m-session-topic {
  font-size: 0.9rem;
  color: var(--c-text-muted);
  line-height: 1.5;
}

.m-admin-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--c-border);
}

.m-icon-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  border: none;
}
.m-icon-action.edit {
  background-color: var(--c-info-bg);
  color: var(--c-info);
}
.m-icon-action.delete {
  background-color: var(--c-danger-bg);
  color: var(--c-danger);
}

@media (max-width: 768px) {
  .tabs-nav {
    position: sticky;
    top: -1rem; /* Adjust for main-content padding */
    background: var(--c-bg); /* Mask out scrolling items passing under */
    z-index: 5; /* Lower than AppHeader's 10, preventing overlapping the profile popup */
    margin-left: -1rem; /* Stretch full bleed */
    margin-right: -1rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: 0.5rem; /* Give touch area */
    border-bottom: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); /* Slight elevation shadow */
  }

  /* Make tabs identical length */
  .tab-btn {
    flex: 1;
    justify-content: center;
    font-size: 0.9rem;
    padding-left: 0.2rem;
    padding-right: 0.2rem;
  }
}
</style>
