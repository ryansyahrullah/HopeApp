<template>
  <div 
    class="base-card"
    :class="{ 'base-card--interactive': hoverEffect }"
  >
    <div v-if="title || $slots.header" class="base-card__header">
      <slot name="header">
        <h3 class="base-card__title">{{ title }}</h3>
      </slot>
    </div>
    
    <div class="base-card__body" :style="{ padding: noPadding ? '0' : '1.25rem' }">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  hoverEffect: {
    type: Boolean,
    default: false
  },
  noPadding: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.base-card {
  background-color: var(--c-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  overflow: hidden;
}

.base-card--interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: rgba(198, 40, 40, 0.3);
}

.base-card__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.base-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--c-text-main);
  margin: 0;
}

.base-card__footer {
  padding: 0.75rem 1.25rem;
  background-color: rgba(230, 224, 212, 0.2); /* very soft cream */
  border-top: 1px solid var(--c-border);
}
</style>
