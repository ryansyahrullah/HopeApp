<template>
  <div class="public-feedback-page animate-fade-in">
    <!-- HERO SECTON BRAND -->
    <div class="header-banner">
      <!-- Header Actions (Desktop) -->
      <div class="header-actions">
        <div id="google_translate_element" class="translate-widget"></div>
        
        <button class="login-nav-btn" @click="$router.push(currentUser ? '/' : '/login')">
          <LayoutDashboard v-if="currentUser" :size="18" />
          <LogIn v-else :size="18" />
          <span>{{ currentUser ? 'Dashboard' : 'Masuk' }}</span>
        </button>
      </div>
      
      <div class="brand">
        <h1 class="zh font-display">HopeApp 希</h1>
        <p>Portal Aspirasi Terbuka</p>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="content-container">

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
        <h3>Belum Ada Suara</h3>
        <p>Dinding aspirasi ini masih bersih. Belum ada masukan terdokumentasi.</p>
      </div>

      <div v-else class="masonry-grid">
        <div v-for="item in feedbacks" :key="item.id" class="feedback-card">
          <Quote class="quote-deco" :size="64" />
          
          <div class="card-content-wrap">
            <p class="content-text">{{ item.content }}</p>
          </div>
          
          <div class="card-footer">
            <div class="author-info">
              <div class="author-details">
                <span class="author-name">{{ item.author_name }}</span>
                <span class="submit-date">{{ formatShortDate(item.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Load More Button -->
      <div v-if="hasMore" class="load-more-container text-center">
        <button @click="loadFeedbacks(true)" class="load-more-btn" :disabled="isLoadingMore">
          <Loader2 v-if="isLoadingMore" class="spin-icon" :size="18" />
          <span>{{ isLoadingMore ? 'Memuat...' : 'Muat Lebih Banyak' }}</span>
        </button>
      </div>
      
    </div>
    
    <!-- FIXED FOOTER -->
    <div class="footer-note animate-fade-in text-center">
      <p class="footer-text">&copy; 2026 HopeApp - POLIBAN</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MessageSquareDashed, Loader2, Quote, LogIn, LayoutDashboard } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { feedbackService } from '@/services/feedbackService'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'

const { currentUser } = useAuth()

const feedbacks = ref([])
const isLoading = ref(true)
const currentPage = ref(0)
const hasMore = ref(true)
const isLoadingMore = ref(false)
const { error: toastError, startWatchdog, stopWatchdog } = useToast()

const loadFeedbacks = async (isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMore.value = true
    currentPage.value++
  } else {
    isLoading.value = true
    currentPage.value = 0
    feedbacks.value = []
  }

  startWatchdog('memuat terlalu lama, harap refresh!', 7000)
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
    console.error('Failed to load public feedbacks:', err)
    toastError('Gagal memuat masukan publik: ' + err.message)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
    stopWatchdog()
  }
}

const loadGoogleTranslate = () => {
  if (document.getElementById('google-translate-script')) return
  
  window.googleTranslateElementInit = () => {
    if (window.google && window.google.translate) {
      new window.google.translate.TranslateElement({
        pageLanguage: 'id',
        includedLanguages: 'id,en,zh-CN,zh-TW',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element')
    }
  }

  const script = document.createElement('script')
  script.id = 'google-translate-script'
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  document.head.appendChild(script)
}

onMounted(() => {
  loadFeedbacks()
  loadGoogleTranslate()
})

const formatShortDate = (isoString) => {
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
.public-feedback-page {
  min-height: 100vh;
  width: 100%;
  background-color: var(--c-bg);
}

/* Red Banner */
.header-banner {
  background: linear-gradient(-45deg, var(--c-primary), #991b1b, #b91c1c, #7f1d1d);
  background-size: 400% 400%;
  animation: gradientBG 10s ease infinite;
  color: white;
  padding: 2.5rem 1rem 3.5rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(153, 27, 27, 0.3);
  position: relative;
  overflow: hidden;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.header-banner::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%; right: -50%; bottom: -50%;
  background-image: url('data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.03" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Ccircle cx="23" cy="23" r="3"/%3E%3C/g%3E%3C/svg%3E');
  transform: rotate(15deg);
  pointer-events: none;
}

.brand {
  position: relative;
  z-index: 2;
}

.brand h1 {
  font-size: 2.4rem;
  font-weight: 800;
  margin-bottom: 2px;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0,0,0,0.4);
  letter-spacing: -1px;
}

.brand .zh {
  font-size: 2.6rem;
}

.brand p {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-size: 0.95rem;
  margin-top: -10px;
}

.content-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 3rem 2rem 6rem; /* Extra bottom padding for fixed footer */
}

/* Customizing Google Translate Dropdown tightly on top right */
.header-actions {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 100;
}

.translate-widget {
  position: relative;
  min-width: 160px; /* Ensure space for Google Translate */
  display: flex;
  justify-content: flex-end;
}

.login-nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 100px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.login-nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.login-nav-btn:active {
  transform: scale(0.95);
}

:deep(.goog-te-gadget-simple) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px !important;
  padding: 0.5rem 1rem !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 0.9rem !important;
  color: white !important;
  transition: background-color 0.2s ease;
}

:deep(.goog-te-gadget-simple:hover) {
  background-color: rgba(255, 255, 255, 0.25) !important;
}

/* Hide the ugly Google banner text inside the gadget if possible */
:deep(.goog-te-gadget-simple span) {
  color: white !important;
}
:deep(.goog-te-gadget-icon) {
  display: none !important;
}



/* =======================================
   MASONRY/GRID STYLE
   ======================================= */
.masonry-grid {
  column-count: 3;
  column-gap: 2rem;
  margin-bottom: 3rem;
}

@media (max-width: 1024px) {
  .masonry-grid {
    column-count: 2;
  }
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
  border-top: 4px solid var(--c-primary);
  break-inside: avoid;
  margin-bottom: 2rem;
}

.feedback-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.08);
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

.load-more-container {
  margin-top: 1rem;
  margin-bottom: 3rem;
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

.footer-note {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.02);
  z-index: 50;
}

.footer-text {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.5px;
}

@media (prefers-color-scheme: dark) {
  .footer-note {
    background: rgba(15, 23, 42, 0.85);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .footer-text {
    color: #94a3b8;
  }
}

@media (max-width: 768px) {
  .header-banner {
    display: flex;
    flex-direction: column;
    padding: 2.5rem 1rem 3rem;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
  }
  
  .brand {
    order: 1;
  }
  
  .brand h1 {
    font-size: 2rem;
  }
  
  .brand .zh {
    font-size: 2.2rem;
  }

  .content-container {
    max-width: 100%;
    padding: 2rem 1rem;
  }
  
  .header-actions {
    position: relative;
    top: 0;
    right: 0;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1rem;
    order: 2;
  }
  
  .translate-widget {
    margin: 0;
  }
  
  .login-nav-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .masonry-grid {
    column-count: 1;
    column-gap: 1.25rem;
  }
  .feedback-card {
    margin-bottom: 1.25rem;
  }
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.feedback-card {
  animation: fadeInUp 0.5s ease forwards;
}
</style>



