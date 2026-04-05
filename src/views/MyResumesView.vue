<template>
  <div class="my-resumes-page">
    <div class="page-header mb-2">
      <h2 class="page-title">Resume</h2>
      <p class="page-subtitle">Selesaikan resume catatanmu langsung berdasarkan sesi materi di sini.</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex-center" style="height: 200px">
      <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
    </div>

    <template v-else>
      <div v-if="meetings.length === 0">
         <EmptyState 
           title="Belum ada sesi pertemuan" 
           description="Sesi pertemuan belum dibuat oleh admin/dosen."
         />
      </div>

      <div v-else class="detail-container animate-fade-in">
        <!-- Selector Sesi -->
        <div class="meeting-selector mb-2">
           <label>Pilih Sesi Pertemuan:</label>
           <BaseSelect 
             v-model="selectedMeetingId" 
             :options="meetingOptions" 
             placeholder="Pilih pertemuan..."
           />
        </div>

        <!-- Editor Resume -->
        <div v-if="selectedMeetingId" class="selected-meeting-content">
           <MeetingResumeManager :meetingId="selectedMeetingId" />
        </div>
        <div v-else class="empty-hint">
           Pilih salah satu sesi di atas untuk menulis atau melihat resume-mu.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { meetingService } from '@/services/meetingService'
import BaseSelect from '@/components/common/BaseSelect.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MeetingResumeManager from '@/components/resume/MeetingResumeManager.vue'
import { useToast } from '@/composables/useToast'

const isLoading = ref(true)
const selectedMeetingId = ref('')
const meetings = ref([])
const { error: toastError, startWatchdog, stopWatchdog } = useToast()

const sortedMeetings = computed(() => {
  return [...meetings.value].sort((a,b) => a.meeting_number - b.meeting_number)
})

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
      
      // Auto-select latest or first if available
      if (sortedMeetings.value.length > 0) {
         selectedMeetingId.value = sortedMeetings.value[0].id
      }
   } catch (e) {
      console.error(e)
      toastError('Gagal memuat sesi pertemuan: ' + e.message)
   } finally {
      isLoading.value = false
      stopWatchdog()
   }
}

onMounted(() => loadData())
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
</style>



