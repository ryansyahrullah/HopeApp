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
      
      <div class="chat-header-actions">
        <button class="action-btn" @click="hardRefresh" :disabled="isLoading" title="Refresh">
          <Loader2 v-if="isLoading" class="spin-icon" :size="20" />
          <RefreshCcw v-else :size="20" />
        </button>
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

          <div 
            class="message-row" 
            :class="{ 'own': isOwnMessage(msg), 'ai-row': isAiMessage(msg) }"
            @contextmenu.prevent="isOwnMessage(msg) ? showContextMenu($event, msg) : null"
            @touchstart="isOwnMessage(msg) ? onTouchStart($event, msg) : null"
            @touchend="onTouchEnd"
            @touchmove="onTouchEnd"
          >
            <div class="message-bubble" :class="{ 'own-bubble': isOwnMessage(msg), 'ai-bubble': isAiMessage(msg), 'editing-bubble': editingMessageId === msg.id }">
              <!-- Sender name (hanya untuk pesan orang lain) -->
              <span v-if="!isOwnMessage(msg)" class="sender-name" :style="{ color: isAiMessage(msg) ? '#db2777' : getSenderColor(msg.author_roles), display: isAiMessage(msg) ? 'flex' : 'block', alignItems: 'center', gap: '4px' }">
                <img v-if="isAiMessage(msg)" src="/cici_avatar.png" alt="Cici" class="cici-avatar-small" />
                {{ msg.author_name || 'Unknown' }}
                <span v-if="msg.author_number && !isAiMessage(msg)" class="sender-badge">{{ msg.author_number }}</span>
              </span>
              
              <!-- Edit Mode -->
              <template v-if="editingMessageId === msg.id">
                <textarea
                  ref="editField"
                  v-model="editContent"
                  class="edit-textarea"
                  rows="1"
                  maxlength="1000"
                  @input="autoResizeEdit"
                  @keydown.escape="cancelEdit"
                ></textarea>
                <div class="edit-actions">
                  <button class="edit-action-btn cancel-btn" @click="cancelEdit">Batal</button>
                  <button class="edit-action-btn save-btn" @click="saveEdit(msg.id)" :disabled="!editContent.trim() || isSavingEdit">Simpan</button>
                </div>
              </template>

              <!-- Normal Mode -->
              <template v-else>
                <p class="msg-text" v-html="formatMessage(msg.content)"></p>

              
                <div class="msg-meta">
                  <span v-if="msg.is_edited" class="msg-edited">(diedit)</span>
                  <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
                </div>
              </template>
            </div>
          </div>
        </template>
      </template>

      <!-- Typing Indicator for Cici -->
      <div v-if="isCiciTyping" class="message-row ai-row">
        <div class="message-bubble ai-bubble typing-bubble">
          <span class="sender-name" style="color: #db2777; display: flex; align-items: center; gap: 4px;">
            <img src="/cici_avatar.png" alt="Cici" class="cici-avatar-small" />
            Cici 希
          </span>
          <div class="typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Scroll to bottom indicator -->
      <div ref="bottomAnchor"></div>
    </div>

    <!-- INPUT BAR -->
    <div class="chat-input-bar">
      <!-- Mention Menu -->
      <div v-if="showMentionMenu" class="mention-menu animate-fade-in">
        <button class="mention-item" @click="insertMention('Cici')">
          <div class="mention-avatar-image">
            <img src="/cici_avatar.png" alt="Cici avatar" />
          </div>
          <div class="mention-info">
            <span class="mention-name">Cici 希</span>
            <span class="mention-desc">AI Assistant</span>
          </div>
        </button>
      </div>

      <div class="input-wrapper">
        <textarea
          ref="inputField"
          v-model="newMessage"
          placeholder="Ketik pesan..."
          rows="1"
          maxlength="1000"
          class="chat-input"
          @input="handleInput"
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

    <!-- Context Menu -->
    <Teleport to="body">
      <div 
        v-if="contextMenu.visible" 
        class="context-overlay" 
        @click="closeContextMenu"
        @contextmenu.prevent="closeContextMenu"
      >
        <div 
          class="context-menu" 
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
          @click.stop
        >
          <button class="context-menu-item" @click="startEdit(contextMenu.message)">
            <Pencil :size="14" />
            <span>Edit</span>
          </button>
          <button class="context-menu-item danger" @click="promptDeleteFromMenu">
            <Trash2 :size="14" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </Teleport>

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
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { MessagesSquare, SendHorizontal, Loader2, ChevronUp, Trash2, ArrowLeft, Pencil, RefreshCcw } from 'lucide-vue-next'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuth } from '@/composables/useAuth'
import { chatService } from '@/services/chatService'
import { useChatBadge } from '@/composables/useChatBadge'
import { askCici } from '@/services/aiService'

const { currentUser } = useAuth()
const { resetBadge } = useChatBadge()

const messages = ref([])
const newMessage = ref('')
const isLoading = ref(true)
const isSending = ref(false)
const isLoadingOlder = ref(false)
const hasOlderMessages = ref(true)

const showMentionMenu = ref(false)
const isCiciTyping = ref(false)

const messagesContainer = ref(null)
const bottomAnchor = ref(null)
const inputField = ref(null)
const editField = ref(null)

let realtimeChannel = null

// ============ LIFECYCLE ============

onMounted(async () => {
  resetBadge()
  await loadMessages()
  subscribeToRealtime()
  scrollToBottom()
})

onUnmounted(() => {
  resetBadge()
  if (realtimeChannel) {
    chatService.unsubscribe(realtimeChannel)
  }
})

// ============ DATA LOADING ============

const hardRefresh = () => {
  window.location.reload()
}

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

  // Attach update handler
  onInsert._onUpdate = (updatedMsg) => {
    const idx = messages.value.findIndex(m => m.id === updatedMsg.id)
    if (idx !== -1) {
      messages.value[idx] = { ...messages.value[idx], ...updatedMsg }
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
  showMentionMenu.value = false
  resetTextareaHeight()

  try {
    const sent = await chatService.sendMessage(
      userId, 
      content,
      currentUser.value?.full_name || 'Unknown',
      currentUser.value?.student_number || null,
      currentUser.value?.roles || ['mahasiswa']
    )
    // Tambahkan langsung ke lokal (optimistic)
    if (!messages.value.some(m => m.id === sent.id)) {
      messages.value.push(sent)
    }
    resetBadge()
    await nextTick()
    scrollToBottom()

    // AI Trigger check
    if (content.toLowerCase().includes('@cici')) {
      triggerAiAssistant(content, userId)
    }
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

const triggerAiAssistant = async (question, userId) => {
  isCiciTyping.value = true
  nextTick(() => scrollToBottom())
  
  // Ambil history 10 chat terakhir, sebelum pesan bot
  const history = messages.value.slice(-10).map(m => ({
    isOwn: m.user_id === userId,
    content: m.content
  }))
  
  const result = await askCici(question, userId, false, history)
  
  if (!result.success && result.error) {
    // Tampilkan error sebagai local bubble
    messages.value.push({
      id: 'error-local-' + Date.now(),
      user_id: 'system',
      author_name: 'System',
      author_roles: ['admin'], // supaya distinct
      content: `⚠️ Cici gagal merespons: ${result.error}`,
      created_at: new Date().toISOString()
    })
  }
  
  isCiciTyping.value = false
  nextTick(() => scrollToBottom())
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

// ============ CONTEXT MENU ============

const contextMenu = reactive({ visible: false, x: 0, y: 0, message: null })
let longPressTimer = null

const showContextMenu = (event, msg) => {
  // Posisi menu
  const menuW = 150, menuH = 90
  let x = event.clientX || event.touches?.[0]?.clientX || 0
  let y = event.clientY || event.touches?.[0]?.clientY || 0
  // Cegah keluar layar
  if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8
  if (y + menuH > window.innerHeight) y = y - menuH
  
  contextMenu.x = x
  contextMenu.y = y
  contextMenu.message = msg
  contextMenu.visible = true
}

const closeContextMenu = () => {
  contextMenu.visible = false
  contextMenu.message = null
}

const onTouchStart = (event, msg) => {
  longPressTimer = setTimeout(() => {
    // Haptic feedback (jika didukung)
    if (navigator.vibrate) navigator.vibrate(30)
    showContextMenu(event, msg)
  }, 500)
}

const onTouchEnd = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const promptDeleteFromMenu = () => {
  const id = contextMenu.message?.id
  closeContextMenu()
  if (id) promptDeleteMessage(id)
}

// ============ EDIT MESSAGE ============

const editingMessageId = ref(null)
const editContent = ref('')
const isSavingEdit = ref(false)

const startEdit = (msg) => {
  closeContextMenu()
  editingMessageId.value = msg.id
  editContent.value = msg.content
  nextTick(() => {
    const el = editField.value
    // editField bisa berupa array karena v-for
    const textarea = Array.isArray(el) ? el[0] : el
    if (textarea) {
      textarea.focus()
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  })
}

const cancelEdit = () => {
  editingMessageId.value = null
  editContent.value = ''
}

const saveEdit = async (msgId) => {
  const content = editContent.value.trim()
  if (!content) return

  isSavingEdit.value = true
  try {
    const updated = await chatService.updateMessage(msgId, content)
    // Update lokal
    const idx = messages.value.findIndex(m => m.id === msgId)
    if (idx !== -1) {
      messages.value[idx] = { ...messages.value[idx], ...updated }
    }
    cancelEdit()
  } catch (err) {
    console.error(err)
    alert('Gagal mengedit pesan: ' + err.message)
  } finally {
    isSavingEdit.value = false
  }
}

const autoResizeEdit = (e) => {
  const el = e.target
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

// ============ HELPERS ============

const isOwnMessage = (msg) => msg.user_id === currentUser.value?.id
const isAiMessage = (msg) => msg.author_roles && msg.author_roles.includes('ai_assistant')

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

// ============ AI & MENTIONS ============

const handleInput = (e) => {
  autoResize()
  
  const val = newMessage.value
  const cursorP = e.target.selectionStart
  const textBeforeCursor = val.slice(0, cursorP)
  
  // Deteksi jika mengetik @ atau @C..
  const match = textBeforeCursor.match(/@(\w*)$/)
  if (match) {
    const query = match[1].toLowerCase()
    if ('cici'.startsWith(query)) {
      showMentionMenu.value = true
    } else {
      showMentionMenu.value = false
    }
  } else {
    showMentionMenu.value = false
  }
}

const insertMention = (name) => {
  const val = newMessage.value
  const cursorP = inputField.value?.selectionStart || val.length
  const textBeforeCursor = val.slice(0, cursorP)
  const textAfterCursor = val.slice(cursorP)
  
  const replacedBefore = textBeforeCursor.replace(/@\w*$/, `@${name} `)
  newMessage.value = replacedBefore + textAfterCursor
  showMentionMenu.value = false
  inputField.value?.focus()
  
  nextTick(() => {
    const newPos = replacedBefore.length
    if (inputField.value) {
      inputField.value.setSelectionRange(newPos, newPos)
    }
  })
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

const getSenderColor = (roles) => {
  if (!roles || !Array.isArray(roles)) return 'var(--c-text-main)'
  if (roles.includes('admin')) return 'var(--c-danger)'
  if (roles.includes('dosen')) return '#3b82f6'
  return '#2ecc71'
}

const formatMessage = (text) => {
  if (!text) return ''
  // Escape HTML to prevent XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  // Bold: **text** or ** text **
  return escaped.replace(/\*\*\s*(.*?)\s*\*\*/g, '<strong>$1</strong>')
}

</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--c-bg);
  overflow: hidden;
  position: relative;
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
  z-index: 10;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-header-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--c-text-muted);
  padding: 0.4rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--c-bg);
  color: var(--c-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  min-height: 0; /* Crucial for inner scroll in flex container */
  
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

.msg-edited {
  font-size: 0.55rem;
  color: var(--c-text-muted);
  opacity: 0.6;
  font-style: italic;
}

/* ========== CONTEXT MENU ========== */
.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.context-menu {
  position: fixed;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  padding: 0.35rem;
  min-width: 140px;
  z-index: 10000;
  animation: contextFadeIn 0.15s ease;
}

@keyframes contextFadeIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--c-text-main);
  cursor: pointer;
  transition: background 0.15s;
}

.context-menu-item:hover {
  background: var(--c-bg);
}

.context-menu-item.danger {
  color: var(--c-danger);
}

.context-menu-item.danger:hover {
  background: rgba(220, 38, 38, 0.08);
}

/* ========== EDIT MODE ========== */
.editing-bubble {
  border: 1.5px solid var(--c-primary) !important;
  background: rgba(198, 40, 40, 0.04) !important;
}

.edit-textarea {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.82rem;
  line-height: 1.4;
  color: var(--c-text-main);
  resize: none;
  max-height: 120px;
  font-family: inherit;
  padding: 0;
  margin: 0.15rem 0;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.edit-action-btn {
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-btn {
  background: var(--c-bg);
  color: var(--c-text-muted);
}

.cancel-btn:hover {
  background: var(--c-border);
}

.save-btn {
  background: var(--c-primary);
  color: white;
}

.save-btn:hover {
  opacity: 0.9;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== INPUT BAR ========== */
.chat-input-bar {
  position: relative;
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

/* ========== AI & MENTION STYLES ========== */
.ai-bubble {
  background: linear-gradient(135deg, #fff5f8 0%, #fdf4ff 50%, #fae8ff 100%) !important;
  border: 1.5px solid #fbcfe8 !important;
  border-radius: 20px 20px 20px 6px !important;
  box-shadow: 
    0 4px 14px rgba(244, 114, 182, 0.15), 
    inset 0 2px 6px rgba(255, 255, 255, 1) !important;
  padding: 0.75rem 1rem !important;
}

.ai-bubble .msg-text {
  color: #831843 !important;
  font-weight: 500;
  line-height: 1.5;
}

.ai-bubble .sender-name {
  color: #db2777 !important;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  background: linear-gradient(90deg, #db2777, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.ai-bubble .msg-time, .ai-bubble .msg-edited {
  color: #f472b6 !important;
  font-weight: 600;
}

.mention-menu {
  position: absolute;
  bottom: calc(100% + 5px);
  left: 1rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0.35rem;
  z-index: 100;
  min-width: 180px;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.mention-item:hover {
  background: var(--c-bg);
}

.mention-avatar-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.2);
  flex-shrink: 0;
}

.mention-avatar-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cici-avatar-small {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(139, 92, 246, 0.3);
}

.mention-info {
  display: flex;
  flex-direction: column;
}

.mention-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-text-main);
}

.mention-desc {
  font-size: 0.65rem;
  color: var(--c-text-muted);
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}

/* Typing Dots */
.typing-bubble {
  padding: 0.8rem 1rem !important;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 12px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background-color: #db2777;
  border-radius: 50%;
  animation: typing 1.4s infinite both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {

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
