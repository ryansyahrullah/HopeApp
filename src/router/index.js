import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard: redirect to /login if not authenticated
router.beforeEach(async (to, from, next) => {
  // Allow login page without auth
  if (to.meta.requiresAuth === false) {
    // If already logged in, redirect to dashboard
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      return next('/')
    }
    return next()
  }

  // All other pages require auth
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return next('/login')
  }

  // Cek profile dari database
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_registered, roles')
    .eq('id', session.user.id)
    .single()

  if (profile) {
    // Jika user adalah murni mahasiswa/baru dan is_registered belum true
    const isOnlyMahasiswa = profile.roles?.includes('mahasiswa') && 
                            !profile.roles?.includes('admin') && 
                            !profile.roles?.includes('dosen');
    
    if (isOnlyMahasiswa && profile.is_registered === false) {
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
})

export default router
