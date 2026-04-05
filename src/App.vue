<template>
  <div class="app-layout">
    <!-- Sidebar Kiri -->
    <AppSidebar v-if="!isAuthRoute && !isFullscreenRoute" />
    
    <!-- Konten Kanan -->
      <div class="main-wrapper">
        <AppHeader v-if="!isAuthRoute && !isFullscreenRoute" />
        
        <main class="main-content" :class="{ 'auth-content': isAuthRoute, 'fullscreen-content': isFullscreenRoute }">
          <PullToRefresh :disabled="isAuthRoute">
            <router-view v-slot="{ Component }">
              <component :is="Component" />
            </router-view>
          </PullToRefresh>
        </main>

      <!-- Global Notification Overlay -->
      <AppToast is-global />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from './composables/useAuth'
import { useDMBadge } from './composables/useDMBadge'
import { useAvatarSync } from './composables/useAvatarSync'
import { useMessageSync } from './composables/useMessageSync'
import { useProfileSync } from './composables/useProfileSync'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppToast from '@/components/common/AppToast.vue'
import PullToRefresh from '@/components/common/PullToRefresh.vue'
import { useToast } from './composables/useToast'

const { initAuth, currentUser } = useAuth()
const { refreshUnreadCount } = useDMBadge()
const { processQueue } = useAvatarSync()
const { syncPending } = useMessageSync()
const { syncPendingProfile } = useProfileSync()
const { show, startWatchdog, stopWatchdog } = useToast()

const route = useRoute()

onMounted(async () => {
  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
  try {
    await initAuth()
  } finally {
    stopWatchdog()
  }
  
  // Sinkronisasi Latar Belakang (Awal Muat)
  processQueue()
  syncPending()
  syncPendingProfile()

  // 1. Listener Online (Jika Internet kembali)
  window.addEventListener('online', () => {
    console.log('[App] Koneksi stabil, memproses antrean...')
    processQueue()
    syncPending()
    syncPendingProfile()
  })

  // 2. AUTO-REFRESH (Paling penting: Saat user kembali ke App)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      console.log('[App] Aplikasi aktif kembali, menyegarkan data...')
      
      startWatchdog('memuat terlalu lama, harap refresh!', 7000)
      try {
        // Refresh Auth & Profile (Soft Hard-Refresh)
        await initAuth() 
        
        // Sinkronisasi lagi
        processQueue()
        syncPending()
        // Refresh Lencana Chat (Inbox)
        refreshUnreadCount()
      } finally {
        stopWatchdog()
      }
    }
  })
})

const showStuckTip = () => {
  if (route.path === '/' || route.path === '/login') {
    const pos = route.path === '/' ? 'bottom' : 'top'
    show('loading terus/stuck(all page), refresh aja', { 
      variant: 'warning', 
      duration: 4000,
      position: pos
    })
  }
}

// Initial load
onMounted(() => {
  showStuckTip()
})

// On navigation
watch(() => route.path, () => {
  stopWatchdog()
  showStuckTip()
})



// Sembunyikan sidebar dan header jika di halaman standalone public/login
const isAuthRoute = computed(() => ['/login', '/complete-profile', '/reset-password', '/masukan'].includes(route.path))

// Halaman fullscreen (tanpa sidebar/header, tapi bukan auth)
const isFullscreenRoute = computed(() => {
  return [
    '/chat', 
    '/cici-chat', 
    '/chat/inbox', 
  ].some(path => route.path === path) || 
  route.path.startsWith('/chat/private/')
})


</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--c-bg);
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: hidden; /* Kontrol scroll pindah ke PullToRefresh */
  position: relative;
  padding: 0; /* Padding dipindah ke dalam view masing-masing atau diatur di PTR */
}

.auth-content {
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-content {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  overflow-y: auto !important; /* Ubah dari hidden agar bisa pull-to-refresh */
  overscroll-behavior-y: auto;
  flex: 1;
  height: 100%;
  min-height: 0;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
    padding-bottom: 80px; /* Room for bottom nav */
  }

  .fullscreen-content {
    padding-bottom: 0 !important;
    flex: 1;
    min-height: 0;
  }
}
</style>



