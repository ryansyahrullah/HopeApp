<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <!-- Fallback empty box icon -->
      <slot name="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
          <path d="m3.3 7 8.7 5 8.7-5"></path>
          <path d="M12 22V12"></path>
        </svg>
      </slot>
    </div>
    <h4 class="empty-state__title">{{ title }}</h4>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div class="empty-state__action" v-if="$slots.action">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Tidak ada data'
  },
  description: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--c-text-muted);
}

.empty-state__icon {
  color: var(--c-border);
  margin-bottom: 1rem;
}

.empty-state__icon :deep(svg) {
  width: 64px;
  height: 64px;
  stroke: rgba(198, 40, 40, 0.2); /* Sentuhan merah transparan */
}

.empty-state__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--c-text-main);
  margin-bottom: 0.25rem;
}

.empty-state__description {
  font-size: 0.9rem;
  max-width: 400px;
}

.empty-state__action {
  margin-top: 1.5rem;
}
</style>
