<template>
  <div class="app-layout">
    <!-- Sidebar Kiri -->
    <AppSidebar v-if="!isAuthRoute" />
    
    <!-- Konten Kanan -->
    <div class="main-wrapper">
      <AppHeader v-if="!isAuthRoute" />
      
      <main class="main-content" :class="{ 'auth-content': isAuthRoute }">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const route = useRoute()

// Sembunyikan sidebar dan header jika di halaman login atau register lengkap
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/complete-profile')
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
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

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
    padding-bottom: 80px; /* Room for bottom nav */
  }
}


</style>
