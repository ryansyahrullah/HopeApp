<template>
  <div class="app-layout">
    <!-- Sidebar Kiri -->
    <AppSidebar v-if="!isAuthRoute && !isFullscreenRoute" />
    
    <!-- Konten Kanan -->
    <div class="main-wrapper">
      <AppHeader v-if="!isAuthRoute && !isFullscreenRoute" />
      
      <main class="main-content" :class="{ 'auth-content': isAuthRoute, 'fullscreen-content': isFullscreenRoute }">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from './composables/useAuth'
import { useDMBadge } from './composables/useDMBadge'
import { useAvatarSync } from './composables/useAvatarSync'
import { useMessageSync } from './composables/useMessageSync'
import { useProfileSync } from './composables/useProfileSync'
import AppSidebar from '@/components/layout/AppSidebar.vue'


import AppHeader from '@/components/layout/AppHeader.vue'

const { initAuth, currentUser } = useAuth()
const { refreshUnreadCount } = useDMBadge()
const { processQueue } = useAvatarSync()
const { syncPending } = useMessageSync()
const { syncPendingProfile } = useProfileSync()

const route = useRoute()

onMounted(async () => {
  await initAuth()
  
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
      
      // Refresh Auth & Profile (Soft Hard-Refresh)
      await initAuth() 
      
      // Sinkronisasi lagi
      processQueue()
      syncPending()
      syncPendingProfile()
      
      // Refresh Lencana Chat (Inbox)
      refreshUnreadCount()
    }
  })
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
  min-width: 0; /* Mencegah flex item membesar melewati layar */
  height: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  
  /* Hide scrollbar to prevent layout shifts */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.main-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
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
  overflow: hidden !important;
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
