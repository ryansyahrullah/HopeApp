<template>
  <div class="presensi-checklist">
    <!-- State Loading -->
    <div v-if="isLoading" class="flex-center" style="height: 150px">
      <span class="loader" style="border-top-color: var(--c-primary); width: 40px; height: 40px;"></span>
    </div>

    <template v-else>
      <div v-if="isAdmin || isDosen" class="checklist-admin-view">
        <div class="flex-between mb-2">
          <h3>{{ isAdmin ? 'Checklist Presensi Kelas' : 'Rekap Kehadiran Sesi Ini' }}</h3>
          <div v-if="isAdmin" style="display: flex; gap: 0.75rem;">
            <BaseButton variant="outline" size="sm" @click="tandaiSemuaHadir" :disabled="isSaving" style="display:flex; align-items:center; gap:0.4rem">
              <CheckCircle :size="16" /> Hadir Semua
            </BaseButton>
            <BaseButton variant="primary" size="sm" @click="simpanPresensi" :disabled="isSaving">
              {{ isSaving ? 'Menyimpan...' : 'Simpan Presensi' }}
            </BaseButton>
          </div>
        </div>
        
        <div v-if="saveSuccess" class="alert-success mb-2" style="display: flex; align-items: center; gap: 0.5rem">
           <CheckCircle :size="18" /> Data presensi berhasil disimpan!
        </div>

        <!-- =============================================
             TABLE VIEW (DESKTOP ONLY)
             ============================================= -->
        <div class="table-responsive desktop-only">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Mahasiswa</th>
                <th>Status</th>
                <th>Catatan (Opsional)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in localRecords" :key="record.student_id">
                <td>
                  <div class="student-info">
                    <strong>{{ record.student_name }}</strong>
                    <span class="nim">{{ record.nim }}</span>
                  </div>
                </td>
                <td>
                  <div class="status-toggles" v-if="isAdmin">
                    <label class="toggle-btn" :class="{ 'active-hadir': record.status === 'hadir' }">
                      <input type="radio" v-model="record.status" value="hadir" @change="record.is_present = true"> Hadir (H)
                    </label>
                    <label class="toggle-btn" :class="{ 'active-alpa': record.status === 'alpa' }">
                      <input type="radio" v-model="record.status" value="alpa" @change="record.is_present = false"> Alpa (A)
                    </label>
                  </div>
                  <div v-else>
                     <StatusBadge :type="record.status === 'hadir' ? 'success' : (record.status === 'alpa' ? 'danger' : 'warning')">
                        {{ record.status ? record.status.toUpperCase() : 'BELUM DIISI' }}
                     </StatusBadge>
                  </div>
                </td>
                <td>
                  <input v-if="isAdmin" type="text" v-model="record.note" placeholder="Keterangan..." class="form-input" style="padding: 0.4rem; font-size: 0.85rem;">
                  <span v-else style="font-size: 0.85rem; color: var(--c-text-muted);">{{ record.note || '-' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- =============================================
             CARD LIST VIEW (MOBILE ONLY)
             ============================================= -->
        <div class="mobile-presensi-list mobile-only animate-fade-in">
          <div v-for="record in localRecords" :key="'mob-'+record.student_id" class="m-presensi-card">
            <div class="m-presensi-header">
               <div class="m-student-info">
                 <strong class="m-student-name">{{ record.student_name }}</strong>
                 <span class="m-student-nim">{{ record.nim }}</span>
               </div>
               
               <!-- Toggles di kanan atas card -->
               <div class="status-toggles m-toggles" v-if="isAdmin">
                  <label class="toggle-btn" :class="{ 'active-hadir': record.status === 'hadir' }">
                    <input type="radio" v-model="record.status" value="hadir" @change="record.is_present = true"> H
                  </label>
                  <label class="toggle-btn" :class="{ 'active-alpa': record.status === 'alpa' }">
                    <input type="radio" v-model="record.status" value="alpa" @change="record.is_present = false"> A
                  </label>
                </div>
                <div v-else>
                  <StatusBadge :type="record.status === 'hadir' ? 'success' : (record.status === 'alpa' ? 'danger' : 'warning')" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">
                    {{ record.status ? record.status.toUpperCase() : 'KOSONG' }}
                  </StatusBadge>
                </div>
            </div>
            
            <div class="m-presensi-footer" v-if="isAdmin || record.note">
               <input v-if="isAdmin" type="text" v-model="record.note" placeholder="Tambah catatan keterangan..." class="form-input m-note-input">
               <div v-else style="font-size: 0.85rem; color: var(--c-text-muted);">
                 <strong>Catatan:</strong> {{ record.note }}
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mahasiswa View (Read Only) -->
      <div v-else class="checklist-mhs-view">
         <BaseCard class="status-card" v-if="myRecord">
            <h3>Status Kehadiranmu</h3>
             <div class="my-status-display">
                <StatusBadge v-if="myRecord.status === 'hadir'" type="success">HADIR</StatusBadge>
                <StatusBadge v-else type="danger">ALPA / BELUM DIABSEN</StatusBadge>
             </div>
             <p v-if="myRecord.note" class="note-box">Catatan Dosen: {{ myRecord.note }}</p>
         </BaseCard>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { CheckCircle } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { presensiService } from '@/services/presensiService'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  meetingId: {
    type: String,
    required: true
  }
})

const { isAdmin, isDosen, roleName, currentUser } = useAuth()
const { success: toastSuccess, error: toastError, startWatchdog, stopWatchdog } = useToast()

const isLoading = ref(true)
const isSaving = ref(false)
const saveSuccess = ref(false)

const localRecords = ref([])

const myRecord = computed(() => {
  // Gunakan ID user yang sedang login
  return localRecords.value.find(r => r.student_id === currentUser.value?.id)
})

const loadData = async () => {
  isLoading.value = true
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
    const data = await presensiService.getPresensiByMeeting(props.meetingId)
    // Deep copy agar edit tidak langsung bocor ke memori global
    localRecords.value = JSON.parse(JSON.stringify(data))
  } catch (err) {
    console.error(err)
    toastError('Gagal memuat data presensi: ' + err.message)
  } finally {
    isLoading.value = false
    stopWatchdog()
  }
}

const simpanPresensi = async () => {
  // Hanya simpan data yang statusnya tidak kosong (sudah ditentukan H atau A)
  const dataToSave = localRecords.value.filter(r => r.status)
  
  isSaving.value = true
  saveSuccess.value = false
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
    await presensiService.savePresensiBatch(props.meetingId, dataToSave)
    saveSuccess.value = true
    toastSuccess('Data presensi berhasil disimpan!')
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (err) {
    console.error(err)
    toastError('Gagal menyimpan presensi: ' + err.message)
  } finally {
    isSaving.value = false
    stopWatchdog()
  }
}

const tandaiSemuaHadir = () => {
  localRecords.value.forEach(record => {
    record.status = 'hadir'
    record.is_present = true
  })
}

watch(() => props.meetingId, () => {
  if(props.meetingId) loadData()
})

// Jika ganti role dari simulator, load ulang aja
watch(roleName, () => { loadData() })

onMounted(() => {
  if (props.meetingId) loadData()
})
</script>

<style scoped>
.mb-2 { margin-bottom: 1rem; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }

h3 {
  color: var(--c-text-main);
  font-size: 1.2rem;
}

.table-responsive {
  overflow-x: auto;
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  background: var(--c-surface);
}

.styled-table th, .styled-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
}

.styled-table th {
  background-color: var(--c-bg);
  font-weight: 600;
  color: var(--c-text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-info .nim {
  font-size: 0.8rem;
  color: var(--c-text-muted);
}

.status-toggles {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.toggle-btn {
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  background-color: var(--c-surface);
  color: var(--c-text-muted);
  transition: all 0.2s;
}

.toggle-btn input[type="radio"] {
  display: none;
}

/* Active states for toggles */
.toggle-btn.active-hadir { background-color: var(--c-success-bg); color: var(--c-success); border-color: var(--c-success); }
.toggle-btn.active-alpa { background-color: var(--c-danger-bg); color: var(--c-danger); border-color: var(--c-danger); }

.form-input {
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  background-color: var(--c-bg);
  color: var(--c-text-main);
  outline: none;
  width: 100%;
}
.form-input:focus { border-color: var(--c-primary); }

.alert-success {
  background-color: var(--c-success-bg);
  color: var(--c-success);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 500;
}

.status-card {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.my-status-display {
  margin: 1.5rem 0;
  transform: scale(1.2);
}

.note-box {
  background-color: var(--c-bg);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  border-left: 3px solid var(--c-warning);
}

/* ==============================================
   MOBILE STYLES FOR PRESENSI
   ============================================== */
.mobile-presensi-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.m-presensi-card {
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: 0 2px 8px -4px rgba(0,0,0,0.05);
}

.m-presensi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.m-student-info {
  display: flex;
  flex-direction: column;
}

.m-student-name {
  font-size: 1rem;
  color: var(--c-text-main);
  line-height: 1.2;
}

.m-student-nim {
  font-size: 0.8rem;
  color: var(--c-text-muted);
}

.m-toggles .toggle-btn {
  padding: 0.4rem 0.8rem; /* Make it more touch friendly / square-ish */
}

.m-presensi-footer {
  border-top: 1px dashed var(--c-border);
  padding-top: 0.75rem;
}

.m-note-input {
  padding: 0.6rem;
  font-size: 0.85rem;
  border-radius: 6px;
  background-color: var(--c-bg);
}

@media (max-width: 768px) {
  .checklist-admin-view .flex-between {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}
</style>



