<template>
  <div class="inbox-page">
    <!-- HEADER -->
    <div class="inbox-header">
      <button class="back-btn" @click="handleBack">
        <ArrowLeft :size="22" />
      </button>
      <h2 class="inbox-title">{{ isSearching ? 'Mulai Chat Baru' : 'Pesan Pribadi' }}</h2>
    </div>

    <!-- SEARCH BAR (Hanya muncul saat mode cari) -->
    <div v-if="isSearching" class="search-bar-container">
      <div class="search-wrapper">
         <Search :size="18" />
         <input 
           v-model="searchQuery" 
           placeholder="Cari nama mahasiswa atau dosen..." 
           class="search-input"
           autofocus
         />
      </div>
    </div>


    <!-- CONVERSATIONS LIST -->
    <div class="inbox-content">
      <!-- LOADING -->
      <div v-if="isLoading" class="loading-state">
        <Loader2 class="spin-icon" :size="32" />
        <p>Memuat...</p>
      </div>

      <!-- SEARCH RESULTS / CONTACTS -->
      <div v-else-if="isSearching" class="contacts-view">
        <div v-if="filteredContacts.length === 0" class="empty-state">
           <p>Tidak menemukan pengguna dengan nama "{{ searchQuery }}"</p>
        </div>
        <div v-else class="conversation-list">
           <div 
             v-for="person in filteredContacts" 
             :key="person.id" 
             class="chat-item"
             @click="openChat(person.id)"
           >
             <div class="avatar-col">
                <img v-if="!person.is_anonymous && person.avatar_url" :src="person.avatar_url" alt="Avatar" class="inbox-avatar" />
                <div v-else class="inbox-avatar-placeholder flex-center zh" :style="person.is_anonymous ? 'background-color: #94a3b8;' : ''">
                   {{ person.is_anonymous ? '?' : person.full_name.charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="chat-info">
                <span class="friend-name">{{ person.is_anonymous ? 'Pengguna Anonim' : person.full_name }}</span>
                <p class="last-msg">{{ person.roles.includes('dosen') ? 'Dosen' : 'Mahasiswa' }}</p>
              </div>

           </div>
        </div>
      </div>

      <!-- INBOX (ACTIVE CHATS) -->
      <div v-else-if="conversations.length === 0" class="empty-state">

        <div class="empty-icon-bg">
           <MessageSquare :size="48" style="opacity: 0.2;" />
        </div>
        <p>Belum ada percakapan pribadi.</p>
        <BaseButton @click="$router.push('/chat')" variant="primary" style="margin-top: 1rem;">
           Mulai Obrolan di Grup
        </BaseButton>
      </div>

      <div v-else class="conversation-list">
        <div 
          v-for="chat in conversations" 
          :key="chat.other_user_id" 
          class="chat-item animate-fade-in"
          @click="openChat(chat.other_user_id)"
        >
          <div class="avatar-col">
            <img v-if="!isAnon(chat) && chat.other_user_avatar" :src="chat.other_user_avatar" alt="Avatar" class="inbox-avatar" />
            <div v-else-if="isAnon(chat)" class="inbox-avatar-placeholder flex-center zh" style="background-color: #94a3b8;">?</div>
            <div v-else class="inbox-avatar-placeholder flex-center zh">
               {{ chat.other_user_name.charAt(0).toUpperCase() }}
            </div>
            <div v-if="chat.unread_count > 0" class="unread-dot"></div>
          </div>
          
          <div class="chat-info">
            <div class="chat-row-top">
              <span class="friend-name">{{ isAnon(chat) ? 'Pengguna Anonim' : chat.other_user_name }}</span>
              <span class="chat-time">{{ formatTime(chat.last_message_time) }}</span>
            </div>
            <div class="chat-row-bottom">
              <p class="last-msg line-clamp-1">{{ chat.last_message }}</p>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- FLOATING ACTION BUTTON (Start Chat) -->
    <button v-if="!isSearching" class="fab-btn" @click="startSearch">
       <Plus :size="28" />
    </button>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Loader2, MessageSquare, Plus, Search } from 'lucide-vue-next'
import { dmService } from '@/services/dmService'
import { profileService } from '@/services/profileService'
import { useAuth } from '@/composables/useAuth'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const { currentUser } = useAuth()

const isLoading = ref(true)
const conversations = ref([])
const allProfiles = ref([])

// Search Mode
const isSearching = ref(false)
const searchQuery = ref('')

const filteredContacts = computed(() => {
  return allProfiles.value.filter(p => {
    // Jangan munculkan diri sendiri
    if (p.id === currentUser.value?.id) return false
    // Jangan munculkan AI assistant
    if (p.roles?.includes('ai_assistant')) return false
    // Jangan munculkan dosen (sesuai permintaan user)
    if (p.roles?.includes('dosen')) return false
    
    // Jangan munculkan user anonim ke mahasiswa lain
    const isOtherStudent = !currentUser.value?.roles?.some(r => ['admin', 'dosen'].includes(r))
    if (p.is_anonymous && isOtherStudent) return false
    
    return p.full_name.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})





const loadInbox = async () => {
  isLoading.value = true
  try {
    conversations.value = await dmService.getInbox()
    // Muat semua profil di latar belakang untuk pencarian
    allProfiles.value = await profileService.getAllProfiles()
  } catch (err) {
    console.error('Failed to load inbox data:', err)
  } finally {
    isLoading.value = false
  }
}

const handleBack = () => {
  if (isSearching.value) {
    isSearching.value = false
    searchQuery.value = ''
  } else {
    router.push('/')
  }
}

const startSearch = () => {
  isSearching.value = true
}


const openChat = (userId) => {
  router.push(`/chat/private/${userId}`)
}

const isAnon = (chat) => {
  if (chat.other_user_is_anonymous) {
     const canSee = currentUser.value?.roles?.some(r => ['admin', 'dosen'].includes(r))
     return !canSee
  }
  return false
}

const formatTime = (isoString) => {

  if (!isoString) return ''
  const d = new Date(isoString)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

onMounted(() => {
  loadInbox()
})
</script>

<style scoped>
.inbox-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background-color: var(--c-bg);
  overflow: hidden;
}

.inbox-header {
  padding: 1rem 1.25rem;
  background: var(--c-surface);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-bar-container {
  padding: 0 1.25rem 0.75rem 1.25rem;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--c-bg);
  padding: 0.6rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--c-border);
  color: var(--c-text-muted);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: var(--c-text-main);
}


.inbox-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--c-text-main);
}

.back-btn {
  background: none;
  border: none;
  color: var(--c-text-main);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.inbox-content {
  flex: 1;
  overflow-y: auto;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--c-text-muted);
}

.empty-icon-bg {
  width: 80px;
  height: 80px;
  background: var(--c-surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  border: 1px solid var(--c-border);
}

.conversation-list {
  display: flex;
  flex-direction: column;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  cursor: pointer;
  transition: background 0.2s;
}

.chat-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

.fab-btn {
  position: fixed;
  bottom: 2rem;
  right: 1.5rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--c-primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.4);
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s;
}

.fab-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(198, 40, 40, 0.5);
}

.fab-btn:active {
  transform: scale(0.95);
}

.avatar-col {

  position: relative;
  flex-shrink: 0;
}

.inbox-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.inbox-avatar-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  color: white;
  font-weight: 800;
  font-size: 1.5rem;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background-color: var(--c-danger);
  border: 2px solid var(--c-surface);
  border-radius: 50%;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.friend-name {
  font-weight: 700;
  color: var(--c-text-main);
  font-size: 1rem;
}

.chat-time {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.last-msg {
  font-size: 0.85rem;
  color: var(--c-text-muted);
}

.spin-icon {
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;  
  overflow: hidden;

}
</style>
