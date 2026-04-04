<template>
  <Transition name="toast-fade">
    <div v-if="visible" class="app-toast-wrapper" @click="visible = false">
      <div class="app-toast" :class="variant">
        <div class="toast-icon">
          <Info v-if="variant === 'info'" :size="18" />
          <AlertCircle v-else :size="18" />
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ message }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Info, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  message: { type: String, required: true },
  duration: { type: Number, default: 6000 },
  variant: { type: String, default: 'info' } // 'info', 'warning'
})

const visible = ref(false)

onMounted(() => {
  // Delay slightly to show animation
  setTimeout(() => {
    visible.value = true
    
    if (props.duration > 0) {
      setTimeout(() => {
        visible.value = false
      }, props.duration)
    }
  }, 500)
})
</script>

<style scoped>
.app-toast-wrapper {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: auto;
  max-width: 90vw;
  pointer-events: auto;
  cursor: pointer;
}

.app-toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  background: white;
  border-radius: 100px;
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.1), 
    0 8px 10px -6px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.app-toast.info {
  border-left: 4px solid var(--c-info, #2563eb);
}

.app-toast.warning {
  border-left: 4px solid var(--c-warning, #d97706);
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info .toast-icon { color: var(--c-info, #2563eb); }
.warning .toast-icon { color: var(--c-warning, #d97706); }

.toast-content {
  flex: 1;
}

.toast-message {
  font-size: 0.85rem;
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

.toast-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}

@media (max-width: 768px) {
  .app-toast-wrapper {
    top: auto;
    bottom: 5rem; /* Muncul di atas bottom nav mobile */
  }
}
</style>
