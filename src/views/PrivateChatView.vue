<template>
  <div class="chat-page">
    <!-- HEADER -->
    <div class="chat-header">
      <div class="chat-header-info">
        <button class="back-btn" @click="$router.push('/chat/inbox')">
          <ArrowLeft :size="22" />
        </button>
        <div class="friend-avatar-wrapper">
            <template v-if="otherUser?.is_anonymous && !canSeeIdentity">
               <div class="header-avatar-placeholder flex-center zh" style="background-color: #94a3b8;">?</div>
            </template>
            <template v-else>
               <img v-if="otherUser?.avatar_url" :src="otherUser.avatar_url" alt="Avatar" class="header-avatar-img" />
               <div v-else class="header-avatar-placeholder flex-center zh">
                  {{ otherUser?.full_name?.charAt(0).toUpperCase() || '?' }}
               </div>
            </template>
        </div>
        <div class="header-text">
          <h2 class="chat-title">{{ displayName }}</h2>
          <p class="chat-subtitle">{{ otherUser?.roles?.includes('dosen') ? 'Dosen / Lǎoshī' : 'Mahasiswa' }}</p>
        </div>
      </div>
      
      <div class="chat-header-actions">
        <button class="action-btn" @click="loadMessages" :disabled="isLoading" title="Refresh">
          <Loader2 v-if="isLoading" class="spin-icon" :size="20" />
          <RefreshCcw v-else :size="20" />
        </button>
      </div>
    </div>

    <!-- MESSAGES AREA -->
    <div class="chat-messages" ref="messagesContainer">
      <!-- Loading State -->
      <div v-if="isLoading" class="chat-loading">
        <span class="loader" style="border-top-color: var(--c-primary); width: 32px; height: 32px;"></span>
      </div>

      <!-- Empty State -->
      <div v-else-if="messages.length === 0 && localPendingMessages.length === 0" class="chat-empty">

        <MessageSquare :size="48" style="opacity: 0.15;" />
        <p>Belum ada pesan pribadi. Kirim sapaan!</p>
      </div>

      <!-- Message Bubbles -->
      <template v-else>
        <template v-for="(msg, idx) in combinedMessages" :key="msg.id || msg.localId">
          <div class="message-row" :class="{ 'own': isOwnMessage(msg) }">
            <div class="message-bubble" :class="{ 'own-bubble': isOwnMessage(msg) }">
              <p class="msg-text" v-html="formatMessage(msg.content)"></p>
              <div class="msg-meta">
                <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
                <!-- Status Icons -->
                  <div v-if="isOwnMessage(msg)" class="msg-status">
                    <Loader2 v-if="msg.status === 'pending'" :size="10" class="status-icon pending spin-icon" />

                    <template v-else>
                       <CheckCheck v-if="msg.is_read" :size="10" class="status-icon read" />
                       <Check v-else :size="10" class="status-icon sent" />
                    </template>
                  </div>

              </div>
            </div>
          </div>
        </template>
      </template>


      <div ref="bottomAnchor"></div>
    </div>

    <!-- INPUT BAR -->
    <div class="chat-input-bar">
      <div class="input-wrapper">
        <textarea
          ref="inputField"
          v-model="newMessage"
          placeholder="Ketik pesan pribadi..."
          rows="1"
          maxlength="1000"
          class="chat-input"
          @input="autoResize"
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button 
          class="send-btn" 
          @click="sendMessage" 
          :disabled="!newMessage.trim() || isSending"
          :class="{ active: newMessage.trim() }"
        >
          <SendHorizontal :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, SendHorizontal, Loader2, MessageSquare, RefreshCcw, Check, CheckCheck } from 'lucide-vue-next'


import { useAuth } from '@/composables/useAuth'
import { dmService } from '@/services/dmService'
import { profileService } from '@/services/profileService'
import { useMessageSync } from '@/composables/useMessageSync'

import { useDMBadge } from '@/composables/useDMBadge'

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()
const { pendingMessages, addPending } = useMessageSync()
const { refreshUnreadCount } = useDMBadge()


const otherUserId = computed(() => route.params.id)
const otherUser = ref(null)
const messages = ref([])

const localPendingMessages = computed(() => {
  return pendingMessages.value.filter(m => m.type === 'dm' && m.recipientId === otherUserId.value)
})

const combinedMessages = computed(() => {
  const all = [...messages.value, ...localPendingMessages.value]
  return all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

const newMessage = ref('')
const isLoading = ref(true)
const isSending = ref(false)

const messagesContainer = ref(null)
const inputField = ref(null)
const bottomAnchor = ref(null)
 
const displayName = computed(() => {
  if (otherUser.value?.is_anonymous) {
    return canSeeIdentity.value ? `${otherUser.value.full_name} (Anonim)` : 'Pengguna Anonim'
  }
  return otherUser.value?.full_name || 'Memuat...'
})

const canSeeIdentity = computed(() => {
  const role = currentUser.value?.roles || []
  return role.includes('admin') || role.includes('dosen')
})

let realtimeChannel = null


onMounted(async () => {
  await fetchOtherUser()
  await loadMessages()
  subscribeToRealtime()
  scrollToBottom()
  
  // Mark as read and refresh badge
  await dmService.markAsRead(otherUserId.value)
  refreshUnreadCount()
})


onUnmounted(() => {
  if (realtimeChannel) {
    dmService.unsubscribe(realtimeChannel)
  }
})

const fetchOtherUser = async () => {
  try {
    otherUser.value = await profileService.getProfileById(otherUserId.value)
  } catch (err) {
    console.error('Failed to fetch other user:', err)
  }
}

const loadMessages = async () => {
  isLoading.value = true
  try {
    const data = await dmService.getPrivateMessages(otherUserId.value)
    messages.value = data
  } catch (err) {
    console.error('Load messages error:', err)
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const subscribeToRealtime = () => {
  realtimeChannel = dmService.subscribeToDMs((newMsg) => {
    // Hanya tambahkan jika pesan ini milik percakapan ini
    const isRelevant = (newMsg.sender_id === otherUserId.value && newMsg.recipient_id === currentUser.value.id) ||
                       (newMsg.sender_id === currentUser.value.id && newMsg.recipient_id === otherUserId.value)
    
    if (isRelevant) {
      if (!messages.value.some(m => m.id === newMsg.id)) {
        messages.value.push(newMsg)
        nextTick(() => scrollToBottom())
        
        // Mark as read if receiving and refresh badge
        if (newMsg.recipient_id === currentUser.value.id) {
          dmService.markAsRead(otherUserId.value).then(() => {
             refreshUnreadCount()
          })
        }
      }
    }

  })
}

const sendMessage = async () => {
  const content = newMessage.value.trim()
  if (!content || isSending.value) return
  
  isSending.value = true
  newMessage.value = ''
  resetTextareaHeight()

  try {
    // Gunakan Antrean Sinkronisasi (Message Sync)
    addPending('dm', {
      recipientId: otherUserId.value,
      content,
      authorName: currentUser.value?.full_name || 'Unknown',
      authorAvatar: currentUser.value?.avatar_url || null
    })

    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Send error:', err)
    alert('Gagal mengirim pesan.')
    newMessage.value = content
  } finally {
    isSending.value = false
    inputField.value?.focus()
  }
}


// Helpers
const isOwnMessage = (msg) => msg.sender_id === currentUser.value?.id
const formatTime = (isoString) => {
  const d = new Date(isoString)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const autoResize = () => {
  const el = inputField.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
}

const resetTextareaHeight = () => {
  if (inputField.value) inputField.value.style.height = 'auto'
}

const formatMessage = (text) => {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.replace(/\*\*\s*(.*?)\s*\*\*/g, '<strong>$1</strong>')
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%; /* Atau calc(100vh - 64px) jika header ada secara global */
  background-color: var(--c-bg);
  overflow: hidden;
}

/* ========== HEADER ========== */
.chat-header {
  height: 70px;
  background-color: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  flex-shrink: 0;
  z-index: 10;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.friend-avatar-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.header-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  color: white;
  font-weight: 800;
}

.header-text {
  min-width: 0;
}

.chat-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text-main);
  line-height: 1.2;
}

.chat-subtitle {
  font-size: 0.7rem;
  color: var(--c-text-muted);
}

.back-btn {
  background: none;
  border: none;
  color: var(--c-text-main);
  cursor: pointer;
  padding: 4px;
}

.action-btn {
  background: none;
  border: none;
  color: var(--c-text-muted);
  cursor: pointer;
}

/* ========== MESSAGES ========== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background-color: #f0ece6;
  min-height: 0; /* Crucial for inner scroll in flex container */
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row.own {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 80%;
  padding: 0.6rem 0.85rem;
  border-radius: 14px;
  background-color: var(--c-surface);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.own-bubble {
  background-color: var(--c-primary);
  color: white;
  border-bottom-right-radius: 2px;
}

.message-bubble:not(.own-bubble) {
  border-bottom-left-radius: 2px;
  border: 1px solid var(--c-border);
}

.msg-text {
  font-size: 0.95rem;
  line-height: 1.4;
  word-break: break-word;
}

.msg-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.25rem;
}

.msg-time {
  font-size: 0.65rem;
  opacity: 0.7;
}

.msg-status {
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.status-icon {
  opacity: 0.8;
}

.status-icon.sent {
  color: #94a3b8;
}

.status-icon.read {
  color: #38bdf8; /* Blue checkmark */
}

.status-icon.pending {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}


/* ========== INPUT ========== */
.chat-input-bar {
  padding: 0.75rem 1rem;
  background-color: var(--c-surface);
  border-top: 1px solid var(--c-border);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  background: var(--c-bg);
  padding: 0.4rem 0.6rem;
  border-radius: 24px;
  border: 1px solid var(--c-border);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.4rem;
  font-family: inherit;
  font-size: 0.95rem;
  resize: none;
  max-height: 120px;
  color: var(--c-text-main);
}

.send-btn {
  background: none;
  border: none;
  color: var(--c-text-muted);
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
}

.send-btn.active {
  color: var(--c-primary);
}

.chat-loading, .chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--c-text-muted);
}

.spin-icon {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
