<template>
  <button 
    class="base-btn"
    :class="[
      `base-btn--${variant}`,
      { 'base-btn--block': block },
      { 'is-loading': loading },
      customClass
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span class="base-btn__content">
      <slot v-if="!loading"></slot>
      <span v-else class="loader"></span>
    </span>
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'outline', 'text', 'secondary'].includes(v)
  },
  block: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  customClass: {
    type: String,
    default: ''
  }
});

defineEmits(['click']);
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  user-select: none;
  font-family: var(--font-sans);
  position: relative;
  overflow: hidden;
}

.base-btn:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}

.base-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.base-btn--block {
  width: 100%;
}

/* Primary Form (China Red) */
.base-btn--primary {
  background-color: var(--c-primary);
  color: #fff;
  box-shadow: 0 2px 4px rgba(198, 40, 40, 0.2);
}

.base-btn--primary:hover:not(:disabled) {
  background-color: var(--c-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(198, 40, 40, 0.3);
}

.base-btn--primary:active:not(:disabled) {
  transform: translateY(0) scale(0.96);
  box-shadow: 0 2px 4px rgba(198, 40, 40, 0.2);
}

/* Outline Form (Gold/Red Borders) */
.base-btn--outline {
  background-color: transparent;
  color: var(--c-primary);
  border-color: var(--c-primary);
}

.base-btn--outline:hover:not(:disabled) {
  background-color: rgba(198, 40, 40, 0.08);
  transform: translateY(-1px);
}

.base-btn--outline:active:not(:disabled) {
  transform: translateY(0) scale(0.96);
}

/* Secondary (Gold) */
.base-btn--secondary {
  background-color: var(--c-secondary);
  color: #fff;
}
.base-btn--secondary:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 143, 0, 0.3);
}

.base-btn--secondary:active:not(:disabled) {
  transform: translateY(0) scale(0.96);
}

/* Loader Spin (Simple) */
.loader {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid #fff;
  width: 14px;
  height: 14px;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.base-btn--outline .loader {
  border-color: rgba(198, 40, 40, 0.3);
  border-top-color: var(--c-primary);
}
</style>
