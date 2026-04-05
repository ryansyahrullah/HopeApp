import { reactive, toRefs } from 'vue'

const state = reactive({
  message: '',
  variant: 'info', // 'info', 'success', 'warning', 'error'
  visible: false,
  duration: 4000,
  position: 'bottom'
})

let timer = null

export function useToast() {
  const show = (msg, { variant = 'info', duration = 4000, position = 'bottom' } = {}) => {
    // Clear previous timer
    if (timer) clearTimeout(timer)
    
    // Set new state
    state.message = msg
    state.variant = variant
    state.duration = duration
    state.position = position
    state.visible = true

    // Set auto-hide timer
    if (duration > 0) {
      timer = setTimeout(() => {
        state.visible = false
      }, duration)
    }
  }

  const success = (msg, options = {}) => show(msg, { ...options, variant: 'success' })
  const error = (msg, options = {}) => show(msg, { ...options, variant: 'error' })
  const warning = (msg, options = {}) => show(msg, { ...options, variant: 'warning' })
  const info = (msg, options = {}) => show(msg, { ...options, variant: 'info' })
  const hide = () => {
    state.visible = false
    if (timer) clearTimeout(timer)
  }

  let watchdogTimer = null

  const startWatchdog = (msg = 'memuat terlalu lama, harap refresh!', delay = 5000, options = {}) => {
    if (watchdogTimer) clearTimeout(watchdogTimer)
    watchdogTimer = setTimeout(() => {
      show(msg, { ...options, variant: 'warning', duration: 5000 })
    }, delay)
  }

  const stopWatchdog = () => {
    if (watchdogTimer) {
      clearTimeout(watchdogTimer)
      watchdogTimer = null
    }
  }

  return {
    ...toRefs(state),
    show,
    success,
    error,
    warning,
    info,
    hide,
    startWatchdog,
    stopWatchdog
  }
}
