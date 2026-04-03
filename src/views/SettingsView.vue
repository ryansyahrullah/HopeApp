<template>
  <div class="settings-view">
    
    <div class="page-header mb-2" v-if="!activeMenu">
      <h2 class="page-title">Pengaturan Akun</h2>
      <p class="page-subtitle">Kelola informasi kredensial dan keamanan Anda.</p>
    </div>

    <!-- MAIN MENU LIST -->
    <div v-if="!activeMenu" class="settings-list-container animate-fade-in">
      
      <p class="section-label">AKUN</p>
      <div class="menu-card" @click="activeMenu = 'email'">
        <div class="icon-box" style="background-color: var(--c-info-bg); color: var(--c-info);">
          <Mail class="icon-lucide" />
        </div>
        <div class="menu-text-stack">
          <span class="label-text">Email</span>
          <span class="val-text">{{ userEmail }}</span>
        </div>
        <div class="action-bubble">
          <PencilLine class="action-icon" size="18" />
        </div>
      </div>

      <p class="section-label mt-4">KEAMANAN AKUN</p>
      <div class="menu-card" @click="activeMenu = 'password'">
        <div class="icon-box" style="background-color: var(--c-warning-bg); color: #d97706;">
          <LockKeyhole class="icon-lucide" />
        </div>
        <div class="menu-text-stack">
          <span class="val-text" style="margin-bottom: 0;">{{ hasPassword ? 'Ubah Kata Sandi' : 'Buat Kata Sandi' }}</span>
          <span class="label-text" style="font-size: 0.8rem;">{{ hasPassword ? 'Perbarui kata sandi akun Anda' : 'Buat sandi untuk login alternatif' }}</span>
        </div>
        <ChevronRight class="action-icon-plain" />
      </div>

      <div class="info-banner" style="background-color: var(--c-success-bg); color: var(--c-success); border: 1px solid rgba(34, 197, 94, 0.3);">
        <ShieldCheck class="banner-icon" />
        <p>Gunakan kata sandi yang kuat dan unik untuk menjaga keamanan akun Anda.</p>
      </div>

      <p class="app-version-label">HopeApp POLIBAN — Versi 1.12.5</p>
      
    </div>

    <!-- SUB-MENU: EMAIL -->
    <div v-else-if="activeMenu === 'email'" class="detail-page animate-fade-in">
      <div class="detail-header-bar">
        <button class="back-btn-box" @click="activeMenu = null">
          <ChevronLeft :size="20" />
        </button>
        <h2 class="header-title">Ubah Email</h2>
      </div>

      <div class="detail-form-card">
        <h3 class="card-heading">Ganti Email</h3>
        <p class="card-desc">Masukkan password Anda saat ini dan email baru yang ingin digunakan.</p>

        <form @submit.prevent="saveEmail" class="app-form mt-4">
          <div class="form-group">
            <label>Password Saat Ini</label>
            <input type="password" placeholder="********" required />
          </div>
          <div class="form-group">
            <label>Email Baru</label>
            <input type="email" v-model="newEmail" placeholder="contoh@poliban.ac.id" required />
          </div>

          <button type="submit" class="save-btn primary-btn" :disabled="isSavingEmail">
            {{ isSavingEmail ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
          
          <div v-if="emailMsg" class="alert-msg success">{{ emailMsg }}</div>
        </form>
      </div>
    </div>

    <!-- SUB-MENU: KATA SANDI -->
    <div v-else-if="activeMenu === 'password'" class="detail-page animate-fade-in">
      <div class="detail-header-bar">
        <button class="back-btn-box" @click="activeMenu = null">
          <ChevronLeft :size="20" />
        </button>
        <h2 class="header-title">{{ hasPassword ? 'Ubah Kata Sandi' : 'Buat Kata Sandi' }}</h2>
      </div>

      <!-- Header Pagination/Steps -->
      <div class="step-indicator">
        <div class="step dot active"></div>
        <div class="step dot"></div>
        <div class="step dot"></div>
      </div>

      <div class="detail-form-card">
        <h3 class="card-heading">{{ hasPassword ? 'Perbarui Sandi' : 'Amankan Akun' }}</h3>
        <p class="card-desc">
          Pastikan sandi baru Anda panjang (minimal 8 karakter) dan tidak mudah ditebak.
        </p>

        <form @submit.prevent="updatePassword" class="app-form mt-4">
          <div class="form-group" v-if="hasPassword">
            <label>Password Saat Ini</label>
            <input type="password" v-model="oldPassword" placeholder="********" required />
          </div>
          <div class="form-group">
            <label>Password Baru</label>
            <input type="password" v-model="newPassword" placeholder="Buat sandi yang kuat" required />
          </div>
          <div class="form-group">
            <label>Konfirmasi Password</label>
            <input type="password" v-model="confirmPassword" placeholder="Ketik ulang sandi" required />
          </div>

          <button type="submit" class="save-btn primary-btn" :disabled="isSaving">
             {{ isSaving ? 'Memproses...' : 'Simpan Sandi' }}
          </button>
          
          <div v-if="message" :class="['alert-msg', messageType]">{{ message }}</div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Mail, LockKeyhole, ShieldCheck, PencilLine, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'

const { currentUser, session, updateEmail: authUpdateEmail, updatePassword: authUpdatePassword, signInWithEmail } = useAuth()

const activeMenu = ref(null)

const userEmail = ref('')
const hasPassword = ref(false)

// Cek data user saat komponen diload
onMounted(() => {
  if (currentUser.value?.email) {
    userEmail.value = currentUser.value.email
  }
  
  // Cek apakah user menggunakan provider 'email' (punya password)
  if (session.value?.user?.app_metadata?.providers) {
    const providers = session.value.user.app_metadata.providers;
    hasPassword.value = providers.includes('email');
  }
})

watch(() => currentUser.value?.email, (newVal) => {
  if (newVal) userEmail.value = newVal
})

// Forms
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const newEmail = ref('')

const isSavingEmail = ref(false)
const emailMsg = ref('')

const isSaving = ref(false)
const message = ref('')
const messageType = ref('')

const saveEmail = async () => {
  if (!newEmail.value) return;
  isSavingEmail.value = true;
  emailMsg.value = '';
  try {
    await authUpdateEmail(newEmail.value);
    emailMsg.value = 'Permintaan penggantian email berhasil dikirim. Silakan cek masuk (inbox) di email baru dan lama Anda untuk konfirmasi.';
    setTimeout(() => { emailMsg.value = ''; newEmail.value = ''; }, 6000);
  } catch (error) {
    emailMsg.value = 'Gagal mengganti email: ' + error.message;
  } finally {
    isSavingEmail.value = false;
  }
}

const updatePassword = async () => {
  message.value = '';
  
  // Validasi Panjang Sandi
  if (newPassword.value.length < 6) {
    messageType.value = 'error';
    message.value = 'Sandi baru harus minimal 6 karakter.';
    return;
  }

  // Validasi Kecocokan
  if (newPassword.value !== confirmPassword.value) {
    messageType.value = 'error';
    message.value = 'Sandi baru dan Konfirmasi wajib sama.';
    return;
  }
  
  isSaving.value = true;
  try {
    // Jika user sudah punya password, pastikan password lama benar dengan cara relogin diam-diam
    if (hasPassword.value) {
      if (!oldPassword.value) {
        throw new Error('Masukkan password saat ini.');
      }
      try {
        await signInWithEmail(currentUser.value.email, oldPassword.value);
      } catch (err) {
        throw new Error('Password saat ini salah.');
      }
    }

    // Update password di Auth
    await authUpdatePassword(newPassword.value);
    
    messageType.value = 'success';
    message.value = hasPassword.value ? 'Kata sandi berhasil diperbarui!' : 'Kata sandi berhasil dibuat!';
    
    // Setel state hasPassword jadi true untuk ke depannya
    hasPassword.value = true;
    
    oldPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => { message.value = '' }, 3000);
  } catch (error) {
    messageType.value = 'error';
    message.value = error.message.includes('Password saat ini salah') ? error.message : 'Gagal: ' + error.message;
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
/* Container Inti */
.settings-view {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}
.page-subtitle {
  color: var(--c-text-muted);
  font-size: 0.95rem;
}

/* Typography Helpers */
.section-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--c-text-muted);
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
  margin-left: 0.2rem;
}

.mt-4 { margin-top: 1.5rem; }

/* Menu Cards */
.settings-list-container {
  display: flex;
  flex-direction: column;
}

.menu-card {
  display: flex;
  align-items: center;
  background: var(--c-surface);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  margin-bottom: 1rem;
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.menu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 1rem;
}

.icon-lucide {
  width: 20px;
  height: 20px;
}

.menu-text-stack {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* Penting untuk truncate */
  margin-right: 0.5rem;
}

.label-text {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.val-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--c-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-bubble {
  background: var(--c-bg);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-text-muted);
  flex-shrink: 0; /* Cegah penyusutan elemen ini */
}

.action-icon-plain {
  color: #CBD5E1;
  flex-shrink: 0;
}

/* Banner Alert */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 0;
}

.info-banner p {
  font-size: 0.85rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
}

.banner-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

/* ====================================
   DETAIL PAGES
   ==================================== */
.detail-page {
  display: flex;
  flex-direction: column;
}

.detail-header-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0 2rem 0;
  color: var(--c-text-main);
}

.back-btn-box {
  width: 36px;
  height: 36px;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  color: var(--c-text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn-box:hover {
  background: var(--c-surface);
  color: var(--c-primary);
  border-color: var(--c-primary);
}

.header-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #E2E8F0;
}
.dot.active {
  width: 20px;
  border-radius: 10px;
  background: var(--c-primary);
}

/* Form Card */
.detail-form-card {
  background: var(--c-surface);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 1px solid var(--c-border);
}

.card-heading {
  font-size: 1.35rem;
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
}

.card-desc {
  font-size: 0.95rem;
  color: var(--c-text-muted);
  line-height: 1.5;
}

/* Forms */
.app-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--c-text-main);
  opacity: 0.8;
}

.form-group input {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--c-border);
  background: var(--c-bg);
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--c-primary);
}

.save-btn {
  padding: 1.15rem;
  font-weight: 700;
  font-size: 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.primary-btn {
  background: var(--c-primary);
  color: white;
  border: none;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.primary-btn:hover {
  background: #b91c1c; 
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.25);
}

.primary-btn:active {
  transform: translateY(0);
}

.alert-msg {
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}
.alert-msg.success { background: var(--c-success-bg); color: var(--c-success); }
.alert-msg.error { background: var(--c-danger-bg); color: var(--c-danger); }

.dev-toggle {
  background: none;
  border: none;
  color: var(--c-text-muted);
  text-decoration: underline;
  font-size: 0.8rem;
  cursor: pointer;
}

/* ====================================
   MOBILE RESPONSIVE TWEAKS
   ==================================== */
@media (max-width: 768px) {
  .settings-view {
    padding: 1rem;
    padding-bottom: 6rem;
  }
  
  .detail-header-bar {
    padding: 0 0 1.5rem 0; 
  }
  
  .detail-form-card {
    padding: 1.5rem 1rem;
  }
}

.app-version-label {
  text-align: center;
  font-size: 0.75rem;
  color: var(--c-text-muted);
  opacity: 0.6;
  margin-top: 2rem;
}
</style>
