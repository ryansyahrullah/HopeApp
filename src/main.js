import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/index.css'
import { useAuth } from './composables/useAuth'

const app = createApp(App)
app.use(router)

// Initialize Supabase auth listener before mounting
const { initAuth } = useAuth()
initAuth().then(() => {
  app.mount('#app')
})
