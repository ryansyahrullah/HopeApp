import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

// Shared reactive state (singleton pattern)
const session = ref(null)
const profile = ref(null)
const isAuthReady = ref(false)
const isLoadingProfile = ref(false)

// Fetch profile from Supabase
async function fetchProfile(userId) {
  if (!userId) {
    profile.value = null
    return
  }

  isLoadingProfile.value = true
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[useAuth] Gagal fetch profile:', error.message)
      profile.value = null
    } else {
      profile.value = data
      
      // Validasi apakah role aktif yang tersimpan masih valid untuk user ini
      if (activeRole.value && !data.roles?.includes(activeRole.value)) {
        activeRole.value = null
        localStorage.removeItem('hopeapp_active_role')
      }
    }
  } catch (e) {
    console.error('[useAuth] Exception:', e)
    profile.value = null
  } finally {
    isLoadingProfile.value = false
  }
}

// Initialize auth listener (call once in App.vue)
async function initAuth() {
  // Get initial session
  const { data: { session: initialSession } } = await supabase.auth.getSession()
  session.value = initialSession

  if (initialSession?.user) {
    await fetchProfile(initialSession.user.id)
  }

  isAuthReady.value = true

  // Listen for auth changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange(async (event, newSession) => {
    session.value = newSession

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      await fetchProfile(newSession?.user?.id)
    } else if (event === 'SIGNED_OUT') {
      profile.value = null
    }
  })
}

// Auth actions
async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

async function signUpWithEmail(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })
  if (error) throw error
  return data
}

async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) throw error
  return data
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  session.value = null
  profile.value = null
  activeRole.value = null
  localStorage.removeItem('hopeapp_active_role')
}

async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  if (error) throw error
  return data
}

async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
  return data
}

async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail
  })
  if (error) throw error
  return data
}

// Refresh profile data from DB (e.g. after editing profile)
async function refreshProfile() {
  if (session.value?.user?.id) {
    await fetchProfile(session.value.user.id)
  }
}

// Registration toggle check
async function isRegistrationOpen() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'is_registration_open')
    .single()

  if (error || !data) return true // default open if no setting
  return data.value === 'true'
}

// Active role for session switching
const activeRole = ref(localStorage.getItem('hopeapp_active_role') || null)

// Composable export
export function useAuth() {
  const roleName = computed(() => {
    if (activeRole.value) return activeRole.value
    if (!profile.value?.roles) return ''
    if (profile.value.roles.includes('admin')) return 'admin'
    if (profile.value.roles.includes('dosen')) return 'dosen'
    if (profile.value.roles.includes('mahasiswa')) return 'mahasiswa'
    return ''
  })

  // Computed role guards (based on active role)
  const isAdmin = computed(() => roleName.value === 'admin')
  const isDosen = computed(() => roleName.value === 'dosen')
  const isMahasiswa = computed(() => roleName.value === 'mahasiswa')

  const currentUser = computed(() => profile.value)
  const isLoggedIn = computed(() => !!session.value)

  const roleLabel = computed(() => {
    if (!profile.value?.roles) return ''
    return profile.value.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')
  })

  function setRole(role) {
    if (profile.value?.roles?.includes(role)) {
      activeRole.value = role
      localStorage.setItem('hopeapp_active_role', role)
    }
  }

  return {
    // State
    session,
    profile,
    isAuthReady,
    isLoadingProfile,
    currentUser,
    isLoggedIn,

    // Role guards
    isAdmin,
    isDosen,
    isMahasiswa,
    roleName,
    roleLabel,
    setRole,

    // Auth actions
    initAuth,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateEmail,
    refreshProfile,
    isRegistrationOpen
  }
}
