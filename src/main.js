import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/index.css'
import { useAuth } from './composables/useAuth'

const app = createApp(App)
app.use(router)

// Initialize Supabase auth listener and state
const { initAuth } = useAuth()
initAuth()

// Mount immediately - the router and components will handle the reactive auth state
app.mount('#app')

