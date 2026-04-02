import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue')
  },
  {
    path: '/meetings',
    name: 'Meetings',
    component: () => import('../views/MeetingsView.vue')
  },
  {
    path: '/meetings/:id',
    name: 'MeetingDetail',
    component: () => import('../views/MeetingDetailView.vue')
  },
  {
    path: '/presensi',
    name: 'Presensi',
    component: () => import('../views/PresensiView.vue')
  },
  {
    path: '/my-resumes',
    name: 'MyResumes',
    component: () => import('../views/MyResumesView.vue')
  },
  {
    path: '/resumes',
    name: 'Resumes',
    component: () => import('../views/ResumesView.vue')
  },
  {
    path: '/summary',
    name: 'Summary',
    component: () => import('../views/SummaryView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue')
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/UsersView.vue')
  },
  {
    path: '/mahasiswa',
    name: 'Mahasiswa',
    component: () => import('../views/MahasiswaView.vue')
  },
  {
    path: '/mahasiswa/:id',
    name: 'MahasiswaDetail',
    component: () => import('../views/MahasiswaDetailView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: '/complete-profile',
    name: 'CompleteProfile',
    component: () => import('../views/CompleteProfileView.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard: redirect to /login if not authenticated
router.beforeEach(async (to, from, next) => {
  try {
    // Allow login page without auth (redirect to home if already logged in)
    if (to.meta.requiresAuth === false) {
      // Only redirect away from login page if session exists
      // /reset-password must stay accessible even with recovery session
      if (to.path === '/login') {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) return next('/')
      }
      return next()
    }

    // All other pages require auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return next('/login')
    }

    // Optimasi: Hindari pengecekan database yang lambat di setiap klik menu!
    // Kita cek apakah auth state lokal (memory) sudah merekam profile
    const { profile } = useAuth()
    let currentProfile = profile.value

    // Jika memory kosong (misal: user baru refresh browser), barulah panggil Database
    if (!currentProfile) {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_registered, roles')
        .eq('id', session.user.id)
        .single()

      if (error) {
         console.warn("Navigation guard fetching profile error:", error)
         return next()
      }
      currentProfile = data
    }

    if (currentProfile) {
      // Jika user adalah murni mahasiswa/baru dan is_registered belum true
      const isOnlyMahasiswa = currentProfile.roles?.includes('mahasiswa') && 
                              !currentProfile.roles?.includes('admin') && 
                              !currentProfile.roles?.includes('dosen');
      
      if (isOnlyMahasiswa && currentProfile.is_registered === false) {
        if (to.path !== '/complete-profile') {
          return next('/complete-profile')
        }
      } else {
        // Jika sudah terdaftar (atau admin) dan malah membuka /complete-profile
        if (to.path === '/complete-profile') {
          return next('/')
        }
      }
    }

    next()
  } catch (err) {
    console.error("Fatal error in navigation guard:", err)
    // Anti-stuck: Wajib jalankan next apa pun yang terjadi!
    next()
  }
})

export default router
