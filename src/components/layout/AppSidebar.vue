<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <h1 class="zh font-display text-accent">HopeApp 希</h1>
    </div>

    <nav class="sidebar-nav">
      <!-- Semua Role -->
      <router-link to="/" class="nav-item">
        <span class="icon"><LayoutDashboard :size="20" /></span>
        <span class="nav-label">Dashboard</span>
      </router-link>
      
      <router-link to="/meetings" class="nav-item hide-on-mobile">
        <span class="icon"><CalendarDays :size="20" /></span>
        <span class="nav-label">Pertemuan</span>
      </router-link>

      <router-link to="/feedback" class="nav-item hide-on-mobile">
        <span class="icon"><MessageSquare :size="20" /></span>
        <span class="nav-label">Masukan</span>
      </router-link>

      <template v-if="isAdmin || isDosen">

        <router-link to="/mahasiswa" class="nav-item">
          <span class="icon"><GraduationCap :size="20" /></span>
          <span class="nav-label">Mahasiswa</span>
        </router-link>

        <router-link to="/presensi" class="nav-item hide-on-mobile">
          <span class="icon"><ClipboardCheck :size="20" /></span>
          <span class="nav-label">Rekap Presensi</span>
        </router-link>

        <router-link to="/resumes" class="nav-item hide-on-mobile">
          <span class="icon"><FileText :size="20" /></span>
          <span class="nav-label">Rekap Resume</span>
        </router-link>

        <router-link to="/summary" class="nav-item hide-on-mobile">
          <span class="icon"><PieChart :size="20" /></span>
          <span class="nav-label">Ringkasan</span>
        </router-link>
      </template>

      <!-- Khusus Admin -->
      <template v-if="isAdmin">
        <router-link to="/users" class="nav-item hide-on-mobile">
          <span class="icon"><UsersRound :size="20" /></span>
          <span class="nav-label">Pengguna</span>
        </router-link>
      </template>

      <!-- Khusus Mahasiswa -->
      <template v-if="isMahasiswa">
        <router-link to="/my-resumes" class="nav-item hide-on-mobile">
          <span class="icon"><FileText :size="20" /></span>
          <span class="nav-label">Resume</span>
        </router-link>

        <router-link to="/chat" class="nav-item">
          <div class="icon-wrapper">
            <span class="icon"><MessageCircle :size="20" /></span>
            <span v-if="totalUnread > 0" class="chat-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
          </div>

          <span class="nav-label">Obrolan</span>
        </router-link>
      </template>

      <!-- Bottom Menu -->
      <div class="bottom-menu">

        <router-link to="/profile" class="nav-item">
          <span class="icon"><User :size="20" /></span>
          <span class="nav-label">Profile</span>
        </router-link>

        <router-link to="/cici-chat" class="nav-item nav-cici">
          <div class="icon-wrapper cici-nav-icon">
             <img src="/cici_avatar.png" alt="Cici" />
          </div>
          <span class="nav-label cici-label">Cici 希</span>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { LayoutDashboard, CalendarDays, ClipboardCheck, FileText, User, UsersRound, GraduationCap, PieChart, Settings, MessageSquare, MessageCircle } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useChatBadge } from '@/composables/useChatBadge'
import { useDMBadge } from '@/composables/useDMBadge'
import { computed } from 'vue'

const { isAdmin, isDosen, isMahasiswa } = useAuth()
const { unreadCount: groupUnreadCount } = useChatBadge()
const { dmUnreadCount } = useDMBadge()

const totalUnread = computed(() => (groupUnreadCount.value || 0) + (dmUnreadCount.value || 0))

</script>

<style scoped>
.app-sidebar {
  width: 250px;
  background-color: var(--c-surface);
  border-right: 1px solid var(--c-border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.sidebar-brand {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--c-border);
}

.sidebar-brand h1 {
  font-size: 1.5rem;
  letter-spacing: 1px;
}

.sidebar-nav {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  color: var(--c-text-muted);
  font-weight: 500;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  cursor: pointer;
}

.nav-item .icon {
  font-size: 1.1rem;
  opacity: 0.7;
}

.nav-item:hover {
  background-color: var(--c-bg);
  color: var(--c-text-main);
  transform: translateX(4px);
}

.nav-item:active {
  transform: scale(0.96);
  opacity: 0.8;
}

.nav-item.router-link-active {
  background-color: var(--c-danger-bg);
  color: var(--c-primary);
}

.nav-item.router-link-active .icon {
  opacity: 1;
}

.icon-wrapper {
  position: relative;
  display: inline-flex;
}

.chat-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background-color: var(--c-danger);
  color: #fbbf24; /* emas/kuning cerah */
  font-size: 0.65rem;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--c-surface);
  line-height: 1;
  z-index: 2;
}

/* ========== CICI NAV ITEM ========== */
.nav-cici {
  position: relative;
  overflow: hidden;
}

.cici-nav-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  padding: 1.5px;
  background: linear-gradient(135deg, #fbcfe8, #d8b4fe);
  box-shadow: 0 2px 8px rgba(244, 114, 182, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cici-nav-icon img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid white;
}

.cici-label {
  background: linear-gradient(90deg, #db2777, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800 !important;
}

.nav-cici:hover {
  background: #fdf2f8 !important;
  transform: translateX(4px);
}

.nav-cici:active {
  transform: scale(0.96);
  opacity: 0.8;
}

.nav-cici.router-link-active {
  background: #fce7f3 !important;
  box-shadow: inset 4px 0 0 #f472b6;
}

@media (max-width: 768px) {
  .app-sidebar {
    width: 100%;
    height: 65px;
    border-right: none;
    border-top: 1px solid var(--c-border);
    border-bottom: none;
    position: fixed;
    bottom: 0;
    top: auto;
    z-index: 50;
    flex-direction: row;
    background-color: var(--c-surface);
    padding: 0;
  }
  
  .sidebar-brand {
    display: none;
  }
  
  .sidebar-nav {
    flex-direction: row;
    padding: 0;
    gap: 0;
    width: 100%;
    justify-content: space-around;
    height: 100%;
  }

  .nav-item.hide-on-mobile {
    display: none !important;
  }
  
  .bottom-menu {
    display: contents; /* Merges the profile link into the main nav flex flow */
  }

  .nav-item {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem 0;
    border-radius: 0;
  }
  
  .nav-label {
    font-size: 0.75rem;
  }
  
  .nav-item:hover {
    transform: none;
    background-color: transparent;
  }

  .nav-item.router-link-active {
    background-color: transparent;
    color: var(--c-primary);
  }

  .nav-cici.router-link-active {
    background: transparent !important;
    box-shadow: none;
  }
  
  .nav-cici.router-link-active .cici-nav-icon {
    transform: scale(1.15) translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 114, 182, 0.6);
    transition: all 0.2s;
  }
}
</style>
