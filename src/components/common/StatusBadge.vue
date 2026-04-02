<template>
  <span class="status-badge" :class="`status-badge--${type}`">
    <slot></slot>
  </span>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'danger', 'warning', 'info'].includes(v)
  }
});
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Success (Green) */
.status-badge--success {
  color: var(--c-success);
  background-color: var(--c-success-bg);
}

/* Danger (Red) */
.status-badge--danger {
  color: var(--c-danger);
  background-color: var(--c-danger-bg);
}

/* Warning (Gold/Yellow) */
.status-badge--warning {
  color: var(--c-warning);
  background-color: var(--c-warning-bg);
}

/* Info (Blue) */
.status-badge--info {
  color: var(--c-info);
  background-color: var(--c-info-bg);
}
</style>
