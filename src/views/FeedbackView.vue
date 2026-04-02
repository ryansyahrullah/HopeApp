<template>
  <div class="feedback-page animate-fade-in">
    <div class="page-header">
      <div>
        <h2 class="page-title">Feedback <span class="zh">意见</span></h2>
      </div>
      <div v-if="isAdmin || isDosen" class="action-buttons">
        <button class="public-link-btn" @click="copyPublicLink">
          <Share2 :size="18" class="share-icon" /> 
          <span>Bagikan Tautan Publik</span>
        </button>
      </div>
    </div>

    <!-- ==========================================
         MAHASISWA VIEW: Form Input Premium
         ========================================== -->
    <div v-if="isMahasiswa" class="mahasiswa-section">
      <div class="glass-form-wrapper">
        <div class="form-hero">
          <div class="icon-circle mb-3"><Sparkles :size="32" /></div>
          <h3 class="hero-title">Ada cerita, ide, atau keluhan?</h3>
          <p class="hero-desc">Bantu kami meningkatkan kualitas kelas HOPE dengan memberikan masukan yang jujur. Semua laporan langsung diterima oleh pengurus inti.</p>
        </div>

        <form @submit.prevent="submitFeedback" class="premium-form">
          <div class="form-group">
            <div class="textarea-wrapper">
              <MessageSquareDashed class="textarea-icon" :size="20" />
              <textarea 
                id="feedback-content"
                v-model="feedbackContent" 
                rows="6" 
                placeholder="Ceritakan pengalaman Anda, beri saran, atau laporkan kendala teknis..." 
                required
                :disabled="isSubmitting"
                maxlength="500"
              ></textarea>
              <div class="char-counter" :class="{ 'text-danger': feedbackContent.length >= 500 }">
                {{ feedbackContent.length }} / 500
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="premium-btn" :disabled="isSubmitting || !feedbackContent.trim()">
              <Send :size="18" style="margin-right:0.5rem;" /> 
              {{ isSubmitting ? 'Mengirim...' : 'Kirim Masukan' }}
            </button>
          </div>

          <!-- Alert Messages -->
          <transition name="slide-up">
            <div v-if="successMessage" class="modern-alert success-alert mt-3">
              <CheckCircle :size="20" class="shrink-0" /> 
              <span>{{ successMessage }}</span>
            </div>
          </transition>

          <transition name="slide-up">
            <div v-if="errorMessage" class="modern-alert error-alert mt-3">
              <AlertCircle :size="20" class="shrink-0" /> 
              <span>{{ errorMessage }}</span>
            </div>
          </transition>
        </form>
      </div>
    </div>

    <!-- ==========================================
         ADMIN / DOSEN VIEW: Feedback Wall
         ========================================== -->
    <div v-if="isAdmin || isDosen" class="admin-section">
      <div v-if="isLoading" class="masonry-grid">
        <div v-for="i in 6" :key="i" class="feedback-card" style="box-shadow: none;">
          <div class="card-content-wrap" style="margin-top: 1rem;">
            <SkeletonLoader width="90%" height="1rem" style="margin-bottom: 0.6rem;" />
            <SkeletonLoader width="100%" height="1rem" style="margin-bottom: 0.6rem;" />
            <SkeletonLoader width="75%" height="1rem" style="margin-bottom: 1.5rem;" />
          </div>
          <div class="card-footer">
            <div class="author-info" style="width: 100%;">
              <div style="display: flex; flex-direction: column; gap: 0.4rem; width: 100%;">
                <SkeletonLoader width="100px" height="0.85rem" />
                <SkeletonLoader width="60px" height="0.65rem" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="feedbacks.length === 0" class="empty-state">
        <div class="empty-icon-wrapper"><MessageSquareDashed :size="48" /></div>
        <h3>Belum ada masukan</h3>
        <p>Belum ada mahasiswa yang mengirimkan aspirasi mereka sejauh ini.</p>
      </div>

      <div v-else class="masonry-grid">
        <div v-for="item in feedbacks" :key="item.id" class="feedback-card">
          <!-- Dekorasi kutipan -->
          <Quote class="quote-deco" :size="64" />
          
          <div class="card-content-wrap">
            <p class="content-text">{{ item.content }}</p>
          </div>
          
          <div class="card-footer">
            <div class="author-info">
              <div class="author-details">
                <span class="author-name">{{ item.author_name }}</span>
                <span class="submit-date">{{ formatDateTime(item.created_at) }}</span>
              </div>
            </div>
            
            <div class="card-actions" v-if="isAdmin">
              <button @click="promptDeleteFeedback(item.id)" class="delete-btn" title="Hapus Permanen">
                <Trash2 :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Load More Button -->
      <div v-if="hasMore" class="load-more-container mt-4 text-center">
        <button @click="loadFeedbacks(true)" class="load-more-btn" :disabled="isLoadingMore">
          <Loader2 v-if="isLoadingMore" class="spin-icon" :size="18" />
          <span>{{ isLoadingMore ? 'Memuat...' : 'Muat Lebih Banyak' }}</span>
        </button>
      </div>

    </div>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :visible="showDeleteDialog"
      title="Hapus Masukan?"
      message="Apakah Anda yakin ingin menghapus masukan publik ini secara permanen?"
      confirmText="Ya, Hapus"
      variant="danger"
      :loading="isDeletingFeedback"
      @confirm="executeDeleteFeedback"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Share2, Send, CheckCircle, AlertCircle, Trash2, Calendar, MessageSquareDashed, Loader2, Sparkles, Quote } from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useAuth } from '@/composables/useAuth'
import { feedbackService } from '@/services/feedbackService'

const { isMahasiswa, isAdmin, isDosen, currentUser } = useAuth()

// State Mahasiswa
const feedbackContent = ref('')
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// State Admin/Dosen
const feedbacks = ref([])
const isLoading = ref(true)
const currentPage = ref(0)
const hasMore = ref(true)
const isLoadingMore = ref(false)

const loadFeedbacks = async (isLoadMore = false) => {
  if (!isAdmin.value && !isDosen.value) return
  
  if (isLoadMore) {
    isLoadingMore.value = true
    currentPage.value++
  } else {
    isLoading.value = true
    currentPage.value = 0
    feedbacks.value = []
  }

  try {
    const newData = await feedbackService.getAllFeedback(currentPage.value, 20)
    
    if (newData.length < 20) {
      hasMore.value = false
    } else {
      hasMore.value = true
    }

    if (isLoadMore) {
      feedbacks.value = [...feedbacks.value, ...newData]
    } else {
      feedbacks.value = newData
    }
  } catch (err) {
    console.error('Failed to load feedbacks:', err)
    alert('Gagal memuat daftar masukan: ' + err.message)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

onMounted(() => {
  loadFeedbacks()
})

const submitFeedback = async () => {
  if (!feedbackContent.value.trim()) return
  
  isSubmitting.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // Bangun authorName: H-001 - Ryan
    const nim = currentUser.value?.student_number || 'Unknown ID'
    const fullName = currentUser.value?.full_name || 'Tanpa Nama'
    const shortName = fullName.split(' ')[0]
    
    const authorName = `${nim} - ${shortName}`
    
    await feedbackService.submitFeedback(authorName, feedbackContent.value)
    
    successMessage.value = 'Terima kasih atas suaranya! Masukan Anda sangat berharga.'
    feedbackContent.value = ''
    
    setTimeout(() => {
      successMessage.value = ''
    }, 6000)
  } catch (error) {
    console.error('Error submitting feedback:', error)
    errorMessage.value = 'Mohon maaf, server sedang sibuk. Silakan coba sebentar lagi.'
  } finally {
    isSubmitting.value = false
  }
}

const showDeleteDialog = ref(false)
const deleteTargetId = ref(null)
const isDeletingFeedback = ref(false)

const promptDeleteFeedback = (id) => {
  deleteTargetId.value = id
  showDeleteDialog.value = true
}

const executeDeleteFeedback = async () => {
  if (!deleteTargetId.value) return
  isDeletingFeedback.value = true
  
  try {
    await feedbackService.deleteFeedback(deleteTargetId.value)
    feedbacks.value = feedbacks.value.filter(f => f.id !== deleteTargetId.value)
    showDeleteDialog.value = false
  } catch (err) {
    console.error('Failed to delete feedback:', err)
    alert('Gagal menghapus masukan.')
  } finally {
    isDeletingFeedback.value = false
    deleteTargetId.value = null
  }
}

const copyPublicLink = () => {
  const url = `${window.location.origin}/masukan`
  navigator.clipboard.writeText(url).then(() => {
    alert('Link akses publik berhasil disalin:\n' + url)
  }).catch(() => {
    alert('Gagal menyalin link. Anda dapat membagikan link ini secara manual:\n' + url)
  })
}

const formatDateTime = (isoString) => {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}
</script>

<style scoped>
.feedback-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--c-text-main);
  margin-bottom: 0;
}

.page-title .zh {
  font-size: 1.6rem;
  opacity: 0.3;
  margin-left: 0.5rem;
  color: var(--c-primary);
}

.public-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05));
  border: 1px solid rgba(220, 38, 38, 0.3);
  color: var(--c-danger);
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
}

.public-link-btn:hover {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(220, 38, 38, 0.2);
}

.public-link-btn:hover .share-icon {
  transform: scale(1.1) rotate(-10deg);
}

.public-link-btn .share-icon {
  transition: transform 0.3s ease;
}

/* =======================================
   MAHASISWA FORM: GLASS & PREMIUM
   ======================================= */
.glass-form-wrapper {
  max-width: 700px;
  margin: 0 auto;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,1);
  backdrop-filter: blur(20px);
  overflow: hidden;
  position: relative;
}

/* Dark mode fallback for glass */
@media (prefers-color-scheme: dark) {
  .glass-form-wrapper {
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.6));
    border-color: rgba(255, 255, 255, 0.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
}

.form-hero {
  padding: 3rem 2.5rem 2rem;
  background: linear-gradient(135deg, #fef2f2, #fff1f2);
  text-align: center;
  border-bottom: 1px dashed rgba(220, 38, 38, 0.2);
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), #fb7185);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 10px 25px rgba(225, 29, 72, 0.3);
}

.hero-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--c-text-main);
  margin-bottom: 0.75rem;
}

.hero-desc {
  font-size: 0.95rem;
  color: var(--c-text-muted);
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
}

.premium-form {
  padding: 2.5rem;
  background: var(--c-surface);
}

.textarea-wrapper {
  position: relative;
}

.textarea-icon {
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: var(--c-text-muted);
  opacity: 0.6;
  pointer-events: none;
}

.premium-form textarea {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid var(--c-bg); /* Tebal agar kokoh */
  border-radius: 16px;
  background-color: var(--c-bg);
  color: var(--c-text-main);
  font-family: inherit;
  font-size: 1.05rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 150px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.premium-form textarea:focus {
  outline: none;
  border-color: var(--c-primary);
  background-color: var(--c-surface);
  box-shadow: 0 10px 25px -5px rgba(220, 38, 38, 0.15);
}

.char-counter {
  position: absolute;
  bottom: 0.75rem;
  right: 1.25rem;
  font-size: 0.8rem;
  color: var(--c-text-muted);
  font-weight: 500;
  background-color: var(--c-bg); /* to cover border if any */
  padding: 0 0.5rem;
  border-radius: 4px;
}

.char-counter.text-danger {
  color: var(--c-danger);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.premium-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--c-primary), #ce2424);
  color: white;
  padding: 0.85rem 2rem;
  border-radius: 100px;
  border: none;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 15px rgba(220, 38, 38, 0.25);
  transition: all 0.3s ease;
}

.premium-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.35);
}

.premium-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--c-text-muted);
  box-shadow: none;
}

/* ALERTS */
.modern-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.95rem;
  line-height: 1.4;
}

.success-alert {
  background: #f0fdf4;
  color: #16a34a;
  border-left: 4px solid #16a34a;
}

.error-alert {
  background: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

.shrink-0 { flex-shrink: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(10px); }

/* =======================================
   ADMIN/DOSEN LIST: MASONRY/GRID STYLE
   ======================================= */
.masonry-grid {
  column-width: 350px;
  column-gap: 1.5rem;
}

.feedback-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.25rem 1rem;
  border-radius: 16px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: 0 4px 12px -5px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  break-inside: avoid;
  margin-bottom: 1.5rem;
}

.feedback-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.08);
  border-color: rgba(220, 38, 38, 0.3);
}

.quote-deco {
  position: absolute;
  top: -5px;
  left: 5px;
  color: var(--c-bg);
  opacity: 0.6;
  z-index: 0;
  transform: rotate(180deg);
}

.card-content-wrap {
  position: relative;
  z-index: 1;
  flex: 1;
  margin-bottom: 1rem;
}

.content-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--c-text-main);
  font-weight: 500;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--c-bg);
  z-index: 1;
}

.author-info {
  display: flex;
  align-items: center;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 700;
  color: var(--c-text-main);
  font-size: 0.85rem;
}

.submit-date {
  font-size: 0.75rem;
  color: var(--c-text-muted);
}

.delete-btn {
  background: #fef2f2;
  border: none;
  color: var(--c-danger);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: var(--c-danger);
  color: white;
  transform: scale(1.1);
}

/* Empty & Loading States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  background: var(--c-surface);
  border-radius: 24px;
  border: 1px dashed var(--c-border);
}

.empty-icon-wrapper {
  color: var(--c-text-muted);
  opacity: 0.3;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.4rem;
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--c-text-muted);
}

.load-more-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  color: var(--c-text-main);
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(0,0,0,0.03);
}

.load-more-btn:hover:not(:disabled) {
  border-color: var(--c-primary);
  color: var(--c-primary);
  transform: translateY(-2px);
}

.load-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .glass-form-wrapper {
    border-radius: 20px;
  }
  
  .form-hero {
    padding: 1.5rem 1.25rem 1.25rem;
  }
  
  .hero-title {
    font-size: 1.3rem;
  }

  .premium-form {
    padding: 1.25rem;
  }
  
  .masonry-grid {
    column-count: 1;
  }
}
</style>

