import { ref, onMounted, onBeforeUnmount } from 'vue'

const SITE_KEY = '0x4AAAAAAACznIAR1LQgLgMND'

/**
 * Composable for Cloudflare Turnstile (invisible mode)
 * Usage:
 *   const { turnstileToken, executeTurnstile, resetTurnstile, turnstileContainerRef } = useTurnstile()
 *   
 *   In template: <div ref="turnstileContainerRef"></div>
 *   Before submit: await executeTurnstile()
 */
export function useTurnstile() {
  const turnstileToken = ref('')
  const turnstileContainerRef = ref(null)
  const isReady = ref(false)
  let widgetId = null

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
   * Returns the token string, or empty string if failed.
   */
  async function executeTurnstile() {
    if (!window.turnstile || widgetId === null) {
      console.warn('[Turnstile] Not ready, skipping verification')
      return ''
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
      return ''
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (turnstileToken.value) {
          clearInterval(checkInterval)
          clearTimeout(timeout)
          if (turnstileToken.value === 'ERROR') {
            resolve('')
          } else {
            resolve(turnstileToken.value)
          }
        }
      }, 100)

      // Timeout fallback (8 seconds)
      const timeout = setTimeout(() => {
        clearInterval(checkInterval)
        resolve('')
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
