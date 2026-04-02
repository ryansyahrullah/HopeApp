<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog animate-fade-in">
          <!-- Icon -->
          <div class="confirm-icon" :class="iconClass">
            <component :is="iconComponent" :size="28" />
          </div>

          <!-- Content -->
          <h3 class="confirm-title">{{ title }}</h3>
          <p class="confirm-message">{{ message }}</p>

          <!-- Actions -->
          <div class="confirm-actions">
            <button class="confirm-btn cancel-btn" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="confirm-btn action-btn" :class="actionClass" @click="handleConfirm" :disabled="loading">
              <Loader2 v-if="loading" :size="16" class="spin-icon" />
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { AlertTriangle, Trash2, Info, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: 'Konfirmasi' },
  message: { type: String, default: 'Apakah Anda yakin?' },
  confirmText: { type: String, default: 'Ya, Lanjutkan' },
  cancelText: { type: String, default: 'Batal' },
  variant: { type: String, default: 'danger' }, // 'danger' | 'warning' | 'info'
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])

const iconComponent = computed(() => {
  if (props.variant === 'danger') return Trash2
  if (props.variant === 'warning') return AlertTriangle
  return Info
})

const iconClass = computed(() => `icon-${props.variant}`)
const actionClass = computed(() => `action-${props.variant}`)

const handleConfirm = () => emit('confirm')
const handleCancel = () => emit('cancel')
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.confirm-dialog {
  background: var(--c-surface);
  border-radius: 20px;
  padding: 2rem 1.75rem 1.5rem;
  max-width: 360px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--c-border);
}

/* Icon */
.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
}

.icon-danger {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.icon-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.icon-info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* Content */
.confirm-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
}

.confirm-message {
  font-size: 0.85rem;
  color: var(--c-text-muted);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

/* Actions */
.confirm-actions {
  display: flex;
  gap: 0.75rem;
}

.confirm-btn {
  flex: 1;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.cancel-btn {
  background: var(--c-bg);
  color: var(--c-text-main);
  border: 1px solid var(--c-border);
}

.cancel-btn:hover {
  background: var(--c-border);
}

.action-danger {
  background: #dc2626;
  color: white;
}

.action-danger:hover {
  background: #b91c1c;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.action-warning {
  background: #f59e0b;
  color: white;
}

.action-warning:hover {
  background: #d97706;
}

.action-info {
  background: #3b82f6;
  color: white;
}

.action-info:hover {
  background: #2563eb;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animation */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
