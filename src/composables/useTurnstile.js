import { ref, onMounted, onBeforeUnmount } from 'vue'

// Site Key dari environment variable (public key — aman di frontend)
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

// ⚠️ Turnstile otomatis nonaktif jika SITE_KEY kosong / belum di-set
const IS_ENABLED = !!SITE_KEY

/**
 * Composable for Cloudflare Turnstile (invisible mode)
 * 
 * Supabase Auth sudah punya built-in Captcha verification.
 * Token dari Turnstile dikirim via options.captchaToken pada:
 * - signInWithPassword()
 * - signUp()
 * - resetPasswordForEmail()
 * 
 * Supabase backend akan verifikasi token langsung ke Cloudflare 
 * menggunakan Secret Key yang di-set di Supabase Dashboard.
 * 
 * TIDAK perlu Edge Function — semua handled otomatis oleh Supabase.
 * 
 * Usage:
 *   const { turnstileToken, executeTurnstile, resetTurnstile, turnstileContainerRef } = useTurnstile()
 *   In template: <div ref="turnstileContainerRef"></div>
 *   Before submit: const token = await executeTurnstile()
 */
export function useTurnstile() {
  const turnstileToken = ref('')
  const turnstileContainerRef = ref(null)
  const isReady = ref(!IS_ENABLED)
  let widgetId = null

  // Jika Turnstile tidak aktif (belum set SITE_KEY), return dummy functions
  if (!IS_ENABLED) {
    return {
      turnstileToken,
      turnstileContainerRef,
      executeTurnstile: async () => null,
      resetTurnstile: () => {},
      isReady
    }
  }

  // Wait for Turnstile script to load
  function waitForTurnstile() {
    return new Promise((resolve) => {
      if (window.turnstile) {
        resolve()
        return
      }
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(interval)
        resolve()
      }, 10000)
    })
  }

  onMounted(async () => {
    await waitForTurnstile()

    if (!window.turnstile || !turnstileContainerRef.value) return

    try {
      widgetId = window.turnstile.render(turnstileContainerRef.value, {
        sitekey: SITE_KEY,
        size: 'invisible',
        callback: (token) => {
          turnstileToken.value = token
        },
        'error-callback': () => {
          turnstileToken.value = 'ERROR'
        },
        'expired-callback': () => {
          turnstileToken.value = ''
        }
      })
      isReady.value = true
    } catch (e) {
      console.warn('[Turnstile] Failed to render:', e)
    }
  })

  onBeforeUnmount(() => {
    if (widgetId !== null && window.turnstile) {
      try {
        window.turnstile.remove(widgetId)
      } catch (e) {
        // Silent cleanup
      }
    }
  })

  /**
   * Execute the invisible challenge.
   * Returns the token string, or null if failed/not ready.
   */
  async function executeTurnstile() {
    if (!window.turnstile || widgetId === null) {
      console.warn('[Turnstile] Not ready, skipping verification')
      return null
    }

    // Reset before executing only if it already has a token
    if (turnstileToken.value) {
      window.turnstile.reset(widgetId)
      turnstileToken.value = ''
    }

    try {
      window.turnstile.execute(widgetId)
    } catch(e) {
      console.warn("Turnstile execute error:", e)
      window.turnstile.reset(widgetId)
      return null
    }

    return new Promise((resolve) => {
      let isResolved = false
      
      const checkInterval = setInterval(() => {
        if (turnstileToken.value) {
          clearInterval(checkInterval)
          clearTimeout(timeout)
          isResolved = true
          
          if (turnstileToken.value === 'ERROR') {
            window.turnstile.reset(widgetId)
            turnstileToken.value = ''
            resolve(null)
          } else {
            resolve(turnstileToken.value)
          }
        }
      }, 100)

      // Timeout fallback (8 seconds)
      const timeout = setTimeout(() => {
        if (!isResolved) {
          clearInterval(checkInterval)
          console.warn('[Turnstile] Execution timeout')
          window.turnstile.reset(widgetId)
          turnstileToken.value = ''
          resolve(null)
        }
      }, 8000)
    })
  }

  function resetTurnstile() {
    turnstileToken.value = ''
    if (widgetId !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetId)
      } catch (e) {
        // Silent reset
      }
    }
  }

  return {
    turnstileToken,
    turnstileContainerRef,
    executeTurnstile,
    resetTurnstile,
    isReady
  }
}
