<template>
  <div class="chat-page">
    <!-- HEADER -->
    <div class="chat-header">
      <div class="chat-header-info">
        <button class="back-btn" @click="$router.back()">
          <ArrowLeft :size="22" />
        </button>
        <div class="chat-avatar">
          <MessagesSquare :size="22" />
        </div>
        <div>
          <h2 class="chat-title">Obrolan HOPE <span class="zh">希</span></h2>
          <p class="chat-subtitle">Grup Mahasiswa</p>
        </div>
      </div>
    </div>

    <!-- MESSAGES AREA -->
    <div class="chat-messages" ref="messagesContainer" @scroll="handleScroll">
      <!-- Load Older Button -->
      <div v-if="hasOlderMessages" class="load-older">
        <button @click="loadOlder" :disabled="isLoadingOlder" class="load-older-btn">
          <Loader2 v-if="isLoadingOlder" class="spin-icon" :size="14" />
          <ChevronUp v-else :size="14" />
          <span>{{ isLoadingOlder ? 'Memuat...' : 'Pesan lebih lama' }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="chat-loading">
        <span class="loader" style="border-top-color: var(--c-primary); width: 32px; height: 32px;"></span>
      </div>

      <!-- Empty State -->
      <div v-else-if="messages.length === 0" class="chat-empty">
        <MessagesSquare :size="48" style="opacity: 0.15;" />
        <p>Belum ada pesan. Mulai obrolan!</p>
      </div>

      <!-- Message Bubbles -->
      <template v-else>
        <template v-for="(msg, idx) in messages" :key="msg.id">
          <!-- Date Separator -->
          <div v-if="showDateSeparator(idx)" class="date-separator">
            <span>{{ formatDateLabel(msg.created_at) }}</span>
          </div>

          <div class="message-row" :class="{ 'own': isOwnMessage(msg) }">
            <!-- Avatar untuk pesan orang lain -->
            <div v-if="!isOwnMessage(msg)" class="msg-avatar" :style="{ backgroundColor: getAvatarColor(msg.profiles?.full_name) }">
              {{ getInitial(msg.profiles?.full_name) }}
            </div>

            <div class="message-bubble" :class="{ 'own-bubble': isOwnMessage(msg) }">
              <!-- Sender name (hanya untuk pesan orang lain) -->
              <span v-if="!isOwnMessage(msg)" class="sender-name" :style="{ color: getSenderColor(msg.profiles) }">
                {{ msg.profiles?.full_name || 'Unknown' }}
                <span v-if="msg.profiles?.student_number" class="sender-badge">{{ msg.profiles.student_number }}</span>
              </span>
              
              <p class="msg-text">{{ msg.content }}</p>
              
              <div class="msg-meta">
                <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
                <button 
                  v-if="isOwnMessage(msg)" 
                  class="delete-msg-btn" 
                  @click="promptDeleteMessage(msg.id)"
                  title="Hapus pesan"
                >
                  <Trash2 :size="11" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- Scroll to bottom indicator -->
      <div ref="bottomAnchor"></div>
    </div>

    <!-- INPUT BAR -->
    <div class="chat-input-bar">
      <div class="input-wrapper">
        <textarea
          ref="inputField"
          v-model="newMessage"
          @keydown.enter.exact.prevent="sendMessage"
          placeholder="Ketik pesan..."
          rows="1"
          maxlength="1000"
          class="chat-input"
          @input="autoResize"
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

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="Hapus Pesan?"
      message="Apakah Anda yakin ingin menghapus pesan ini?"
      confirmText="Ya, Hapus"
      variant="danger"
      :loading="isDeletingMessage"
      @confirm="executeDeleteMessage"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { MessagesSquare, SendHorizontal, Loader2, ChevronUp, Trash2, ArrowLeft } from 'lucide-vue-next'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuth } from '@/composables/useAuth'
import { chatService } from '@/services/chatService'

const { currentUser } = useAuth()

const messages = ref([])
const newMessage = ref('')
const isLoading = ref(true)
const isSending = ref(false)
const isLoadingOlder = ref(false)
const hasOlderMessages = ref(true)

const messagesContainer = ref(null)
const bottomAnchor = ref(null)
const inputField = ref(null)

let realtimeChannel = null

// ============ LIFECYCLE ============

onMounted(async () => {
  await loadMessages()
  subscribeToRealtime()
  scrollToBottom()
})

onUnmounted(() => {
  if (realtimeChannel) {
    chatService.unsubscribe(realtimeChannel)
  }
})

// ============ DATA LOADING ============

const loadMessages = async () => {
  isLoading.value = true
  try {
    const data = await chatService.getMessages(50)
    messages.value = data
    if (data.length < 50) hasOlderMessages.value = false
  } catch (err) {
    console.error(err)
    alert('Gagal memuat obrolan: ' + err.message)
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const loadOlder = async () => {
  if (isLoadingOlder.value || messages.value.length === 0) return
  isLoadingOlder.value = true
  
  const container = messagesContainer.value
  const scrollHeightBefore = container?.scrollHeight || 0

  try {
    const oldest = messages.value[0]
    const olderData = await chatService.loadOlderMessages(oldest.created_at, 30)
    
    if (olderData.length < 30) hasOlderMessages.value = false
    if (olderData.length > 0) {
      messages.value = [...olderData, ...messages.value]
      
      await nextTick()
      // Pertahankan posisi scroll agar tidak lompat
      const scrollHeightAfter = container?.scrollHeight || 0
      container.scrollTop = scrollHeightAfter - scrollHeightBefore
    }
  } catch (err) {
    console.error(err)
    alert('Gagal memuat pesan lama: ' + err.message)
  } finally {
    isLoadingOlder.value = false
  }
}

// ============ REALTIME ============

const subscribeToRealtime = () => {
  const onInsert = (newMsg) => {
    // Jangan duplikat jika pesan sudah ada (dari sendMessage lokal)
    if (messages.value.some(m => m.id === newMsg.id)) return
    messages.value.push(newMsg)
    
    // Auto-scroll hanya jika user sudah di bawah
    if (isNearBottom()) {
      nextTick(() => scrollToBottom())
    }
  }

  // Attach delete handler
  onInsert._onDelete = (deletedId) => {
    messages.value = messages.value.filter(m => m.id !== deletedId)
  }

  realtimeChannel = chatService.subscribeToMessages(onInsert)
}

// ============ SENDING ============

const sendMessage = async () => {
  const content = newMessage.value.trim()
  if (!content || isSending.value) return
  
  const userId = currentUser.value?.id
  if (!userId) return
  
  isSending.value = true
  newMessage.value = ''
  resetTextareaHeight()

  try {
    const sent = await chatService.sendMessage(userId, content)
    // Tambahkan langsung ke lokal (optimistic)
    if (!messages.value.some(m => m.id === sent.id)) {
      messages.value.push(sent)
    }
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error(err)
    alert('Gagal mengirim pesan: ' + err.message)
    // Kembalikan teks jika gagal
    newMessage.value = content
  } finally {
    isSending.value = false
    inputField.value?.focus()
  }
}

const showDeleteDialog = ref(false)
const deleteTargetId = ref(null)
const isDeletingMessage = ref(false)

const promptDeleteMessage = (id) => {
  deleteTargetId.value = id
  showDeleteDialog.value = true
}

const executeDeleteMessage = async () => {
  if (!deleteTargetId.value) return
  isDeletingMessage.value = true
  try {
    await chatService.deleteMessage(deleteTargetId.value)
    messages.value = messages.value.filter(m => m.id !== deleteTargetId.value)
    showDeleteDialog.value = false
  } catch (err) {
    console.error(err)
    alert('Gagal menghapus pesan: ' + err.message)
  } finally {
    isDeletingMessage.value = false
    deleteTargetId.value = null
  }
}

// ============ HELPERS ============

const isOwnMessage = (msg) => msg.user_id === currentUser.value?.id

const isNearBottom = () => {
  const container = messagesContainer.value
  if (!container) return true
  return container.scrollHeight - container.scrollTop - container.clientHeight < 120
}

const scrollToBottom = () => {
  const container = messagesContainer.value
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

const handleScroll = () => {
  // Bisa dipakai untuk trigger loadOlder otomatis di masa depan
}

const autoResize = () => {
  const el = inputField.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

const resetTextareaHeight = () => {
  const el = inputField.value
  if (el) el.style.height = 'auto'
}

// ============ FORMATTING ============

const formatTime = (isoString) => {
  const d = new Date(isoString)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const formatDateLabel = (isoString) => {
  const d = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hari Ini'
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const showDateSeparator = (idx) => {
  if (idx === 0) return true
  const curr = new Date(messages.value[idx].created_at).toDateString()
  const prev = new Date(messages.value[idx - 1].created_at).toDateString()
  return curr !== prev
}

const getInitial = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

// Warna avatar konsisten per-nama
const avatarColors = [
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
  '#1abc9c', '#e67e22', '#e91e63', '#00bcd4', '#8bc34a'
]

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const getSenderColor = (profile) => {
  if (!profile?.roles) return 'var(--c-text-main)'
  if (profile.roles.includes('admin')) return 'var(--c-danger)'
  if (profile.roles.includes('dosen')) return '#3b82f6'
  return '#2ecc71'
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--c-bg);
}

/* ========== HEADER ========== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--c-text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  margin-right: -0.25rem;
}

.back-btn:hover {
  background: var(--c-bg);
}

.chat-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), #e74c3c);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(198, 40, 40, 0.3);
}

.chat-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--c-text-main);
  line-height: 1.2;
}

.chat-subtitle {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

/* ========== MESSAGES CONTAINER ========== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background-color: #f0ece6;
  
  /* Subtle warm pattern */
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.chat-loading, .chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 0.75rem;
  color: var(--c-text-muted);
  font-size: 0.85rem;
}

/* Load older button */
.load-older {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.load-older-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  color: var(--c-text-muted);
  padding: 0.35rem 0.85rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-older-btn:hover:not(:disabled) {
  border-color: var(--c-primary);
  color: var(--c-primary);
}

.load-older-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== DATE SEPARATOR ========== */
.date-separator {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0;
}

.date-separator span {
  background: rgba(0, 0, 0, 0.06);
  color: var(--c-text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.3rem 0.85rem;
  border-radius: 100px;
  letter-spacing: 0.3px;
}

/* ========== MESSAGE BUBBLES ========== */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  max-width: 75%;
}

.message-row.own {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  margin-bottom: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

/* Bubble orang lain: putih bersih */
.message-bubble {
  padding: 0.5rem 0.75rem;
  border-radius: 16px 16px 16px 4px;
  background: #ffffff;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  position: relative;
  min-width: 65px;
}

/* Bubble sendiri: merah terang transparan */
.message-bubble.own-bubble {
  background: rgba(198, 40, 40, 0.1);
  border: 1px solid rgba(198, 40, 40, 0.15);
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 1px 3px rgba(198, 40, 40, 0.08);
}

.message-bubble.own-bubble .msg-time {
  color: rgba(198, 40, 40, 0.45);
}

.sender-name {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
  line-height: 1.2;
}

.sender-badge {
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--c-text-muted);
  margin-left: 0.3rem;
}

.msg-text {
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--c-text-main);
  word-break: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  margin: 0;
}

.msg-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  margin-top: 0.15rem;
}

.msg-time {
  font-size: 0.6rem;
  color: var(--c-text-muted);
  opacity: 0.7;
}

.delete-msg-btn {
  background: none;
  border: none;
  color: var(--c-text-muted);
  cursor: pointer;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  display: flex;
  align-items: center;
}

.message-row:hover .delete-msg-btn {
  opacity: 0.6;
}

.delete-msg-btn:hover {
  opacity: 1 !important;
  color: var(--c-danger);
}

/* ========== INPUT BAR ========== */
.chat-input-bar {
  padding: 0.6rem 1rem;
  background: var(--c-surface);
  border-top: 1px solid var(--c-border);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 24px;
  padding: 0.3rem 0.4rem 0.3rem 1rem;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--c-primary);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--c-text-main);
  resize: none;
  max-height: 120px;
  padding: 0.35rem 0;
  font-family: inherit;
}

.chat-input::placeholder {
  color: var(--c-text-muted);
  opacity: 0.6;
}

.send-btn {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  border: none;
  background: var(--c-border);
  color: var(--c-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn.active {
  background: var(--c-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(198, 40, 40, 0.35);
}

.send-btn.active:hover {
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== ANIMATIONS ========== */
.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .chat-page {
    height: 100vh;
  }

  .chat-messages {
    padding: 1rem 0.85rem 0.5rem;
  }

  .message-row {
    max-width: 85%;
  }

  .chat-input-bar {
    padding: 0.5rem 0.75rem;
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
  }
}
</style>
