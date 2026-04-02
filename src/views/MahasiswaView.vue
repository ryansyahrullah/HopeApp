<template>
  <div class="mahasiswa-page">
    <div class="page-header mb-2">
      <div>
        <h2 class="page-title">Daftar Mahasiswa</h2>
        <p class="page-subtitle">Daftar seluruh mahasiswa yang terdaftar dalam sistem.</p>
      </div>
    </div>

    <!-- Mobile Header, similar style to MeetingsView -->
    <div class="mobile-mahasiswa-header mobile-only">
      <div class="flex-between">
        <h2 style="font-size: 1.4rem; font-weight: 700; color: white; margin:0;">Mahasiswa</h2>
      </div>
      <p style="font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-top: 0.2rem;">Daftar Data Mahasiswa</p>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <Search :size="18" class="search-icon" />
      <input type="text" v-model="searchQuery" placeholder="Cari nama atau NIM..." />
    </div>

    <!-- Skeleton Loading -->
    <PageSkeleton v-if="isLoading" variant="list" :count="8" />

    <!-- List -->
    <div class="mahasiswa-list animate-fade-in" v-else-if="filteredList.length">
      <div 
        v-for="(mhs, index) in filteredList" 
        :key="mhs.id" 
        class="mahasiswa-item"
        @click="goToDetail(mhs.id)"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="mhs-avatar">
          <User :size="24" />
        </div>
        <div class="mhs-info">
          <h4 class="mhs-name">{{ mhs.full_name }}</h4>
          <span class="mhs-nim">{{ mhs.nim || mhs.id }} • {{ mhs.student_number || '-' }}</span>
        </div>
        <div class="mhs-right">
          <ChevronRight :size="20" class="chevron" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { profileService } from '@/services/profileService'
import { User, ChevronRight, Search } from 'lucide-vue-next'
import PageSkeleton from '@/components/common/PageSkeleton.vue'

const router = useRouter()
const searchQuery = ref('')
const mahasiswaList = ref([])
const isLoading = ref(true)

const loadMahasiswa = async () => {
  isLoading.value = true
  try {
    mahasiswaList.value = await profileService.getAllStudents()
  } catch (error) {
    console.error('Error loading mahasiswa:', error)
  } finally {
    isLoading.value = false
  }
}

const filteredList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return mahasiswaList.value
  return mahasiswaList.value.filter(m =>
    m.full_name?.toLowerCase().includes(q) ||
    m.nim?.toLowerCase().includes(q) ||
    m.student_number?.toLowerCase().includes(q)
  )
})

const goToDetail = (id) => {
  router.push(`/mahasiswa/${id}`)
}

onMounted(() => {
  loadMahasiswa()
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--c-text-muted);
}

.mb-2 {
  margin-bottom: 2rem;
}

/* Base List Style (Both Desktop & Mobile can share this) */
.mahasiswa-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--c-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 15px -3px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid var(--c-border);
}

.mahasiswa-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
  gap: 1rem;
  background: var(--c-surface);
  transition: background-color 0.2s;
  cursor: pointer;
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
}

.mahasiswa-item:last-child {
  border-bottom: none;
}

.mahasiswa-item:hover {
  background: var(--c-bg);
}

.mhs-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--c-primary-light, rgba(198, 40, 40, 0.1));
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mhs-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mhs-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.2rem;
}

.mhs-nim {
  font-size: 0.8rem;
  color: var(--c-text-muted);
}

.mhs-right {
  display: flex;
  align-items: center;
}

.chevron {
  color: var(--c-border);
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  padding: 0.7rem 1rem;
  margin-bottom: 1.25rem;
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--c-primary);
}

.search-icon {
  color: var(--c-text-muted);
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  color: var(--c-text-main);
  width: 100%;
}

.search-bar input::placeholder {
  color: var(--c-text-muted);
}

/* Mobile Native Styles */
.mobile-mahasiswa-header {
  display: none;
}

@media (max-width: 768px) {
  .page-header {
    display: none;
  }
  
  .mobile-mahasiswa-header {
    display: block;
    margin: -1rem -1rem 1.5rem -1rem;
    padding: 1.5rem 1.5rem 2.5rem 1.5rem;
    background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
    color: white;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    position: relative;
    z-index: 1;
  }

  .search-bar {
    position: relative;
    z-index: 3;
    margin-top: -2rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  .mahasiswa-list {
    margin-top: 0;
    position: relative;
    z-index: 2;
  }
}
</style>
