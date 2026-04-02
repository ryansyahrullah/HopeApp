<template>
  <div class="skeleton" :style="skeletonStyle"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '1rem' },
  radius: { type: String, default: '8px' }
})

const skeletonStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.radius
}))
</script>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, #f0ece4 25%, #e8e2d8 50%, #f0ece4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
