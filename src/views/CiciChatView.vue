<template>
  <div class="cici-page animate-fade-in-up">
    <!-- HEADER -->
    <div class="chat-header">
      <div class="header-content">
        <button class="back-btn" @click="$router.push('/')">
          <ArrowLeft :size="22" stroke-width="2.5" />
        </button>
        <div class="header-info">
          <div class="assistant-avatar-wrapper">
             <img src="/cici_avatar.png" alt="Cici" class="assistant-avatar" />
             <div class="online-dot"></div>
          </div>
          <div>
            <h1 class="header-title">Cici 希</h1>
            <p class="header-subtitle">Personal AI Assistant</p>
          </div>
        </div>
      </div>
      <!-- Dropdown Menu -->
      <div class="header-actions" style="position: relative;">
        <button class="more-btn" @click="showMenu = !showMenu">
          <MoreVertical :size="20" />
        </button>

        <Teleport to="body">
          <div v-if="showMenu" class="menu-overlay" @click="showMenu = false"></div>
        </Teleport>
        
        <Transition name="dropdown-fade">
          <div v-if="showMenu" class="dropdown-menu">
            <button class="menu-item" @click="refreshPage">
              <RefreshCcw :size="16" /> Refresh
            </button>
            <button v-if="messages.length > 0" class="menu-item danger" @click="handleClearClick">
              <Trash2 :size="16" /> Hapus Obrolan
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- MESSAGES AREA -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="welcome-card">
          <img src="/cici_avatar.png" alt="Cici" class="welcome-avatar" />
          <h3>你好! (Nǐ hǎo!)</h3>
          <p>Saya Cici, asisten pribadi kamu. Kamu bisa tanyakan apa saja tentang kelas, tugas, atau belajar Bahasa Mandarin.</p>
          
          <div class="suggested-questions">
            <button class="suggestion-btn" @click="sendSuggestion('Tolong jelaskan penggunaan nada dalam Pinyin')">🇨🇳 Belajar Pinyin</button>
            <button class="suggestion-btn" @click="sendSuggestion('Apa bahasa Mandarinnya Semangat?')">🇨🇳 Translate Mandarin</button>
          </div>
        </div>
      </div>

      <template v-else>
        <div v-for="(msg, index) in messages" :key="index" class="message-wrapper">
          
          <!-- DATE SPLITTER -->
          <div v-if="index === 0" class="date-splitter">
            <span>Sesi Hari Ini</span>
          </div>

          <div 
            class="message-row" 
            :class="{ 'own': msg.isOwn, 'ai-row': !msg.isOwn }"
          >
            <div class="message-bubble" :class="{ 'own-bubble': msg.isOwn, 'ai-bubble': !msg.isOwn }">
              <span v-if="!msg.isOwn" class="sender-name" style="display: flex; align-items: center; gap: 4px;">
                <img src="/cici_avatar.png" alt="Cici" class="cici-avatar-small" />
                Cici 希
              </span>
              
              <div class="msg-content">
                <p class="msg-text" v-html="formatMessage(msg.content)"></p>

                <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Typing Indicator -->
      <div v-if="isCiciTyping" class="message-row ai-row">
        <div class="message-bubble ai-bubble typing-bubble">
          <span class="sender-name" style="display: flex; align-items: center; gap: 4px;">
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
      <div class="input-wrapper">
        <textarea
          ref="inputField"
          v-model="newMessage"
          placeholder="Tanya Cici sesuatu..."
          rows="1"
          maxlength="1000"
          class="chat-input"
          @input="autoResize"
          @keydown.enter.prevent="handleEnter"
        ></textarea>
        <button 
          class="send-btn" 
          :class="{ 'active': newMessage.trim() }"
          :disabled="!newMessage.trim() || isSending || isCiciTyping"
          @click="sendMessage"
        >
          <Loader2 v-if="isSending" class="spin-icon" :size="18" />
          <SendHorizontal v-else :size="18" />
        </button>
      </div>
    </div>

    <!-- Clear Chat Confirmation Dialog -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="Bersihkan Sesi Chat"
      message="Apakah kamu yakin ingin menghapus seluruh riwayat percakapan dengan Cici ini?"
      confirm-text="Hapus"
      cancel-text="Batal"
      variant="danger"
      @confirm="executeClearChat"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { SendHorizontal, Loader2, Trash2, ArrowLeft, MoreVertical, RefreshCcw } from 'lucide-vue-next'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuth } from '@/composables/useAuth'
import { askCici } from '@/services/aiService'

const { currentUser } = useAuth()

const messages = ref([])
const newMessage = ref('')
const isSending = ref(false)
const isCiciTyping = ref(false)
const showMenu = ref(false)

const messagesContainer = ref(null)
const bottomAnchor = ref(null)
const inputField = ref(null)

const showDeleteDialog = ref(false)

// Persistent localStorage per user
const storageKey = computed(() => `cici-chat-session-${currentUser.value?.id || 'guest'}`)

onMounted(() => {
  const saved = localStorage.getItem(storageKey.value)
  if (saved) {
    try {
      messages.value = JSON.parse(saved)
      if (messages.value.length > 0) scrollToBottom()
    } catch(e) {}
  }
})

const saveSession = () => {
  localStorage.setItem(storageKey.value, JSON.stringify(messages.value))
}

const executeClearChat = () => {
  messages.value = []
  localStorage.removeItem(storageKey.value)
  showDeleteDialog.value = false
}

const handleClearClick = () => {
  showMenu.value = false
  showDeleteDialog.value = true
}

const refreshPage = () => {
  showMenu.value = false
  window.location.reload()
}

const scrollToBottom = () => {
  nextTick(() => {
    bottomAnchor.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

const autoResize = () => {
  const el = inputField.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

const resetTextareaHeight = () => {
  if (inputField.value) inputField.value.style.height = 'auto'
}

const handleEnter = (e) => {
  if (e.shiftKey) {
    newMessage.value += '\n'
    autoResize()
    return
  }
  sendMessage()
}

const sendSuggestion = (text) => {
  newMessage.value = text
  sendMessage()
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
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


const sendMessage = async () => {
  const content = newMessage.value.trim()
  if (!content || isSending.value || isCiciTyping.value) return
  
  const userId = currentUser.value?.id
  if (!userId) return

  // Extract history BEFORE adding the new message
  // Get last 10 messages max
  const history = messages.value.slice(-10).map(m => ({
    isOwn: m.isOwn,
    content: m.content
  }))

  // 1. Add user message
  const userMsg = {
    isOwn: true,
    content: content,
    created_at: new Date().toISOString()
  }
  messages.value.push(userMsg)
  saveSession()
  
  newMessage.value = ''
  resetTextareaHeight()
  scrollToBottom()

  // 2. Trigger AI
  isCiciTyping.value = true
  scrollToBottom()
  
  try {
    const result = await askCici(content, userId, true, history) // isPrivate = true
    
    if (result.success) {
      const responseText = result.answer || (result.message && result.message.content) || "..."
      messages.value.push({
        isOwn: false,
        content: responseText,
        created_at: new Date().toISOString()
      })
      saveSession()
    } else if (result.error) {
      messages.value.push({
        isOwn: false,
        content: `⚠️ ${result.error}`,
        created_at: new Date().toISOString()
      })
      saveSession()
    }
  } catch (e) {
    console.error(e)
  } finally {
    isCiciTyping.value = false
    scrollToBottom()
    nextTick(() => inputField.value?.focus())
  }
}
</script>

<style scoped>
.cici-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--c-surface);
  position: relative;
  overflow: hidden;
}

/* ========== HEADER ========== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  background: white;
  border-bottom: 1px solid var(--c-border);
  box-shadow: 0 4px 20px rgba(244, 114, 182, 0.08);
  z-index: 10;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--c-text-main);
  padding: 0.4rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.back-btn:hover {
  background: var(--c-bg);
  color: var(--c-primary);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.assistant-avatar-wrapper {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #fbcfe8, #d8b4fe);
}

.assistant-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: white;
  border: 2px solid white;
}

.online-dot {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 12px;
  height: 12px;
  background-color: #22c55e;
  border: 2px solid white;
  border-radius: 50%;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--c-text-main);
  margin: 0 0 0.1rem 0;
  letter-spacing: -0.3px;
  background: linear-gradient(90deg, #db2777, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-subtitle {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  margin: 0;
  font-weight: 500;
}

.more-btn {
  background: transparent;
  border: none;
  color: var(--c-text-main);
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.more-btn:hover {
  background: var(--c-bg);
  color: var(--c-primary);
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 0.35rem;
  min-width: 180px;
  border: 1px solid var(--c-border);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--c-text-main);
  transition: background 0.2s;
  text-align: left;
}

.menu-item:hover {
  background: var(--c-bg);
}

.menu-item.danger {
  color: #dc2626;
}

.menu-item.danger:hover {
  background: #fef2f2;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ========== MESSAGES AREA ========== */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1rem;
  background-color: #fdf2f8; /* Soft pink background */
  background-image: radial-gradient(#fbcfe8 1px, transparent 1px);
  background-size: 24px 24px;
  min-height: 0; /* Crucial for inner scroll in flex container */
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background-color: #fbcfe8;
  border-radius: 4px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem 1rem;
}

.welcome-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(244, 114, 182, 0.15);
  max-width: 400px;
  border: 1px solid #fce7f3;
}

.welcome-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  box-shadow: 0 8px 20px rgba(219, 39, 119, 0.2);
  border: 4px solid #fdf2f8;
}

.welcome-card h3 {
  color: #831843;
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
}

.welcome-card p {
  color: #9d174d;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.suggested-questions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.5rem;
}

.suggestion-btn {
  background: #fdf2f8;
  border: 1px solid #fbcfe8;
  color: #db2777;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.suggestion-btn:hover {
  background: #fce7f3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.2);
}

.date-splitter {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0 1rem;
  clear: both;
}

.date-splitter span {
  background: rgba(253, 242, 248, 0.8);
  backdrop-filter: blur(8px);
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #db2777;
  border: 1px solid #fbcfe8;
}

/* ========== BUBBLES ========== */
.message-wrapper {
  margin-bottom: 0.5rem;
  width: 100%;
}

.message-row {
  display: flex;
  width: 100%;
  margin-bottom: 0.5rem;
}

.message-row.own {
  justify-content: flex-end;
}

.message-row.ai-row {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 75%;
  position: relative;
  word-break: break-word;
}

/* Own Bubble */
.own-bubble {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 20px 20px 4px 20px;
  padding: 0.6rem 1rem;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.2);
}
.own-bubble .msg-text {
  color: white;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}
.own-bubble .msg-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.65rem;
  display: block;
  text-align: right;
  margin-top: 4px;
}

/* AI Bubble (Elegant Pink) */
.ai-bubble {
  background: linear-gradient(135deg, #fff5f8 0%, #fdf4ff 50%, #fae8ff 100%);
  border: 1.5px solid #fbcfe8;
  border-radius: 20px 20px 20px 6px;
  box-shadow: 
    0 4px 14px rgba(244, 114, 182, 0.15), 
    inset 0 2px 6px rgba(255, 255, 255, 1);
  padding: 0.75rem 1rem;
}

.ai-bubble .msg-text {
  color: #831843;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

.ai-bubble .sender-name {
  color: #db2777;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  background: linear-gradient(90deg, #db2777, #9333ea);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 6px;
}

.cici-avatar-small {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 1px 3px rgba(139, 92, 246, 0.3);
}

.ai-bubble .msg-time {
  color: #f472b6;
  font-size: 0.65rem;
  font-weight: 600;
  display: block;
  text-align: left;
  margin-top: 4px;
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
  background-color: #f472b6;
  border-radius: 50%;
  animation: typing 1.4s infinite both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* ========== INPUT BAR ========== */
.chat-input-bar {
  padding: 0.8rem 1rem;
  background: white;
  border-top: 1px solid #fce7f3;
  box-shadow: 0 -4px 20px rgba(244, 114, 182, 0.05);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fdf2f8;
  border: 1.5px solid #fbcfe8;
  border-radius: 24px;
  padding: 0.4rem 0.5rem 0.4rem 1.25rem;
  transition: all 0.3s;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.input-wrapper:focus-within {
  border-color: #f472b6;
  background: white;
  box-shadow: 0 4px 15px rgba(244, 114, 182, 0.1);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #831843;
  resize: none;
  max-height: 120px;
  padding: 0.35rem 0;
  font-family: inherit;
}

.chat-input::placeholder {
  color: #f472b6;
  font-weight: 500;
}

.send-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 50%;
  border: none;
  background: #fce7f3;
  color: #f472b6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn.active {
  background: linear-gradient(135deg, #f472b6, #db2777);
  color: white;
  box-shadow: 0 4px 12px rgba(219, 39, 119, 0.3);
}

.send-btn.active:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(219, 39, 119, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ========== ANIMATIONS ========== */
.animate-fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .chat-messages {
    padding: 1rem 0.5rem;
  }

  .message-bubble {
    max-width: 85%;
  }

  .chat-input-bar {
    padding: 0.6rem 0.75rem;
    padding-bottom: calc(0.6rem + env(safe-area-inset-bottom, 0px));
  }
}
</style>
