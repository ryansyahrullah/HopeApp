<template>
  <Transition name="toast-fade">
    <div v-if="visible" class="app-toast-wrapper" :class="[position, { 'is-global': isGlobal }]" @click="hide">
      <div class="app-toast" :class="variant">
        <div class="toast-icon">
          <CheckCircle v-if="variant === 'success'" :size="18" />
          <XCircle v-else-if="variant === 'error'" :size="18" />
          <AlertCircle v-else-if="variant === 'warning'" :size="18" />
          <Info v-else :size="18" />
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ message }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  isGlobal: { type: Boolean, default: false }
})

const { message, variant, visible, position, hide } = useToast()
</script>

<style scoped>
.app-toast-wrapper {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000; /* Extremely high to stay on top */
  width: auto;
  max-width: 90vw;
  pointer-events: auto;
  cursor: pointer;
}

/* Positions */
.app-toast-wrapper.top {
  top: 1.5rem;
}

.app-toast-wrapper.bottom {
  bottom: 2rem;
}

.app-toast {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: white;
  border-radius: 100px;
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.1), 
    0 8px 10px -6px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Variant Styles */
.app-toast.success { border-left: 4px solid var(--c-success, #10b981); }
.app-toast.error { border-left: 4px solid var(--c-danger, #ef4444); }
.app-toast.warning { border-left: 4px solid var(--c-warning, #f59e0b); }
.app-toast.info { border-left: 4px solid var(--c-info, #3b82f6); }

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.success .toast-icon { color: var(--c-success, #10b981); }
.error .toast-icon { color: var(--c-danger, #ef4444); }
.warning .toast-icon { color: var(--c-warning, #f59e0b); }
.info .toast-icon { color: var(--c-info, #3b82f6); }

.toast-content {
  flex: 1;
}

.toast-message {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--c-text-main, #1f2937);
  margin: 0;
  white-space: nowrap;
}

/* Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.9);
}

/* Mobile Adjustments */
@media (max-width: 768px) {
  .app-toast-wrapper.bottom {
    bottom: 5.5rem; /* Above bottom navigation */
  }
}
</style>
