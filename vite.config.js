import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo-192x192.png', 'logo-512x512.png'],
      manifest: {
        name: 'HopeApp POLIBAN',
        short_name: 'HopeApp',
        description: 'Portal Koordinasi Kelas Bahasa Mandarin Program HOPE.',
        theme_color: '#c62828',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Pemisahan file (Chunk Splitting) untuk performa dan caching optimal
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-tiptap': ['@tiptap/vue-3', '@tiptap/starter-kit', '@tiptap/extension-placeholder']
        }
      }
    }
  }
})
