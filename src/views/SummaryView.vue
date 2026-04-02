<template>
  <div class="summary-view">
    <div class="page-header mb-2">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 class="page-title">Ringkasan Eksekutif</h2>
          <p class="page-subtitle" v-if="!isLoading">Akumulasi untuk total <strong>{{ meetings.length }} Sesi Pertemuan</strong> dan <strong>{{ students.length }} Mahasiswa</strong>.</p>
        </div>
        
        <div class="view-tabs" v-if="!isLoading">
          <button :class="{ active: viewMode === 'presensi' }" @click="viewMode = 'presensi'">
            Rekap Presensi
          </button>
          <button :class="{ active: viewMode === 'resume' }" @click="viewMode = 'resume'">
            Rekap Resume
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="flex-center" style="height: 300px">
      <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
    </div>

    <div v-else class="summary-container animate-fade-in">
      
      <!-- Tabel Presensi -->
      <BaseCard v-if="viewMode === 'presensi'">
         <div class="table-responsive animate-fade-in">
           <table class="styled-table matrix-table">
             <thead>
               <tr>
                 <th class="sticky-col" style="min-width: 100px;">Nama / NIM</th>
                 <th class="text-center" style="color: var(--c-success);">Total Hadir</th>
                 <th class="text-center" style="color: var(--c-danger);">Total Alpa</th>
               </tr>
             </thead>
             <tbody>
               <tr v-for="std in studentSummaries" :key="std.id" :class="{ 'warning-row': std.alpa >= 3 }">
                 <td class="sticky-col">
                   <div class="clickable-student" @click="openContactModal(std)">
                     <strong class="mat-name">{{ std.full_name }}</strong><br/>
                     <span class="mat-nim" style="font-size: 0.8rem; color: var(--c-text-muted)">{{ std.nim }}</span>
                   </div>
                 </td>
                 <td class="text-center">
                    <span style="font-weight: 600; color: var(--c-text-main);">{{ std.hadir }}</span>
                 </td>
                 <td class="text-center">
                    <strong :style="{ color: std.alpa > 0 ? 'var(--c-danger)' : 'var(--c-text-main)' }">{{ std.alpa }}</strong>
                 </td>
               </tr>
             </tbody>
           </table>
         </div>
      </BaseCard>

      <!-- Tabel Resume -->
      <BaseCard v-else-if="viewMode === 'resume'">
         <div class="table-responsive animate-fade-in">
           <table class="styled-table matrix-table">
             <thead>
               <tr>
                 <th class="sticky-col" style="min-width: 100px;">Nama / NIM</th>
                 <th class="text-center" style="color: var(--c-success);">Total Kumpul</th>
                 <th class="text-center" style="color: var(--c-danger);">Total Kosong</th>
               </tr>
             </thead>
             <tbody>
               <tr v-for="std in studentSummaries" :key="'r'+std.id" :class="{ 'warning-row': std.resumeKosong >= 3 }">
                 <td class="sticky-col">
                   <div class="clickable-student" @click="openContactModal(std)">
                     <strong class="mat-name">{{ std.full_name }}</strong><br/>
                     <span class="mat-nim" style="font-size: 0.8rem; color: var(--c-text-muted)">{{ std.nim }}</span>
                   </div>
                 </td>
                 <td class="text-center">
                    <span style="font-weight: 600; color: var(--c-text-main);">{{ std.resumeKumpul }}</span>
                 </td>
                 <td class="text-center">
                    <strong :style="{ color: std.resumeKosong > 0 ? 'var(--c-danger)' : 'var(--c-text-main)' }">{{ std.resumeKosong }}</strong>
                 </td>
               </tr>
             </tbody>
           </table>
         </div>
      </BaseCard>

    </div>

    <ContactModal :student="selectedStudentToContact" @close="selectedStudentToContact = null" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { MonitorPlay, Users, CalendarCheck, BookOpen } from 'lucide-vue-next'
import BaseCard from '@/components/common/BaseCard.vue'
import ContactModal from '@/components/common/ContactModal.vue'

import { meetingService } from '@/services/meetingService'
import { presensiService } from '@/services/presensiService'
import { resumeService } from '@/services/resumeService'
import { profileService } from '@/services/profileService'

const isLoading = ref(true)
const viewMode = ref('presensi')
const selectedStudentToContact = ref(null)

const openContactModal = (student) => {
  selectedStudentToContact.value = student
}

const meetings = ref([])
const students = ref([])
const allPresensi = ref([])
const allResumes = ref([])

const loadData = async () => {
  isLoading.value = true
  try {
    meetings.value = await meetingService.getMeetings()
    allPresensi.value = await presensiService.getAllPresensi()
    allResumes.value = await resumeService.getAllResumes()
    
    students.value = await profileService.getAllStudents()
  } catch(e) {
    console.error(e)
    alert('Gagal memuat ringkasan eksekutif: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

const studentSummaries = computed(() => {
  return students.value.map(student => {
    let hadir = 0
    let alpa = 0
    
    // Check presensi for this student
    meetings.value.forEach(m => {
      const record = allPresensi.value.find(p => p.student_id === student.id && p.meeting_id === m.id)
      if (record) {
        if (record.is_present || record.status === 'hadir') hadir++
        else if (record.status === 'alpa') alpa++
      }
    })
    
    let resumeKumpul = 0
    let resumeKosong = 0
    
    // Check resumes for this student
    meetings.value.forEach(m => {
      const record = allResumes.value.find(r => r.student_id === student.id && r.meeting_id === m.id)
      if (record && record.content && record.content !== '<p></p>') {
        resumeKumpul++
      } else {
        resumeKosong++
      }
    })
    
    // Flag if >= 3 alpa or empty
    const isWarning = alpa >= 3 || resumeKosong >= 3
    
    return {
      ...student,
      hadir,
      alpa,
      resumeKumpul,
      resumeKosong,
      isWarning
    }
  })
})

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

.summary-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-tabs {
  display: flex;
  background-color: var(--c-border);
  padding: 3px;
  border-radius: var(--radius-md);
  gap: 2px;
}
.view-tabs button {
  border: none;
  background: transparent;
  padding: 0.5rem 1rem;
  border-radius: calc(var(--radius-md) - 2px);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--c-text-muted);
  transition: all 0.2s ease;
}
.view-tabs button:hover {
  color: var(--c-text-main);
}
.view-tabs button.active {
  background-color: var(--c-surface);
  color: var(--c-primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

/* Table Overrides */
.table-responsive {
  overflow-x: auto;
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
