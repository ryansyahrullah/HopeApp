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
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const route = useRoute()

// Sembunyikan sidebar dan header jika di halaman standalone public/login
const isAuthRoute = computed(() => ['/login', '/complete-profile', '/reset-password', '/masukan'].includes(route.path))

// Halaman fullscreen (tanpa sidebar/header, tapi bukan auth)
const isFullscreenRoute = computed(() => ['/chat', '/cici-chat'].includes(route.path))

</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
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
  overflow: hidden;
  height: 100vh;
  height: 100dvh;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
    padding-bottom: 80px; /* Room for bottom nav */
  }

  .fullscreen-content {
    padding-bottom: 0 !important; /* Chat tidak butuh ruang bottom nav */
    height: 100vh;
    height: 100dvh;
  }
}
</style>
