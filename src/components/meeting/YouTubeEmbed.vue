<template>
  <div class="youtube-embed">
    <template v-if="embedUrl">
      <iframe 
        :src="embedUrl" 
        title="YouTube video player" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen
        class="iframe-video"
      ></iframe>
    </template>
    <div v-else class="youtube-fallback">
      <span class="icon" style="display: flex; justify-content: center;"><VideoOff :size="32" stroke-width="1.5" /></span>
      <p>Video belum tersedia untuk pertemuan ini.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { VideoOff } from 'lucide-vue-next'

const props = defineProps({
  url: {
    type: String,
    default: ''
  }
})

// Konversi URL biasa (youtube.com/watch?v=...) jadi format embed (youtube.com/embed/...)
const embedUrl = computed(() => {
  if (!props.url) return null
  try {
    const urlObj = new URL(props.url)
    let videoId = ''
    
    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v')
    } else if (urlObj.hostname.includes('youtu.be')) {
      videoId = urlObj.pathname.substring(1)
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
  } catch (e) {
    // URL tidak valid, kita pake URL dummy untuk tes jika itu "dummy1" atau "dummy2"
    if(props.url.includes('dummy')) {
       return `https://www.youtube.com/embed/dQw4w9WgXcQ` // Rickroll (placeholder aman :D)
    }
    return null
  }
  return null
})
</script>

<style scoped>
.youtube-embed {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: var(--c-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--c-border);
}

.iframe-video {
  width: 100%;
  height: 100%;
}

.youtube-fallback {
  text-align: center;
  color: var(--c-text-muted);
}

.youtube-fallback .icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}
</style>
