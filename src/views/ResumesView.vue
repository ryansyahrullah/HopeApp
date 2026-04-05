<template>
  <div class="resumes-view">
    <div class="page-header mb-2">
      <h2 class="page-title">Pemantauan Resume</h2>
      <p class="page-subtitle">Pilih mode tampilan untuk melihat pengumpulan resume mahasiswa.</p>
    </div>

    <!-- Tabs Navigation -->
    <nav class="tabs-nav animate-fade-in">
      <button 
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'rekap' }"
        @click="activeTab = 'rekap'"
      >
        <span style="display: flex; align-items: center; gap: 0.5rem;"><BarChart2 :size="18" /> Rekap</span>
      </button>
      <button 
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'detail' }"
        @click="activeTab = 'detail'"
      >
        <span style="display: flex; align-items: center; gap: 0.5rem;"><Search :size="18" /> Detail</span>
      </button>
    </nav>

    <!-- CONTENT: MATRIKS REKAP -->
    <div v-show="activeTab === 'rekap'" class="tab-pane animate-fade-in" style="animation-delay: 0.1s">
      <BaseCard>
        <div v-if="isLoading" class="flex-center" style="height: 200px">
          <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
        </div>
        
        <div v-else class="table-responsive">
          <table class="styled-table matrix-table">
            <thead>
              <tr>
                <th class="sticky-col" style="min-width: 100px;">Nama / NIM</th>
                <th v-for="meeting in sortedMeetings" :key="'h'+meeting.id" style="text-align: center;">
                  <span class="desktop-only" style="display:inline;">Sesi </span><span class="mobile-only" style="display:inline;">S</span>{{ meeting.meeting_number }}
                </th>
                <th style="min-width: 90px; text-align: center; border-left: 2px solid var(--c-border); color: var(--c-danger);">Total Kosong</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in students" :key="student.id" :class="{ 'warning-row': student.total_kosong >= 3 }">
                <td class="sticky-col">
                  <div class="clickable-student" @click="openContactModal(student)">
                    <strong class="mat-name">{{ student.full_name }}</strong><br/>
                    <span class="mat-nim" style="font-size: 0.8rem; color: var(--c-text-muted)">{{ student.nim }}</span>
                  </div>
                </td>
                <td v-for="meeting in sortedMeetings" :key="'d'+meeting.id+student.id" class="text-center">
                   <span v-if="getResumeStatus(student.id, meeting.id) === 'submitted'" title="Sudah kumpul" style="color:var(--c-success); display: inline-flex; vertical-align: middle;"><BookOpen :size="18" /></span>
                   <span v-else title="Belum kumpul" style="color:var(--c-danger); display: inline-flex; vertical-align: middle;"><XCircle :size="18" /></span>
                </td>
                <td class="text-center" style="border-left: 2px solid var(--c-border);">
                   <strong :style="{ color: student.total_kosong >= 3 ? 'var(--c-danger)' : 'var(--c-text-main)' }">{{ student.total_kosong }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="legend">
          <strong>Legenda:</strong> 
          <span><span style="color:var(--c-success); display: inline-flex; vertical-align: middle;"><BookOpen :size="16" /></span> Dikumpulkan</span>
          <span><span style="color:var(--c-danger); display: inline-flex; vertical-align: middle;"><XCircle :size="16" /></span> Kosong</span>
        </div>
      </BaseCard>
    </div>

    <!-- CONTENT: DETAIL PER SESI -->
    <div v-if="activeTab === 'detail'" class="tab-pane animate-fade-in" style="animation-delay: 0.1s">
      <div v-if="isLoading" class="flex-center" style="height: 200px">
        <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
      </div>
      
      <div v-else class="detail-container">
        <!-- Selector Sesi -->
        <div class="meeting-selector mb-2">
           <label>Pilih Sesi Pertemuan:</label>
           <BaseSelect 
             v-model="selectedMeetingId" 
             :options="meetingOptions" 
             placeholder="Pilih pertemuan..."
           />
        </div>

        <!-- Meeting Resume Manager Component (Admin View Mode) -->
        <div v-if="selectedMeetingId" class="selected-meeting-content">
           <MeetingResumeManager :meetingId="selectedMeetingId" />
        </div>
        <div v-else class="empty-hint">
           Pilih salah satu sesi di atas untuk melihat kumpulan resume dari mahasiswa.
        </div>
      </div>
    </div>

  </div>
  <ContactModal :student="selectedStudentToContact" @close="selectedStudentToContact = null" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { BarChart2, Search, BookOpen, XCircle } from 'lucide-vue-next'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import MeetingResumeManager from '@/components/resume/MeetingResumeManager.vue'
import ContactModal from '@/components/common/ContactModal.vue'

import { meetingService } from '@/services/meetingService'
import { resumeService } from '@/services/resumeService'
import { profileService } from '@/services/profileService'
import { useToast } from '@/composables/useToast'

// State Tabs & Selector
const activeTab = ref('rekap')
const selectedMeetingId = ref('')
const selectedStudentToContact = ref(null)
const { error: toastError, startWatchdog, stopWatchdog } = useToast()

const openContactModal = (student) => {
  selectedStudentToContact.value = student
}

// State Data Matrix
const isLoading = ref(true)
const meetings = ref([])
const allResumes = ref([])
const students = ref([])

const sortedMeetings = computed(() => {
  return [...meetings.value].sort((a,b) => a.meeting_number - b.meeting_number)
})

// Options list buat BaseSelect
const meetingOptions = computed(() => {
  return sortedMeetings.value.map(m => ({
    label: `Sesi ${m.meeting_number} - ${m.title}`,
    value: m.id
  }))
})

const loadData = async () => {
  isLoading.value = true
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
    meetings.value = await meetingService.getMeetings()
    allResumes.value = await resumeService.getAllResumes()
    
    const rawStudents = await profileService.getAllStudents()
    students.value = rawStudents.map(student => {
      let total_kosong = 0
      meetings.value.forEach(m => {
        const record = allResumes.value.find(r => r.student_id === student.id && r.meeting_id === m.id)
        if (!record || !record.content || record.content === '<p></p>') {
           total_kosong++
        }
      })
      return { ...student, total_kosong }
    })
    
    // Auto-select the first meeting in Detail tab if available
    if (sortedMeetings.value.length > 0) {
       selectedMeetingId.value = sortedMeetings.value[0].id
    }
  } catch (e) {
    console.error(e)
    toastError('Gagal memuat data resume: ' + e.message)
  } finally {
    isLoading.value = false
    stopWatchdog()
  }
}

const getResumeStatus = (studentId, meetingId) => {
  const record = allResumes.value.find(r => r.student_id === studentId && r.meeting_id === meetingId)
  if (record && record.content && record.content !== '<p></p>') {
     return 'submitted'
  }
  return 'empty'
}

onMounted(() => {
  loadData()
})
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

/* Tabs Styles */
.tabs-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--c-border);
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 2px;
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

/* Detail View Styles */
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.meeting-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--c-surface);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  max-width: 600px;
  border: 1px solid var(--c-border);
}

.meeting-selector label {
  font-weight: 600;
  color: var(--c-text-main);
  white-space: nowrap;
}

@media (max-width: 768px) {
  .meeting-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 1rem;
  }
  .meeting-selector label {
    font-size: 0.95rem;
  }
}

.empty-hint {
  text-align: center;
  padding: 3rem;
  color: var(--c-text-muted);
  border: 1px dashed var(--c-border);
  border-radius: var(--radius-md);
}

/* Matrix Table Styles */
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

.warning-row {
  background-color: rgba(220, 38, 38, 0.05);
}
.warning-row td.sticky-col {
  background-color: #fef2f2;
}
.warning-row:hover {
  background-color: rgba(220, 38, 38, 0.1);
}

.text-center { text-align: center; }

.legend {
  margin-top: 1.5rem;
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: var(--c-text-muted);
}

.clickable-student {
  cursor: pointer;
  transition: opacity 0.2s;
}
.clickable-student:hover .mat-name {
  color: var(--c-primary);
  text-decoration: underline;
}
.clickable-student:active {
  opacity: 0.7;
}

@media (max-width: 768px) {
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
}
</style>



