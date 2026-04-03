<template>
  <div class="complete-profile-page">
    <div class="onboarding-card animate-fade-in">
      
      <div class="onboarding-header">
        <div class="logo-box">
          <GraduationCap :size="28" class="logo-icon" />
        </div>
        <h1>Lengkapi Profil Anda</h1>
        <p>Halo <strong>{{ currentUser?.full_name || 'Mahasiswa' }}</strong>! Sebelum mulai, mohon lengkapi data akademis Anda terlebih dahulu.</p>
      </div>

      <form @submit.prevent="submitProfile" class="onboarding-form">
        <div class="form-row">
          <div class="form-group">
            <label>NIM <span class="required">*</span></label>
            <input type="text" v-model="form.nim" placeholder="Cth: D0123001" required />
          </div>
          <div class="form-group">
            <label>No. Anggota HOPE</label>
            <input type="text" v-model="form.student_number" placeholder="Cth: D001" />
          </div>
        </div>

        <div class="form-group">
          <label>Jurusan <span class="required">*</span></label>
          <input type="text" v-model="form.jurusan" placeholder="Cth: Administrasi Bisnis" required />
        </div>

        <div class="form-group">
          <label>Program Studi <span class="required">*</span></label>
          <input type="text" v-model="form.prodi" placeholder="Cth: D3 Administrasi Bisnis" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Semester <span class="required">*</span></label>
            <input type="number" v-model="form.semester" min="1" max="14" placeholder="Cth: 3" required />
          </div>
          <div class="form-group">
            <label>No. WhatsApp / HP <span class="required">*</span></label>
            <input type="text" v-model="form.phone" placeholder="Cth: 08123456789" required />
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" :size="20" class="spin" />
          <CheckCircle v-else :size="20" />
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjutkan' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GraduationCap, CheckCircle, Loader2 } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { profileService } from '@/services/profileService'

const router = useRouter()
const { currentUser, refreshProfile } = useAuth()

const isSubmitting = ref(false)

const form = reactive({
  nim: '',
  student_number: '',
  jurusan: '',
  prodi: '',
  semester: '',
  phone: ''
})

onMounted(() => {
  if (currentUser.value) {
    form.nim = currentUser.value.nim || ''
    form.student_number = currentUser.value.student_number || ''
    form.jurusan = currentUser.value.jurusan || ''
    form.prodi = currentUser.value.prodi || ''
    form.semester = currentUser.value.semester || ''
    form.phone = currentUser.value.phone || ''
  }
})

const submitProfile = async () => {
  if (!currentUser.value?.id) return
  
  isSubmitting.value = true
  try {
    const updates = {
      nim: form.nim,
      student_number: form.student_number,
      jurusan: form.jurusan,
      prodi: form.prodi,
      semester: parseInt(form.semester) || null,
      phone: form.phone,
      is_registered: true // Tandai bahwa user sudah menyelesaikan onboarding
    }

    await profileService.updateProfile(currentUser.value.id, updates)
    
    // Refresh auth state globally
    await refreshProfile()
    
    // Pindah ke dashboard
    router.replace('/')
  } catch (err) {
    console.error('Gagal menyimpan profil:', err)
    alert('Terjadi kesalahan saat menyimpan profil. Silakan coba lagi.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.complete-profile-page {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(198,40,40,0.05) 0%, rgba(230,81,0,0.05) 100%), var(--c-bg);
  padding: 1.5rem;
}

.onboarding-card {
  background: var(--c-surface);
  width: 100%;
  max-width: 540px;
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
  border: 1px solid var(--c-border);
  overflow: hidden;
  padding: 2.5rem;
}

.onboarding-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-box {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  color: white;
  box-shadow: 0 10px 25px rgba(198,40,40,0.3);
  transform: rotate(-10deg);
}

.logo-icon {
  transform: rotate(10deg);
}

.onboarding-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
}

.onboarding-header p {
  color: var(--c-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.onboarding-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.required {
  color: var(--c-danger);
}

.form-group input {
  padding: 0.8rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  color: var(--c-text-main);
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(198,40,40,0.1);
  background: var(--c-surface);
}

.submit-btn {
  margin-top: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(to right, var(--c-primary), var(--c-secondary));
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(198,40,40,0.25);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(198,40,40,0.35);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .onboarding-card {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  
  .onboarding-header h1 {
    font-size: 1.5rem;
  }
}
</style>
