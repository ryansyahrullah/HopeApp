<template>
  <div class="reset-wrapper">
    <!-- Kolom Kiri: Banner -->
    <div class="reset-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <h2 class="zh-font">希望</h2>
        <p>Portal Akademik</p>
      </div>
    </div>

    <!-- Kolom Kanan: Form -->
    <div class="reset-form-container">
      <div class="form-wrapper animate-fade-in">

        <!-- Success State -->
        <div v-if="isSuccess" class="success-state">
          <div class="success-icon-wrapper">
            <CheckCircle :size="56" />
          </div>
          <h2 class="auth-heading" style="text-align:center;">Sandi Berhasil Diubah!</h2>
          <p class="auth-desc" style="text-align:center;">
            Kata sandi Anda telah diperbarui. Silakan login kembali dengan sandi baru.
          </p>
          <button class="primary-btn" @click="goToLogin">
            <LogIn :size="18" /> Ke Halaman Login
          </button>
        </div>

        <!-- Reset Form -->
        <template v-else>
          <div class="brand-header">
            <div class="lock-icon-wrapper">
              <KeyRound :size="28" />
            </div>
            <h2 class="auth-heading">Buat Sandi Baru</h2>
            <p class="auth-desc">Masukkan kata sandi baru untuk akun Anda.</p>
          </div>

          <!-- Feedback Messages -->
          <div v-if="errorMessage" class="feedback-msg error-msg animate-fade-in">
            <AlertCircle :size="18" /> {{ errorMessage }}
          </div>

          <form class="auth-form" @submit.prevent="handleReset">
            <div class="form-group">
              <label for="new-password">Sandi Baru</label>
              <div class="password-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="new-password"
                  v-model="newPassword"
                  placeholder="Minimal 6 karakter"
                  required
                  minlength="6"
                />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  <EyeOff v-if="showPassword" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirm-password">Konfirmasi Sandi Baru</label>
              <div class="password-input-wrapper">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirm-password"
                  v-model="confirmPassword"
                  placeholder="Ulangi sandi baru"
                  required
                  minlength="6"
                />
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                  <EyeOff v-if="showConfirmPassword" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
            </div>

            <!-- Password match indicator -->
            <div v-if="confirmPassword.length > 0" class="password-match" :class="passwordsMatch ? 'match' : 'no-match'">
              <CheckCircle v-if="passwordsMatch" :size="14" />
              <AlertCircle v-else :size="14" />
              {{ passwordsMatch ? 'Sandi cocok' : 'Sandi tidak cocok' }}
            </div>

            <button type="submit" class="primary-btn" :disabled="isProcessing || !passwordsMatch || newPassword.length < 6">
              {{ isProcessing ? 'Menyimpan...' : 'Simpan Sandi Baru' }}
            </button>
          </form>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle, LogIn } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isProcessing = ref(false)
const errorMessage = ref('')
const isSuccess = ref(false)

const passwordsMatch = computed(() => newPassword.value === confirmPassword.value)

onMounted(() => {
  // Listen for PASSWORD_RECOVERY event from Supabase
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      // Session is established, user can now update password
      console.log('[ResetPassword] Recovery session active')
    }
  })
})

const handleReset = async () => {
  errorMessage.value = ''

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Sandi minimal 6 karakter.'
    return
  }

  if (!passwordsMatch.value) {
    errorMessage.value = 'Konfirmasi sandi tidak cocok.'
    return
  }

  isProcessing.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (error) throw error

    // Sign out so user must login with new password
    await supabase.auth.signOut()
    isSuccess.value = true
  } catch (error) {
    if (error.message?.includes('same_password')) {
      errorMessage.value = 'Sandi baru tidak boleh sama dengan sandi lama.'
    } else if (error.message?.includes('weak_password')) {
      errorMessage.value = 'Sandi terlalu lemah. Gunakan minimal 6 karakter.'
    } else {
      errorMessage.value = error.message || 'Gagal mengubah sandi. Silakan coba lagi.'
    }
  } finally {
    isProcessing.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.reset-wrapper {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: var(--c-surface);
  overflow: hidden;
}

/* Banner Kiri */
.reset-banner {
  flex: 1.2;
  position: relative;
  background-image: url('/login-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(80, 0, 0, 0.4), rgba(15, 0, 0, 0.6));
}

.banner-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
}

.banner-content .zh-font {
  font-family: inherit;
  font-size: 8rem;
  opacity: 0.95;
  letter-spacing: 0.5rem;
  margin: 0;
  text-shadow: 0 10px 40px rgba(0,0,0,0.8);
  background: linear-gradient(to bottom, #ffffff, #fca5a5);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.banner-content p {
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: 5px;
  text-transform: uppercase;
  opacity: 0.9;
  margin-top: -15px;
  text-shadow: 0 4px 10px rgba(0,0,0,0.8);
}

/* Form Container */
.reset-form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background-color: var(--c-bg);
  overflow-y: auto;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Brand Header */
.brand-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.lock-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), #ef4444);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 8px 24px rgba(198, 40, 40, 0.3);
}

.auth-heading {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
}

.auth-desc {
  font-size: 0.95rem;
  color: var(--c-text-muted);
  line-height: 1.5;
}

/* Feedback */
.feedback-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
}

.error-msg {
  background: var(--c-danger-bg, #fef2f2);
  color: var(--c-danger);
  border: 1px solid rgba(220, 38, 38, 0.2);
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--c-text-main);
  margin-left: 0.2rem;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  width: 100%;
  padding: 0.95rem 3rem 0.95rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background-color: var(--c-surface);
  color: var(--c-text-main);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.password-input-wrapper input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  background-color: var(--c-bg);
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-text-muted);
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: var(--c-text-main);
}

/* Password Match Indicator */
.password-match {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: -0.5rem;
}

.password-match.match {
  color: var(--c-success);
}

.password-match.no-match {
  color: var(--c-danger);
}

/* Primary Button */
.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--c-primary);
  color: white;
  border: none;
  padding: 0.95rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

.primary-btn:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.25);
}

.primary-btn:active {
  transform: translateY(0);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Success State */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.success-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3);
  animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Animation */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* RESPONSIVE MOBILE */
@media (max-width: 900px) {
  .reset-wrapper {
    flex-direction: column;
    overflow: hidden;
  }

  .reset-banner {
    flex: 0 0 30vh;
  }

  .banner-content .zh-font {
    font-size: 4.5rem;
  }

  .banner-content p {
    font-size: 1rem;
    letter-spacing: 2px;
    margin-top: -5px;
  }

  .reset-form-container {
    flex: 1;
    align-items: flex-start;
    padding: 0;
    background-color: transparent;
    position: relative;
    margin-top: -2rem;
    z-index: 10;
    overflow: visible;
  }

  .form-wrapper {
    background: var(--c-surface);
    border-radius: 28px 28px 0 0;
    padding: 2rem 1.25rem;
    gap: 1.25rem;
    max-width: 100%;
    box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.25);
    min-height: 70vh;
  }

  .lock-icon-wrapper {
    width: 52px;
    height: 52px;
  }

  .auth-heading {
    font-size: 1.5rem;
  }

  .primary-btn {
    border-radius: 100px;
    padding: 0.85rem;
  }

  .password-input-wrapper input {
    border-radius: 12px;
    padding: 0.8rem 3rem 0.8rem 1rem;
  }
}

@media (max-width: 400px) {
  .form-wrapper {
    padding: 1.5rem 1rem;
    gap: 1rem;
  }
  .banner-content .zh-font {
    font-size: 3.5rem;
  }
}
</style>
