<template>
  <div class="app-layout">
    <!-- Sidebar Kiri -->
    <AppSidebar v-if="!isAuthRoute && !isFullscreenRoute" />
    
    <!-- Konten Kanan -->
    <div class="main-wrapper">
      <AppHeader v-if="!isAuthRoute && !isFullscreenRoute" />
      
      <main class="main-content" :class="{ 'auth-content': isAuthRoute, 'fullscreen-content': isFullscreenRoute }">
        <router-view v-slot="{ Component, route }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
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

/* === PAGE TRANSITIONS === */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
