<template>
  <div 
    class="ptr-container" 
    ref="container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- PULL INDICATOR AREA -->
    <div 
      class="ptr-indicator" 
      :style="{ 
        height: indicatorHeight + 'px', 
        opacity: opacity,
        transform: `translateY(${Math.min(0, -60 + pullDistance * 0.5)}px)`
      }"
    >
      <div class="hope-logo-wrapper" :class="{ 'is-loading': isLoading }">
        <svg viewBox="0 0 100 100" class="hope-svg">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#FFD700" />
              <stop :offset="fillPercent + '%'" stop-color="#FFD700" />
              <stop :offset="fillPercent + '%'" stop-color="transparent" />
              <stop offset="100%" stop-color="transparent" />
            </linearGradient>
            
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <!-- Outline -->
          <text 
            x="50%" 
            y="55%" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            class="hope-text outline"
          >希</text>
          
          <!-- Filling Layer -->
          <text 
            x="50%" 
            y="55%" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            class="hope-text fill"
            fill="url(#goldGradient)"
          >希</text>
        </svg>
      </div>
    </div>

    <!-- MAIN CONTENT AREA -->
    <div 
      class="ptr-content" 
      :style="{ transform: `translateY(${pullDistance}px)`, transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  onRefresh: {
    type: Function,
    default: () => window.location.reload()
  },
  threshold: {
    type: Number,
    default: 80
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const container = ref(null)
const pullDistance = ref(0)
const isDragging = ref(false)
const isLoading = ref(false)
const startY = ref(0)

const indicatorHeight = computed(() => Math.max(0, pullDistance.value))
const fillPercent = computed(() => Math.min(100, (pullDistance.value / props.threshold) * 100))
const opacity = computed(() => Math.min(1, pullDistance.value / 40))

const handleTouchStart = (e) => {
  if (props.disabled || isLoading.value) return
  
  // Hanya bisa pull jika di paling atas
  const scrollEl = document.querySelector('.main-content') || document.documentElement
  if (scrollEl.scrollTop > 0) return

  isDragging.value = true
  startY.value = e.touches[0].pageY
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return

  const currentY = e.touches[0].pageY
  const diff = currentY - startY.value

  if (diff > 0) {
    // Prevent default browser refresh only when we are handling the pull
    if (e.cancelable) e.preventDefault()
    
    // Resistance formula
    pullDistance.value = Math.pow(diff, 0.85)
  } else {
    pullDistance.value = 0
  }
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false

  if (pullDistance.value >= props.threshold) {
    triggerRefresh()
  } else {
    pullDistance.value = 0
  }
}

const triggerRefresh = () => {
  isLoading.value = true
  pullDistance.value = props.threshold / 1.5 // Jaga sedikit terbuka saat loading
  
  // Visual Neon Gold effect will be active via 'is-loading' class
  
  setTimeout(() => {
    props.onRefresh()
  }, 1000) // Delay sebentar agar user lihat efek neonnya
}

// Cleanup jika komponen hancur
onUnmounted(() => {
  pullDistance.value = 0
  isLoading.value = false
})
</script>

<style scoped>
.ptr-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Mencegah pull distance meluap */
}

.ptr-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.hope-logo-wrapper {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.hope-svg {
  width: 100%;
  height: 100%;
}

.hope-text {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 70px;
  font-weight: 900;
}

.hope-text.outline {
  fill: none;
  stroke: #FFD700;
  stroke-width: 1px;
  opacity: 0.3;
}

/* NEON EFFECT */
.is-loading .hope-text.fill {
  fill: #FFD700;
  filter: drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 15px #FFD700);
  animation: neonPulse 1.2s infinite ease-in-out;
}

@keyframes neonPulse {
  0% { filter: drop-shadow(0 0 5px #FFD700); transform: scale(1); }
  50% { filter: drop-shadow(0 0 20px #FFD700); transform: scale(1.05); }
  100% { filter: drop-shadow(0 0 5px #FFD700); transform: scale(1); }
}

.ptr-content {
  width: 100%;
  height: 100%;
  overflow-y: auto; /* Aktifkan scroll internal */
  -webkit-overflow-scrolling: touch;
  will-change: transform;
  display: flex;
  flex-direction: column;
}

/* Sembunyikan scrollbar agar tampilan tetap clean */
.ptr-content::-webkit-scrollbar {
  display: none;
}
.ptr-content {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>
