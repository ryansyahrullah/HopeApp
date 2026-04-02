<template>
  <div class="meeting-resume-manager">
    <!-- Mahasiswa View: Tulis Resume -->
    <div v-if="isMahasiswa" class="mhs-resume-box">
      <div v-if="isLoading" class="flex-center" style="height: 250px">
        <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
      </div>
      
      <div v-else>
        <div class="flex-between mhs-header">
           <h3 class="mb-1">Tulis Resume Sesi Ini</h3>
           <StatusBadge :type="hasSaved ? 'success' : 'warning'">
             {{ hasSaved ? 'Sudah Terkumpul' : 'Belum Terkumpul' }}
           </StatusBadge>
        </div>
        
        <p class="description">Catat poin-poin penting materi yang baru kamu pelajari. Resume ini akan diperiksa oleh dosen.</p>
        
        <RichTextEditor 
          v-model="editorContent" 
          :placeholder="'Materi hari ini aku belajar...'" 
        />
        
        <div class="action-bar flex-between" style="margin-top: 1.5rem;">
           <span class="save-indicator text-success" v-if="saveSuccess" style="display: flex; align-items: center; gap: 0.25rem;"><CheckCircle2 :size="16" /> Berhasil disimpan!</span>
           <span v-else></span>
           <BaseButton variant="primary" @click="simpanResume" :disabled="isSaving">
              {{ isSaving ? 'Menyimpan...' : 'Kumpulkan Resume' }}
           </BaseButton>
        </div>
      </div>
    </div>

    <!-- Admin/Dosen View: List Kumpulan Resume dari Mahasiswa Sesi Ini -->
    <div v-if="isAdmin || isDosen" class="admin-resume-list">
       <div class="flex-between mb-2" style="align-items: flex-start;">
         <div>
           <h3 style="font-size:1.1rem; flex:1; margin-bottom: 0.75rem;">Pemantauan Resume Sesi</h3>
           <div class="resume-tabs">
              <button :class="{ active: adminViewMode === 'submitted' }" @click="adminViewMode = 'submitted'">
                Sudah Kumpul ({{ enrichedResumes.length }})
              </button>
              <button :class="{ active: adminViewMode === 'unsubmitted' }" @click="adminViewMode = 'unsubmitted'" class="danger-tab">
                Belum Kumpul ({{ unsubmittedStudents.length }})
              </button>
           </div>
         </div>
         <BaseButton variant="outline" size="sm" @click="loadAdminData" style="display:flex; align-items:center; gap:0.4rem"><RefreshCw :size="16" /> Refresh</BaseButton>
       </div>

       <div v-if="isLoading" class="flex-center" style="height: 250px">
         <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
       </div>
       
       <template v-else>
         <!-- Tampilan Sudah Kumpul -->
         <div v-if="adminViewMode === 'submitted'">
           <EmptyState 
             v-if="adminResumes.length === 0" 
             title="Belum ada resume" 
             description="Hingga saat ini belum ada mahasiswa yang mensubmit resume." 
           />
           
           <div v-else class="resume-grid animate-fade-in">
             <BaseCard v-for="(res, idx) in enrichedResumes" :key="idx" class="admin-resume-card" noPadding>
               <div class="res-card-header" style="cursor: pointer;" @click="openContactModal(res)">
                 <strong style="color: var(--c-primary); text-decoration: underline;">{{ res.full_name }}</strong>
                 <span class="badge">{{ res.nim }}</span>
               </div>
               <div class="res-card-body">
                  <div class="tiptap-content" v-html="res.content"></div>
               </div>
             </BaseCard>
           </div>
         </div>

         <!-- Tampilan Belum Kumpul -->
         <div v-if="adminViewMode === 'unsubmitted'">
           <EmptyState 
             v-if="unsubmittedStudents.length === 0" 
             title="Semua Lengkap!" 
             description="Luar biasa, seluruh mahasiswa telah mengumpulkan resume untuk sesi ini." 
           />
           
           <div v-else class="resume-grid animate-fade-in">
             <BaseCard v-for="std in unsubmittedStudents" :key="std.id" class="admin-resume-card" noPadding>
               <div class="res-card-header" style="background-color: var(--c-danger-bg); border-bottom-color: rgba(220, 38, 38, 0.2); cursor: pointer;" @click="openContactModal(std)">
                 <strong style="color: var(--c-danger); text-decoration: underline;">{{ std.full_name }}</strong>
                 <span class="badge" style="background-color: rgba(255,255,255,0.8);">{{ std.nim }}</span>
               </div>
               <div class="res-card-body" style="padding: 1.5rem; text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 120px;">
                  <p style="color: var(--c-text-muted); margin-bottom: 1rem; font-size: 0.9rem;">Mahasiswa ini belum mengirimkan resume.</p>
                  <BaseButton variant="outline" size="sm" style="margin: 0 auto; display: flex; align-items: center; gap: 0.4rem; color: var(--c-danger); border-color: var(--c-danger);" @click="openContactModal(std)">
                    Kirim Peringatan
                  </BaseButton>
               </div>
             </BaseCard>
           </div>
         </div>
       </template>
    </div>

    <ContactModal :student="selectedStudentToContact" @close="selectedStudentToContact = null" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { RefreshCw, CheckCircle2 } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { resumeService } from '@/services/resumeService'
import { profileService } from '@/services/profileService'
import RichTextEditor from '@/components/resume/RichTextEditor.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ContactModal from '@/components/common/ContactModal.vue'

const props = defineProps({
  meetingId: {
    type: String,
    required: true
  }
})

const { isAdmin, isDosen, isMahasiswa, roleName, currentUser } = useAuth()

const isLoading = ref(true)
const isSaving = ref(false)
const saveSuccess = ref(false)

// State (Mahasiswa)
const editorContent = ref('')
const hasSaved = ref(false)

// State (Admin/Dosen)
const adminResumes = ref([])
const allStudents = ref([])
const adminViewMode = ref('submitted')

const selectedStudentToContact = ref(null)
const openContactModal = (student) => {
  selectedStudentToContact.value = student
}

const enrichedResumes = computed(() => {
  return adminResumes.value.map(r => {
    const std = allStudents.value.find(u => u.id === r.student_id) || {}
    return {
       ...r,
       ...std,
       full_name: std.full_name || r.profiles?.full_name || 'Unknown',
       nim: std.nim || r.profiles?.nim || '-'
    }
  })
})

const unsubmittedStudents = computed(() => {
  return allStudents.value.filter(m => {
    return !adminResumes.value.some(r => r.student_id === m.id && r.content && r.content !== '<p></p>')
  })
})


const loadMahasiswaData = async () => {
  isLoading.value = true
  const studentId = currentUser.value?.id
  if (!studentId) {
    isLoading.value = false
    return
  }
  const res = await resumeService.getMyResumeByMeeting(props.meetingId, studentId)
  if (res) {
    editorContent.value = res.content
    hasSaved.value = true
  } else {
    editorContent.value = ''
    hasSaved.value = false
  }
  isLoading.value = false
}

const loadAdminData = async () => {
  isLoading.value = true
  const records = await resumeService.getAllResumesByMeeting(props.meetingId)
  adminResumes.value = records
  allStudents.value = await profileService.getAllStudents()
  isLoading.value = false
}

const simpanResume = async () => {
  if (!editorContent.value.trim() || editorContent.value === '<p></p>') return
  const studentId = currentUser.value?.id
  if (!studentId) return

  isSaving.value = true
  saveSuccess.value = false
  
  try {
    const saved = await resumeService.saveResume(props.meetingId, studentId, editorContent.value)
    if(saved) {
       hasSaved.value = true
       saveSuccess.value = true
       setTimeout(() => { saveSuccess.value = false }, 3000)
    }
  } catch (error) {
     console.error(error)
     alert('Gagal menyimpan resume: ' + error.message)
  } finally {
     isSaving.value = false
  }
}

const initialize = () => {
  if (!props.meetingId) return
  if (isMahasiswa.value) loadMahasiswaData()
  else loadAdminData()
}

onMounted(() => {
  initialize()
})

watch(() => props.meetingId, () => initialize())
watch(roleName, () => initialize())
</script>

<style scoped>
.mhs-header { align-items: center; margin-bottom: 0.5rem; }
.mhs-header h3 { font-size: 1.3rem; color: var(--c-text-main); }
.description { color: var(--c-text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; }

.text-success { color: var(--c-success); font-weight: 500;}

.resume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 1.5rem;
}

/* Tabs Toggle UI */
.resume-tabs {
  display: flex;
  background-color: var(--c-border);
  padding: 3px;
  border-radius: var(--radius-md);
  gap: 2px;
}
.resume-tabs button {
  border: none;
  background: transparent;
  padding: 0.4rem 0.8rem;
  border-radius: calc(var(--radius-md) - 2px);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--c-text-muted);
  transition: all 0.2s ease;
}
.resume-tabs button:hover {
  color: var(--c-text-main);
}
.resume-tabs button.active {
  background-color: var(--c-surface);
  color: var(--c-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}
.resume-tabs button.danger-tab.active {
  color: var(--c-danger);
}

.admin-resume-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.res-card-header {
  padding: 1rem 1.25rem;
  background-color: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.res-card-header strong {
  font-size: 0.95rem;
  color: var(--c-text-main);
}

.res-card-header .badge {
  font-size: 0.75rem;
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  color: var(--c-text-muted);
  font-weight: 700;
}

.res-card-body {
  padding: 0;
  max-height: 250px;
  overflow-y: auto;
  background-color: var(--c-surface);
}

.tiptap-content {
  padding: 1rem 1.25rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--c-text-main);
}
.tiptap-content :deep(ul),
.tiptap-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

@media (max-width: 768px) {
  .flex-between {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .action-bar.flex-between {
    flex-direction: column-reverse; /* Put button on top, indicator on bottom */
    gap: 0.5rem;
  }
  
  .res-card-header {
    padding: 0.75rem 1rem;
  }
  .tiptap-content {
    padding: 0.75rem 1rem;
  }
}
</style>
