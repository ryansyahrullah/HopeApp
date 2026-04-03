<template>
  <div class="login-wrapper">
    <!-- Kolom Kiri: Gambar Eksklusif -->
    <div class="login-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <h2 class="zh-font">希望</h2>
        <p>Portal Akademik</p>
      </div>
    </div>

    <!-- Kolom Kanan: State Area -->
    <div class="login-form-container">

      <!-- MODE 0: LOGIN DEFAULT -->
      <div v-if="authMode === 'login'" class="form-wrapper animate-fade-in">
        
        <!-- Feedback Messages (inside card) -->
        <div v-if="errorMessage" class="feedback-msg error-msg animate-fade-in">
          <AlertCircle :size="18" /> {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="feedback-msg success-msg animate-fade-in">
          <CheckCircle :size="18" /> {{ successMessage }}
        </div>

        <div class="brand-header">
          <h1 class="brand-logo">HopeApp 希</h1>
          <p class="brand-subtitle">Bahasa Mandarin POLIBAN</p>
        </div>

        <form class="auth-form" @submit.prevent="loginWithEmail">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="nama@email.com" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="••••••••" 
              required
            />
          </div>

          <div class="form-options">
             <label class="remember-me">
                <input type="checkbox" v-model="rememberMe" />
                <span>Ingat saya</span>
             </label>
             <a href="#" class="forgot-password" @click.prevent="authMode = 'forgot_email'">Lupa Sandi?</a>
          </div>
          
          <button type="submit" class="primary-btn" :disabled="isProcessing">
            {{ isProcessing ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
        
        <div class="divider">
          <span>Atau lanjutkan dengan</span>
        </div>
        
        <button class="google-btn" @click="loginWithGoogle" :disabled="isProcessing">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="google-icon">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          <span class="btn-text">Google</span>
        </button>

        <!-- Versi Aplikasi -->
        <p class="app-version">Versi 1.12.6</p>
      </div>

      <!-- MODE 1: LUPA SANDI - INPUT EMAIL -->
      <div v-else-if="authMode === 'forgot_email'" class="form-wrapper animate-fade-in">
        <button class="back-link" @click="authMode = 'login'; clearMessages()">
           <ChevronLeft :size="18"/> Kembali ke Login
        </button>

        <!-- Feedback Messages (inside card) -->
        <div v-if="errorMessage" class="feedback-msg error-msg animate-fade-in">
          <AlertCircle :size="18" /> {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="feedback-msg success-msg animate-fade-in">
          <CheckCircle :size="18" /> {{ successMessage }}
        </div>

        <div class="brand-header" style="text-align: left;">
          <h2 class="auth-heading">Lupa Sandi?</h2>
          <p class="auth-desc">Masukkan alamat email terdaftar Anda. Kami akan mengirimkan link reset sandi ke email tersebut.</p>
        </div>
        <form class="auth-form" @submit.prevent="sendResetLink">
          <div class="form-group">
            <label>Email Pemulihan</label>
            <input type="email" v-model="resetEmail" placeholder="nama@email.com" required />
          </div>
          <button type="submit" class="primary-btn" :disabled="isProcessing">
             {{ isProcessing ? 'Mengirim...' : 'Kirim Link Reset' }}
          </button>
        </form>
      </div>

    </div>

    <!-- Turnstile invisible widget (Moved outside dynamic container to prevent VDOM wipe) -->
    <div ref="turnstileContainerRef" key="turnstile-app-widget" class="turnstile-container"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useTurnstile } from '@/composables/useTurnstile'

const router = useRouter()
const { signInWithEmail: authSignIn, signInWithGoogle: authGoogleSignIn, resetPassword } = useAuth()
const { turnstileContainerRef, executeTurnstile, resetTurnstile } = useTurnstile()

const authMode = ref('login') // 'login', 'forgot_email'

// Form Login
const email = ref('')
const password = ref('')
const rememberMe = ref(false)

// Form Lupa Sandi
const resetEmail = ref('')
const isProcessing = ref(false)

// Feedback
const errorMessage = ref('')
const successMessage = ref('')

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const loginWithEmail = async () => {
  clearMessages()
  isProcessing.value = true
  try {
    // Verify Turnstile before login (null = not enabled, proceed without captcha)
    const token = await executeTurnstile()

    await authSignIn(email.value, password.value, token)
    router.push('/')
  } catch (error) {
    resetTurnstile()
    if (error.message?.includes('Invalid login')) {
      errorMessage.value = 'Email atau password salah.'
    } else if (error.message?.includes('Email not confirmed')) {
      errorMessage.value = 'Email belum dikonfirmasi. Cek inbox Anda.'
    } else if (error.message?.includes('captcha')) {
      errorMessage.value = 'Verifikasi keamanan gagal. Silakan coba lagi.'
    } else {
      errorMessage.value = error.message || 'Terjadi kesalahan saat login.'
    }
  } finally {
    isProcessing.value = false
  }
}

const loginWithGoogle = async () => {
  clearMessages()
  isProcessing.value = true
  try {
    await authGoogleSignIn()
    // Google OAuth will redirect, so no need to push route
  } catch (error) {
    errorMessage.value = error.message || 'Gagal login dengan Google.'
    isProcessing.value = false
  }
}

const sendResetLink = async () => {
  clearMessages()
  isProcessing.value = true
  try {
    // Verify Turnstile before sending reset link (null = not enabled)
    const token = await executeTurnstile()

    await resetPassword(resetEmail.value, token)
    successMessage.value = `Link reset sandi telah dikirim ke ${resetEmail.value}. Cek inbox atau folder spam Anda.`
  } catch (error) {
    resetTurnstile()
    if (error.message?.includes('captcha')) {
      errorMessage.value = 'Verifikasi keamanan gagal. Silakan coba lagi.'
    } else {
      errorMessage.value = error.message || 'Gagal mengirim link reset.'
    }
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: var(--c-surface);
  overflow: hidden;
}

/* Kolom Banner Kiri */
.login-banner {
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

/* Kolom Form Kanan */
.login-form-container {
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
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Feedback Messages */
.feedback-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  max-width: 380px;
  width: 100%;
  margin-bottom: 0.5rem;
}

.error-msg {
  background: var(--c-danger-bg);
  color: var(--c-danger);
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.success-msg {
  background: var(--c-success-bg);
  color: var(--c-success);
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.brand-header {
  margin-bottom: 0.5rem;
}

.brand-logo {
  font-size: 2.8rem;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, var(--c-primary), #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  font-weight: 800;
}

.brand-subtitle {
  color: var(--c-text-muted);
  font-size: 1rem;
  font-weight: 500;
}

/* Base Form Styling */
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

.form-group input {
  padding: 0.95rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  background-color: var(--c-surface);
  color: var(--c-text-main);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  background-color: var(--c-bg); 
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  margin-top: -0.25rem;
  margin-bottom: 0.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--c-text-muted);
  cursor: pointer;
}

.forgot-password {
  color: var(--c-primary);
  text-decoration: none;
  font-weight: 600;
}

.forgot-password:hover {
  text-decoration: underline;
}

.primary-btn {
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
  opacity: 0.7;
  cursor: not-allowed;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid var(--c-border);
}

.divider span {
  padding: 0 12px;
}

/* Google Button */
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  padding: 0.95rem 1rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.google-btn:hover:not(:disabled) {
  background-color: var(--c-bg);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
  border-color: rgba(198, 40, 40, 0.3);
}

.google-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  width: 22px;
  height: 22px;
}

.btn-text {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--c-text-main);
}

.app-version {
  text-align: center;
  font-size: 0.75rem;
  color: var(--c-text-muted);
  margin-top: 0.5rem;
  opacity: 0.8;
}

/* Forgot Password Styles */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: var(--c-primary);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 2rem;
}
.back-link:hover { text-decoration: underline; }

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

/* RESPONSIVE MOBILE */
@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
    overflow: hidden;
  }
  
  .login-banner {
    flex: 0 0 35vh;
  }

  .banner-content .zh-font {
    font-size: 4.5rem;
  }
  
  .banner-content p {
    font-size: 1rem;
    letter-spacing: 2px;
    margin-top: -5px;
  }
  
  .login-form-container {
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
    padding: 1.5rem 1.25rem;
    gap: 0.75rem; 
    max-width: 100%;
    box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.25);
    min-height: 65vh;
    margin-bottom: 0; 
  }

  .feedback-msg {
    max-width: 100%;
    margin: 0;
  }

  .brand-header {
    margin-bottom: 0;
  }

  .brand-logo {
    font-size: 1.8rem;
  }
  
  .brand-subtitle {
    font-size: 0.8rem;
  }

  .auth-form {
    gap: 0.65rem;
  }
  
  .form-group {
    gap: 0.2rem;
  }

  .primary-btn {
    border-radius: 100px;
    padding: 0.75rem;
  }

  .google-btn {
    border-radius: 100px;
    padding: 0.75rem;
  }

  .form-group input {
    border-radius: 12px;
    padding: 0.75rem 1rem;
  }
  
  .divider {
    margin: 0.15rem 0;
    font-size: 0.75rem;
  }
}

@media (max-width: 400px) {
  .form-wrapper {
    padding: 1.25rem 1rem;
    gap: 0.65rem;
  }
  .banner-content .zh-font {
    font-size: 3.5rem;
  }
}
</style>
