<template>
  <header class="app-header">
    <div class="header-left">
      <div class="header-brand mobile-only">
        <h1 class="zh font-display text-accent" style="margin:0; font-size: 1.25rem;">HopeApp 希</h1>
      </div>
    </div>
    
    <div class="header-right">
      <div class="user-profile-wrapper">
        <div class="avatar flex-center zh" @click="showProfileMenu = !showProfileMenu">
          <img v-if="currentUser?.avatar_url" :src="currentUser.avatar_url" alt="User Avatar" class="header-avatar-img" />
          <span v-else>{{ userInitial }}</span>
          
          <!-- Badge Notifikasi Pesan Masuk (Gabungan Personal & Grup) -->
          <div v-if="totalUnread > 0" class="red-dot-badge"></div>
        </div>



        
        <!-- Overlay for closing popup -->
        <div v-if="showProfileMenu" class="popup-overlay" @click="showProfileMenu = false"></div>

        <!-- Popup Menu -->
        <div v-if="showProfileMenu" class="profile-popup animate-fade-in">
           <div class="popup-header">
              <div class="popup-user-info">
                 <div class="mini-avatar">
                    <img v-if="currentUser?.avatar_url" :src="currentUser.avatar_url" alt="Mini Avatar" class="header-avatar-img" />
                    <span v-else>{{ userInitial }}</span>
                 </div>
                 <div class="user-details">
                    <strong class="user-name">{{ currentUser?.full_name || 'User' }}</strong>
                    <span class="role-badge">{{ roleLabel }}</span>
                 </div>
              </div>
           </div>
           <div class="popup-body">
              <template v-if="currentUser?.roles && currentUser.roles.length > 1">
                <div class="popup-subtitle" style="padding: 0.5rem 1rem; font-size: 0.75rem; color: var(--c-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ganti Role</div>
                <button 
                  v-for="role in currentUser.roles" 
                  :key="role"
                  class="popup-item" 
                  :class="{ 'active-role': role === roleName }"
                  @click="switchRole(role)"
                >
                  <div class="role-indicator" :class="role === roleName ? 'active' : ''"></div>
                  {{ role.charAt(0).toUpperCase() + role.slice(1) }}
                </button>
                <div class="popup-divider"></div>
              </template>

              <router-link v-if="currentUser?.roles?.includes('mahasiswa') || currentUser?.roles?.includes('admin')" to="/chat/inbox" class="popup-item" @click="showProfileMenu = false">
                 <MessageSquare :size="16" /> 
                 <span>Pesan</span>
                 <div v-if="dmUnreadCount > 0" class="inline-red-dot"></div>
              </router-link>




              <router-link to="/profile" class="popup-item" @click="showProfileMenu = false">
                 <User :size="16" /> Edit Profile
              </router-link>


              <router-link to="/settings" class="popup-item" @click="showProfileMenu = false">
                 <Settings :size="16" /> Pengaturan
              </router-link>
              
              <div class="popup-divider"></div>
              
              <button class="popup-item text-danger" @click="handleLogout">
                 <LogOut :size="16" /> Logout
              </button>
           </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, LogOut, Settings, MessageSquare } from 'lucide-vue-next'

import { useAuth } from '@/composables/useAuth'
import { useDMBadge } from '@/composables/useDMBadge'
import { useChatBadge } from '@/composables/useChatBadge'


const router = useRouter()
const { currentUser, roleLabel, roleName, setRole, signOut } = useAuth()
const { dmUnreadCount } = useDMBadge()
const { unreadCount: groupUnreadCount } = useChatBadge()

const totalUnread = computed(() => dmUnreadCount.value || 0)

const showProfileMenu = ref(false)


const userInitial = computed(() => {
  const name = currentUser.value?.full_name || ''
  return name.charAt(0).toUpperCase() || '?'
})

const switchRole = (role) => {
  setRole(role)
  showProfileMenu.value = false
  if (router.currentRoute.value.path !== '/') {
    router.push('/')
  }
}

const handleLogout = async () => {
  showProfileMenu.value = false
  try {
    await signOut()
    router.push('/login')
  } catch (e) {
    console.error('Logout error:', e)
    alert('Gagal logout: ' + e.message)
  }
}
</script>

<style scoped>
.app-header {
  height: 64px;
  background-color: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
}

.user-profile-wrapper {
  position: relative;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-danger));
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(198, 40, 40, 0.4);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
  position: relative;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.5);
}

.header-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.red-dot-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background-color: var(--c-danger);
  border-radius: 50%;
  border: 2px solid var(--c-surface);
  z-index: 5;
}

/* POPUP MENU STYLES */
.popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  cursor: default;
}

.profile-popup {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.15);
  width: 250px;
  z-index: 50;
  overflow: hidden;
}

.popup-header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--c-border);
  background-color: var(--c-bg);
}

.popup-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mini-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--c-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.95rem;
  color: var(--c-text-main);
  line-height: 1.2;
}

.role-badge {
  font-size: 0.7rem;
  background-color: var(--c-danger-bg);
  color: var(--c-primary);
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  width: max-content;
  text-transform: capitalize;
  margin-top: 0.3rem;
}

.popup-body {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
}

.popup-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  color: var(--c-text-main);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-bottom: 0.2rem;
}

.popup-item:last-child {
  margin-bottom: 0;
}

.popup-item:hover, .active-role {
  background-color: var(--c-surface-hover);
  color: var(--c-primary);
  font-weight: 600;
}

.role-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 0.5rem;
  background-color: transparent;
  border: 1px solid var(--c-border);
}

.role-indicator.active {
  background-color: var(--c-success);
  border-color: var(--c-success);
  box-shadow: 0 0 5px var(--c-success);
}

.text-danger {
  color: var(--c-danger);
}
.text-danger:hover {
  background-color: rgba(198, 40, 40, 0.05);
}

.popup-divider {
  height: 1px;
  background-color: var(--c-border);
  margin: 0.5rem 0;
}

.popup-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.inline-red-dot {
  width: 8px;
  height: 8px;
  background-color: var(--c-danger);
  border-radius: 50%;
  margin-left: auto;
}

</style>
