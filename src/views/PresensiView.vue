<template>
  <div class="presensi-view">
    <div class="page-header mb-2" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
      <div>
        <h2 class="page-title">Rekap Presensi Lengkap</h2>
        <p class="page-subtitle">Matriks kehadiran seluruh mahasiswa pada setiap sesi pertemuan.</p>
      </div>
      <BaseButton @click="exportToExcel" :disabled="isLoading || students.length === 0" variant="outline">
        <Download :size="16" style="margin-right: 0.5rem;" />
        Export Excel
      </BaseButton>
    </div>

    <!-- Matrix Presensi -->
    <BaseCard>
      <div v-if="isLoading">
        <PageSkeleton variant="table" :count="8" />
      </div>
      
      <div v-else class="table-responsive animate-fade-in">
        <table class="styled-table matrix-table">
          <thead>
            <tr>
              <th class="sticky-col" style="min-width: 100px;">Nama / NIM</th>
              <th v-for="meeting in sortedMeetings" :key="'h'+meeting.id" style="text-align: center;">
                <span class="desktop-only" style="display:inline;">Sesi </span><span class="mobile-only" style="display:inline;">S</span>{{ meeting.meeting_number }}
              </th>
              <th style="text-align: center; border-left: 2px solid var(--c-border); color: var(--c-danger);">Total Alpa</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in students" :key="student.id" :class="{ 'warning-row': student.total_alpa >= 3 }">
              <td class="sticky-col">
                <div class="clickable-student" @click="openContactModal(student)">
                  <strong class="mat-name">{{ student.full_name }}</strong><br/>
                  <span class="mat-nim" style="font-size: 0.8rem; color: var(--c-text-muted)">{{ student.nim }}</span>
                </div>
              </td>
              <td v-for="meeting in sortedMeetings" :key="'d'+meeting.id+student.id" class="text-center">
                 <span v-html="getPresensiIcon(student.id, meeting.id)" style="font-size: 0.95rem;"></span>
              </td>
              <td class="text-center" style="border-left: 2px solid var(--c-border);">
                 <strong :style="{ color: student.total_alpa >= 3 ? 'var(--c-danger)' : 'var(--c-text-main)' }">{{ student.total_alpa }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="legend">
        <strong>Legenda:</strong> 
        <span><span style="color:var(--c-success); font-weight:bold;">H</span> Hadir</span>
        <span><span style="color:var(--c-danger); font-weight:bold;">A</span> Alpa</span>
        <span><span style="color:var(--c-text-muted); font-weight:bold;">-</span> Belum Diabsen</span>
      </div>
    </BaseCard>

    <ContactModal :student="selectedStudentToContact" @close="selectedStudentToContact = null" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import ContactModal from '@/components/common/ContactModal.vue'
import { meetingService } from '@/services/meetingService'
import { presensiService } from '@/services/presensiService'
import { profileService } from '@/services/profileService'
import PageSkeleton from '@/components/common/PageSkeleton.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { Download } from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import { useToast } from '@/composables/useToast'

const isLoading = ref(true)
const meetings = ref([])
const presensiRecords = ref([])
const students = ref([])
const { error: toastError, startWatchdog, stopWatchdog } = useToast()

const selectedStudentToContact = ref(null)
const openContactModal = (student) => {
  selectedStudentToContact.value = student
}

const sortedMeetings = computed(() => {
  return [...meetings.value].sort((a,b) => a.meeting_number - b.meeting_number)
})

const loadMatrix = async () => {
  isLoading.value = true
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
    meetings.value = await meetingService.getMeetings()
    presensiRecords.value = await presensiService.getAllPresensi()
    
    const rawStudents = await profileService.getAllStudents()
    students.value = rawStudents.map(student => {
       let total_alpa = 0;
       meetings.value.forEach(m => {
          const record = presensiRecords.value.find(r => r.student_id === student.id && r.meeting_id === m.id)
          if (record && record.status === 'alpa') total_alpa++;
       })
       return { ...student, total_alpa }
    })
    
  } catch (e) {
    console.error(e)
    toastError('Gagal memuat rekap presensi: ' + e.message)
  } finally {
    isLoading.value = false
    stopWatchdog()
  }
}

const getPresensiIcon = (studentId, meetingId) => {
  const record = presensiRecords.value.find(r => r.student_id === studentId && r.meeting_id === meetingId)
  if (!record || !record.status) return '<span style="color:var(--c-text-muted); font-weight:bold;">-</span>'
  
  if (record.status === 'hadir') return '<span style="color:var(--c-success); font-weight:bold;">H</span>'
  return '<span style="color:var(--c-danger); font-weight:bold;">A</span>'
}

const exportToExcel = () => {
  const exportData = students.value.map(student => {
    const row = {
      'Nama': student.full_name,
      'NIM': student.nim,
      'No. Anggota': student.student_number || '-'
    }
    
    sortedMeetings.value.forEach(meeting => {
      const record = presensiRecords.value.find(r => r.student_id === student.id && r.meeting_id === meeting.id)
      let statusStr = '-'
      if (record && record.status) {
        if (record.status === 'hadir') statusStr = 'Hadir'
        else if (record.status === 'alpa') statusStr = 'Alpa'
        else if (record.status === 'sakit') statusStr = 'Sakit'
        else if (record.status === 'izin') statusStr = 'Izin'
      }
      row[`Sesi ${meeting.meeting_number}`] = statusStr
    })
    
    row['Total Alpa'] = student.total_alpa
    return row
  })

  // Format header styles by manually building worksheet or just let util json_to_sheet do it
  const ws = XLSX.utils.json_to_sheet(exportData)
  
  // Set col widths
  ws['!cols'] = [
    { wch: 30 }, // Nama
    { wch: 15 }, // NIM
    { wch: 15 }, // No. Anggota
  ]
  // Add width for each meeting col
  sortedMeetings.value.forEach(() => {
    ws['!cols'].push({ wch: 8 })
  })
  ws['!cols'].push({ wch: 12 }) // Total alpa
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi")
  XLSX.writeFile(wb, "Rekap_Presensi_HopeApp.xlsx")
}

onMounted(() => {
  loadMatrix()
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

.warning-row {
  background-color: rgba(220, 38, 38, 0.05); /* very light pastel red */
}
.warning-row td.sticky-col {
  background-color: #fef2f2; /* keep the sticky column colored explicitly so it doesn't become transparent over scrolling content */
}
.warning-row:hover {
  background-color: rgba(220, 38, 38, 0.1);
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



