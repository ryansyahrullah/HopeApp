<template>
  <div class="dashboard">
    <!-- ==============================================
         DESKTOP HEADER
         ============================================== -->
    <div class="dashboard-header desktop-only">
      <div style="display:flex; align-items:center; gap:1.25rem;">
        <div class="header-avatar-circle">
           <img v-if="currentUser?.avatar_url" :src="currentUser.avatar_url" alt="Avatar" class="header-avatar-img" />
           <span v-else class="zh">{{ userInitial }}</span>
           <!-- Red Dot Badge -->
           <div v-if="dmUnreadCount > 0" class="red-dot-badge-float"></div>
        </div>
        <div>
          <h2 class="page-title">Selamat datang, <span class="text-accent">{{ firstName }}</span> 希</h2>
          <p class="page-subtitle">Ringkasan aktivitas kelas HopeApp - POLIBAN</p>
        </div>
      </div>




      
      <!-- Tombol Aksi Cepat (Admin Only) -->
      <div v-if="isAdmin" class="quick-actions">
        <BaseButton variant="primary" @click="$router.push('/meetings')" style="display: flex; align-items: center; gap: 0.5rem">
          <Plus :size="18" /> Tambah Pertemuan
        </BaseButton>
      </div>
      
      <!-- Tombol Download Cepat (Dosen Only) -->
      <div v-if="isDosen" class="quick-actions">
        <BaseButton variant="outline" @click="$router.push('/presensi')" style="display: flex; align-items: center; gap: 0.5rem">
          <ClipboardCheck :size="18" /> Tinjau Presensi
        </BaseButton>
      </div>
    </div>

    <!-- ==============================================
         MOBILE TOP WALLET HEADER
         ============================================== -->
    <div class="mobile-dashboard-header mobile-only">
       <div class="mobile-top-content" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <p style="opacity: 0.9; font-size: 0.9rem; margin-bottom: 0.2rem;">你好 (nǐ hǎo), {{ firstName }}! ✨</p>
            <h2 style="font-size: 1.3rem; font-weight: 700; color: white;">HopeApp POLIBAN</h2>
          </div>
       </div>
       <div class="mobile-bg-extender"></div>
    </div>





    <!-- ==============================================
         APP SHORTCUTS MENU (Selalu Muncul Instan)


         ============================================== -->
    <div class="app-shortcuts-section animate-fade-in" style="animation-delay: 0.05s">
        <h3 class="section-title">Akses Cepat</h3>
        <div class="app-shortcuts">
          <!-- Semua Role -->
          <router-link to="/meetings" class="shortcut-item">
            <div class="shortcut-icon bg-orange-soft"><CalendarDays :size="24" stroke-width="2.5" /></div>
            <span class="shortcut-label">Pertemuan</span>
          </router-link>

          <router-link to="/feedback" class="shortcut-item">
            <div class="shortcut-icon" style="background-color: #fce7f3; color: #db2777;"><MessageSquare :size="24" stroke-width="2.5" /></div>
            <span class="shortcut-label">Masukan</span>
          </router-link>

          <!-- Admin & Dosen -->
          <template v-if="isAdmin || isDosen">
            <router-link to="/mahasiswa" class="shortcut-item">
              <div class="shortcut-icon" style="background-color: #f3e8ff; color: #9333ea;"><GraduationCap :size="24" stroke-width="2.5" /></div>
              <span class="shortcut-label">Mahasiswa</span>
            </router-link>

            <router-link to="/presensi" class="shortcut-item">
              <div class="shortcut-icon bg-green-soft"><ClipboardCheck :size="24" stroke-width="2.5" /></div>
              <span class="shortcut-label">Presensi</span>
            </router-link>

            <router-link to="/resumes" class="shortcut-item">
              <div class="shortcut-icon bg-blue-soft"><BookOpen :size="24" stroke-width="2.5" /></div>
              <span class="shortcut-label">Rekap & Detail</span>
            </router-link>

            <router-link to="/summary" class="shortcut-item">
              <div class="shortcut-icon" style="background-color: #fef08a; color: #a16207;"><PieChart :size="22" stroke-width="2.5" /></div>
              <span class="shortcut-label">Ringkasan</span>
            </router-link>
            
            <!-- Admin Only: Pengguna (5th item wraps because grid repeat(4)) -->
            <router-link v-if="isAdmin" to="/users" class="shortcut-item">
              <div class="shortcut-icon bg-red-soft" style="background-color: #fee2e2; color: #dc2626;"><UsersRound :size="22" stroke-width="2.5" /></div>
              <span class="shortcut-label">Pengguna</span>
            </router-link>
          </template>

          <!-- Mahasiswa -->
          <template v-if="isMahasiswa">
            <router-link to="/my-resumes" class="shortcut-item">
              <div class="shortcut-icon bg-blue-soft"><BookOpen :size="24" stroke-width="2.5" /></div>
              <span class="shortcut-label">Resume</span>
            </router-link>

            <router-link to="/chat" class="shortcut-item">
              <div class="shortcut-icon-wrapper">
                <div class="shortcut-icon" style="background-color: #ecfdf5; color: #10b981;"><MessageCircle :size="24" stroke-width="2.5" /></div>
                <span v-if="totalUnread > 0" class="shortcut-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
              </div>

              <span class="shortcut-label">Obrolan</span>
            </router-link>
          </template>
        </div>
      </div>

      <!-- ==============================================
           SKELETON LOADING (Muncul saat data belum siap)
           ============================================== -->


      <template v-if="isLoading">
        <!-- Desktop Skeleton -->
        <div class="bento-grid desktop-only">
          <div class="bento-item bento-wide bento-card-glass" style="padding:1.5rem;">
            <SkeletonLoader width="40%" height="1.2rem" />
            <SkeletonLoader width="90%" height="0.9rem" style="margin-top:0.75rem;" />
            <SkeletonLoader width="70%" height="0.9rem" style="margin-top:0.5rem;" />
          </div>
          <div class="bento-item bento-card-glass" style="padding:1.5rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.75rem;">
            <SkeletonLoader width="54px" height="54px" radius="999px" />
            <SkeletonLoader width="60%" height="2rem" />
            <SkeletonLoader width="80%" height="0.8rem" />
          </div>
          <div class="bento-item bento-card-glass" style="padding:1.5rem; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.75rem;">
            <SkeletonLoader width="54px" height="54px" radius="999px" />
            <SkeletonLoader width="50%" height="2rem" />
            <SkeletonLoader width="70%" height="0.8rem" />
          </div>
          <div class="bento-item bento-wide bento-card-glass" style="padding:1.5rem;">
            <SkeletonLoader width="30%" height="0.8rem" />
            <SkeletonLoader width="50%" height="2.2rem" style="margin-top:0.5rem;" />
          </div>
        </div>

        <!-- Mobile Skeleton -->
        <div class="mobile-stats mobile-only">
          <SkeletonLoader width="40%" height="1rem" style="margin-bottom:1rem;" />
          <div class="horizontal-scroll-container hide-scrollbar">
            <div class="mobile-stat-card" style="background: linear-gradient(135deg, #e8e2d8, #f0ece4); border: none;">
              <SkeletonLoader width="60%" height="0.8rem" style="margin-bottom:0.75rem; background: rgba(255,255,255,0.3);" />
              <SkeletonLoader width="40%" height="1.8rem" style="background: rgba(255,255,255,0.4);" />
            </div>
            <div class="mobile-stat-card b-outline">
              <SkeletonLoader width="50%" height="0.8rem" style="margin-bottom:0.75rem;" />
              <SkeletonLoader width="60%" height="1.5rem" />
            </div>
            <div class="mobile-stat-card b-outline">
              <SkeletonLoader width="50%" height="0.8rem" style="margin-bottom:0.75rem;" />
              <SkeletonLoader width="60%" height="1.5rem" />
            </div>
          </div>
          <div class="mobile-banner mt-2">
            <SkeletonLoader width="70%" height="0.9rem" />
          </div>
        </div>
      </template>

      <!-- ==============================================
           BENTO DASHBOARD ADMIN & DOSEN (Desktop)
           ============================================== -->
      <template v-else>
      <div v-if="isAdmin || isDosen" class="bento-grid desktop-only animate-fade-in">
        
        <!-- Tile 1: Status Aplikasi (Wide) -->
        <div class="bento-item bento-wide bento-card-glass">
          <div class="bento-content">
            <h3 class="bento-title">Status Data Aplikasi</h3>
            <p style="color:var(--c-text-muted); line-height:1.6;">
              Sistem saat ini telah beroperasi secara penuh. Semua aktivitas, presensi, dan rekapitulasi data sudah terhubung langsung ke server. <Rocket style="display: inline; vertical-align: text-bottom;" :size="18" />
            </p>
          </div>
          <div class="bento-decoration decoration-blue">
             <Sparkles :size="80" />
          </div>
        </div>

        <!-- Tile 2: Rata-Rata Kehadiran (Square) -->
        <div class="bento-item bento-card-glass">
          <div class="bento-content flex-center-col">
            <div class="stat-icon stat-icon--gold mb-1"><CheckCircle :size="28" /></div>
            <p class="bento-stat-value">{{ adminStats.avgAttendance }}<span>%</span></p>
            <h3 class="bento-stat-label">Rata Keseluruhan Hadir</h3>
          </div>
        </div>

        <!-- Tile 3: Mahasiswa Aktif (Square) -->
        <div class="bento-item bento-card-glass">
          <div class="bento-content flex-center-col">
             <div class="stat-icon stat-icon--red mb-1"><Users :size="28" /></div>
             <p class="bento-stat-value">{{ adminStats.totalStudents }} <span>Org</span></p>
             <h3 class="bento-stat-label">Mahasiswa Terdaftar</h3>
          </div>
        </div>

        <!-- Tile 4: Total Pertemuan (Wide) -->
        <div class="bento-item bento-wide bento-card-glass" style="display:flex; flex-direction:row; align-items:center;">
          <div class="bento-content" style="flex:1;">
            <h3 class="bento-stat-label">Kurikulum Terjadwal</h3>
            <p class="bento-stat-value" style="font-size:2.5rem;">{{ adminStats.totalMeetings }} <span>Sesi Pertemuan</span></p>
          </div>
          <div class="stat-icon stat-icon--blue" style="width:80px; height:80px; font-size:2.5rem; margin-right:1.5rem;">
             <CalendarDays :size="40" />
          </div>
        </div>

      </div>

      <!-- ==============================================
           MOBILE STATS: ADMIN & DOSEN
           ============================================== -->
      <div v-if="isAdmin || isDosen" class="mobile-stats mobile-only animate-fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
           <h3 class="section-title" style="margin-bottom:0;">Performa Kelas</h3>
        </div>
        
        <div class="horizontal-scroll-container hide-scrollbar">
           <!-- Card 1 -->
           <div class="mobile-stat-card" style="background: linear-gradient(135deg, var(--c-danger), var(--c-primary)); border: none;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                 <span style="font-size:0.8rem; color: #FEF08A; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Rata-Rata Kehadiran</span>
                 <div style="display:flex; align-items:center; gap: 0.25rem;">
                   <span class="zh" style="font-size: 1.25rem; color: rgba(254, 240, 138, 0.8);">出勤</span>
                   <CheckCircle :size="18" color="#FEF08A" />
                 </div>
              </div>
              <h3 style="font-size:1.8rem; color: #FFD700; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">{{ adminStats.avgAttendance }}%</h3>
           </div>
           
           <!-- Card 2 -->
           <div class="mobile-stat-card b-outline">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                 <span class="text-muted" style="font-size:0.8rem;">Jml Mahasiswa</span>
                 <Users :size="18" color="var(--c-danger)" />
              </div>
              <h3 class="text-accent" style="font-size:1.6rem;">{{ adminStats.totalStudents }} <small>Orang</small></h3>
           </div>

           <!-- Card 3 -->
           <div class="mobile-stat-card b-outline">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                 <span class="text-muted" style="font-size:0.8rem;">Sesi Terjadwal</span>
                 <CalendarDays :size="18" color="var(--c-primary)" />
              </div>
              <h3 class="text-primary" style="font-size:1.6rem;">{{ adminStats.totalMeetings }} <small>Sesi</small></h3>
           </div>
        </div>
        
        <!-- Warning Status Data (Versi Mobile Kecil) -->
        <div class="mobile-banner mt-2" style="background-color: var(--c-info-bg);">
           <div style="display:flex; flex-direction:column; gap:0.25rem; flex:1;">
              <strong>Sistem Berjalan</strong>
              <span class="text-muted" style="font-size:0.8rem;">Semua modul sinkron & siap.</span>
           </div>
           <Rocket :size="24" color="var(--c-info)" />
        </div>
      </div>

      <!-- ==============================================
           BENTO DASHBOARD MAHASISWA (Desktop)
           ============================================== -->
      <div v-if="isMahasiswa" class="bento-grid desktop-only animate-fade-in">
        
        <!-- Tile 1: Aktivitas Terkini (Wide & Dominant) -->
        <div class="bento-item bento-wide bento-tall bento-card-glass">
          <div class="bento-content flex-col" style="height:100%; justify-content:space-between;">
             <div>
               <h3 class="bento-title mb-1">Aktivitas Terkini</h3>
               <EmptyState 
                 title="Tracking Materi Lanjut" 
                 description="Pantau sesi materi terbaru yang telah dipublish dan pastikan resumemu terkumpul tepat waktu."
                 style="padding:1rem 0;"
               >
                 <template #icon><BookOpen :size="48" style="color:var(--c-text-muted);" /></template>
                 <template #action>
                   <BaseButton variant="primary" @click="$router.push('/meetings')">Buka Materi Sesi Ini</BaseButton>
                 </template>
               </EmptyState>
             </div>
          </div>
        </div>

        <!-- Tile 2: Target Kehadiranku (Square) -->
        <div class="bento-item bento-card-glass">
          <div class="bento-content flex-center-col">
            <div class="stat-icon stat-icon--blue mb-1" style="width:60px; height:60px;"><Trophy :size="30" /></div>
            <p class="bento-stat-value">{{ mhsStats.attendancePercent }}<span>%</span></p>
            <h3 class="bento-stat-label">Tingkat Kehadiran</h3>
            <span style="font-size: 0.8rem; color: var(--c-primary); margin-top:0.25rem; font-weight:600;">Hadir {{ mhsStats.totalHadir }} Sesi</span>
          </div>
        </div>

        <!-- Tile 3: Warning Resume (Square) -->
        <div class="bento-item bento-card-glass" style="border-top:4px solid var(--c-warning);">
          <div class="bento-content flex-center-col">
            <div class="stat-icon stat-icon--gold mb-1" style="width:60px; height:60px;"><BookX :size="30" /></div>
            <p class="bento-stat-value">{{ mhsStats.missingResumes }} <span>Buku</span></p>
            <h3 class="bento-stat-label">Resume Tertunda</h3>
          </div>
        </div>
      </div>

      <!-- ==============================================
           MOBILE STATS: MAHASISWA
           ============================================== -->
      <div v-if="isMahasiswa" class="mobile-stats mobile-only animate-fade-in">
        <h3 class="section-title" style="margin-bottom:1rem;">Overview Belajar</h3>
        <div class="horizontal-scroll-container hide-scrollbar">
           <!-- Card 1 -->
           <div class="mobile-stat-card" style="background: linear-gradient(135deg, var(--c-danger), var(--c-primary)); border: none;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                 <span style="font-size:0.8rem; color: #FEF08A; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Tingkat Kehadiran</span>
                 <div style="display:flex; align-items:center; gap: 0.25rem;">
                   <span class="zh" style="font-size: 1.25rem; color: rgba(254, 240, 138, 0.8);">出勤</span>
                   <Trophy :size="18" color="#FEF08A" />
                 </div>
              </div>
              <h3 style="font-size:1.8rem; color: #FFD700; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">{{ mhsStats.attendancePercent }}%</h3>
              <p style="font-size:0.75rem; color: #FEF08A; opacity: 0.9; margin-top:0.25rem;">Hadir {{ mhsStats.totalHadir }} Sesi</p>
           </div>
           
           <!-- Card 2 -->
           <div class="mobile-stat-card b-outline" style="border-left: 3px solid var(--c-warning);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                 <span class="text-muted" style="font-size:0.8rem;">Resume Tertunda</span>
                 <BookX :size="18" color="var(--c-warning)" />
              </div>
              <h3 style="font-size:1.6rem; color:var(--c-warning);">{{ mhsStats.missingResumes }} <small>Sesi</small></h3>
           </div>
        </div>
        
        <!-- Activity Hint Mobile -->
        <div class="mobile-banner mt-2" @click="$router.push('/meetings')" style="cursor: pointer;">
           <div style="display:flex; flex-direction:column; gap:0.25rem; flex:1;">
              <strong>Tracking Materi Lanjut</strong>
              <span class="text-muted" style="font-size:0.8rem;">Cek materi terbaru & kirim resume tepat waktu. Klik di sini!</span>
           </div>
           <BookOpen :size="24" color="var(--c-primary)" />
        </div>
      </div>
      </template>

      <!-- Notif Bantuan Loading -->
      <AppToast message="loading terus/stuck(all page), refresh aja" variant="warning" :duration="8000" />
  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { 
  CalendarDays, BookOpen, GraduationCap, ClipboardCheck, 
  PieChart, UsersRound, MessageSquare, Plus, MessageCircle, CheckCircle, Users, Sparkles, Trophy, BookX, Rocket
} from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useChatBadge } from '@/composables/useChatBadge'
import { useDMBadge } from '@/composables/useDMBadge'
import { dashboardService } from '@/services/dashboardService'
import BaseButton from '@/components/common/BaseButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppToast from '@/components/common/AppToast.vue'
import SkeletonLoader from '@/components/common/SkeletonLoader.vue'



const { roleName, isAdmin, isDosen, isMahasiswa, currentUser } = useAuth()
const { unreadCount: groupUnreadCount } = useChatBadge()
const { dmUnreadCount } = useDMBadge()

const totalUnread = computed(() => (groupUnreadCount.value || 0) + (dmUnreadCount.value || 0))


const firstName = computed(() => {
  if (!currentUser.value?.full_name) return 'Pengguna'
  return currentUser.value.full_name.split(' ')[0]
})

const userInitial = computed(() => {
  return (currentUser.value?.full_name || '?').charAt(0).toUpperCase()
})




const isLoading = ref(true)
const adminStats = ref({ avgAttendance: 0, totalStudents: 0, totalMeetings: 0 })
const mhsStats = ref({ attendancePercent: 0, totalHadir: 0, missingResumes: 0 })

const fetchDashboardData = async () => {
  isLoading.value = true
  try {
    if (isAdmin.value || isDosen.value) {
      adminStats.value = await dashboardService.getAdminStats()
    } else if (isMahasiswa.value) {
      const currentId = currentUser.value?.id
      if (currentId) {
        mhsStats.value = await dashboardService.getMahasiswaStats(currentId)
      }
    }
  } catch (error) {
    console.error("Gagal memuat dashboard", error)
    alert('Gagal memuat ringkasan dashboard: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

watch(roleName, () => {
  fetchDashboardData()
})

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.desktop-only { display: flex; }
.mobile-only { display: none; }

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: var(--c-text-muted);
}

.header-avatar-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-danger));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  overflow: visible; /* Penting untuk tombol melayang */
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.2);
  cursor: pointer;
  position: relative;
}

.red-dot-badge-float {
  position: absolute;
  top: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background-color: var(--c-danger);
  border-radius: 50%;
  border: 2px solid var(--c-surface);
  z-index: 5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}


.mobile-avatar-circle {

  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: bold;
  overflow: visible;
  position: relative;
  cursor: pointer;
}

.header-avatar-img {

  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}



/* =========================================
   APP SHORTCUTS (WALLET STYLE)
   ========================================= */
.app-shortcuts-section {
  margin-bottom: 2.5rem;
  background-color: var(--c-surface);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--c-text-main);
  margin-bottom: 1.25rem;
}

.app-shortcuts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem 0.5rem;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  text-decoration: none;
  background: transparent;
  border: none;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.shortcut-item:hover {
  transform: translateY(-2px);
}

.shortcut-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px; /* Smooth rounded corners like a modern app icon */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.shortcut-icon svg {
  width: 22px;
  height: 22px;
}

.shortcut-item:hover .shortcut-icon {
  opacity: 0.85;
}

.shortcut-icon-wrapper {
  position: relative;
  display: inline-flex;
}

.shortcut-badge {
  position: absolute;
  top: -5px;
  right: -7px;
  background-color: var(--c-danger);
  color: #fbbf24;
  font-size: 0.6rem;
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
  z-index: 3;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4);
}

/* Hardcoded beautiful soft colors for icons */
.bg-orange-soft { background-color: #fff7ed; color: #f97316; }
.bg-green-soft { background-color: #f0fdf4; color: #22c55e; }
.bg-blue-soft { background-color: #eff6ff; color: #3b82f6; }

.shortcut-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  color: var(--c-text-main);
  line-height: 1.2;
}

/* =========================================
   MOBILE NATIVE WALLET CLASSES
   ========================================= */
.mobile-dashboard-header {
  margin: -1rem -1rem 1rem -1rem; /* Negate the 1rem padding of main-content to touch borders */
  padding: 1.5rem 1.5rem 3.5rem 1.5rem; /* Large bottom padding for overlap */
  background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%); /* Elegant modern red gradient matching HopeApp brand */
  color: white;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  position: relative;
  z-index: 1;
}

.mobile-stats {
  margin-bottom: 2rem;
}

.horizontal-scroll-container {
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.mobile-stat-card {
  flex: 0 0 calc(75% - 1rem); /* 75% width of screen makes the next item peek out! */
  background: var(--c-surface);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  scroll-snap-align: start;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.mobile-stat-card small {
  font-size: 0.8rem;
  color: var(--c-text-muted);
  font-weight: 500;
}

.bg-primary-gradient {
  background: linear-gradient(135deg, var(--c-primary), var(--c-danger));
}

.bg-info-gradient {
  background: linear-gradient(135deg, #0284c7, #38bdf8);
}

.b-outline {
  border: 1px solid var(--c-border);
}

.mobile-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.mt-2 { margin-top: 2rem; }

/* =========================================
   BENTO GRID SYSTEM 
   ========================================= */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(160px, auto);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.bento-item {
  position: relative;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
}

.bento-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* Modifiers */
.bento-tall { grid-row: span 2; }
.bento-wide { grid-column: span 2; }
.bento-full { grid-column: 1 / -1; }

/* Bento Styling Glass/Premium */
.bento-card-glass {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.025);
  background: linear-gradient(135deg, var(--c-surface) 0%, var(--c-bg) 100%);
}

.bento-content {
  padding: 1.5rem;
  z-index: 2;
  position: relative;
}

.bento-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text-main);
}

.bento-decoration {
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 6rem;
  opacity: 0.1;
  transform: rotate(15deg);
  z-index: 1;
}

.bento-stat-value {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--c-text-main);
  line-height: 1.2;
}

.bento-stat-value span {
  font-size: 1rem;
  font-weight: 600;
  color: var(--c-text-muted);
  margin-left: 0.25rem;
}

.bento-stat-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Utilities */
.flex-center-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.mb-1 { margin-bottom: 1rem; }

/* Stat Icons */
.stat-icon {
  width: 54px;
  height: 54px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  background-color: var(--c-bg);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.stat-icon--blue { background-color: var(--c-info-bg); color: var(--c-info); }
.stat-icon--red { background-color: var(--c-danger-bg); color: var(--c-danger); }
.stat-icon--gold { background-color: var(--c-warning-bg); color: #d97706; } /* Ambil warna emas tua ala oriental */

/* Responsif Mobile Tablet */
@media (max-width: 900px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .bento-wide { grid-column: span 2; }
}

@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: block !important; }
  
  /* Overlap trick for Shortcuts! */
  .app-shortcuts-section {
    margin-top: -3.5rem; /* Tumpuk ke atas menutupi Header Wallet! */
    position: relative;
    z-index: 2;
    margin-right: 0;
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
  .bento-tall, .bento-wide {
    grid-column: span 1;
    grid-row: span 1;
  }
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }
  .app-shortcuts {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem 0;
  }
  .shortcut-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }
  .shortcut-icon svg {
    width: 20px;
    height: 20px;
  }
  .shortcut-label {
    font-size: 0.65rem;
  }
}
</style>
