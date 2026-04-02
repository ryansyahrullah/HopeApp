<template>
  <BaseModal :isOpen="!!student" title="Hubungi Mahasiswa" @close="closeModal">
    <div v-if="student" class="contact-content">
      <div class="user-info">
        <div class="avatar">{{ userInitial }}</div>
        <div class="details">
          <h4>{{ student.full_name }}</h4>
          <p>{{ student.nim }}</p>
        </div>
      </div>
      
      <p class="mt-2 text-muted" style="text-align: center; font-size: 0.9rem;">
        Pilih opsi untuk berinteraksi dengan mahasiswa yang bersangkutan.
      </p>

      <div class="contact-actions">
        <BaseButton variant="outline" style="width: 100%; margin-bottom: 0.75rem; padding: 0.6rem;" @click="openProfile">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
            <UserIcon size="18" />
            <span style="font-weight: 600;">Lihat Profil</span>
          </div>
        </BaseButton>

        <BaseButton variant="primary" style="background-color: #25D366; border-color: #25D366; width: 100%; padding: 0.6rem;" @click="openWhatsApp">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            <span style="font-weight: 600;">Chat WhatsApp</span>
          </div>
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { User as UserIcon } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const router = useRouter()

const props = defineProps({
  student: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const closeModal = () => emit('close')

const userInitial = computed(() => {
  return props.student?.full_name?.charAt(0).toUpperCase() || '?'
})

const openProfile = () => {
  if (!props.student?.id) return
  router.push(`/mahasiswa/${props.student.id}`)
  closeModal()
}

const openWhatsApp = () => {
  if (!props.student || !props.student.phone) {
    alert('Nomor HP tidak ditemukan untuk mahasiswa ini.')
    return
  }
  
  // Bersihkan format nomor, ganti 0 di depan dengan 62
  let phoneStr = props.student.phone.replace(/\D/g, '')
  if (phoneStr.startsWith('0')) {
    phoneStr = '62' + phoneStr.substring(1)
  }
  
  const text = `Halo ${props.student.full_name}, ini pesan dari instruktur kelas HopeApp POLIBAN mengenai progres evaluasi kamu. `
  const waUrl = `https://api.whatsapp.com/send?phone=${phoneStr}&text=${encodeURIComponent(text)}`
  
  window.open(waUrl, '_blank')
  closeModal()
}
</script>

<style scoped>
.contact-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--c-bg);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--c-border);
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}
.details h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--c-text-main);
}
.details p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--c-text-muted);
}
.mt-2 { margin-top: 1rem; }
.text-muted { color: var(--c-text-muted); }
.contact-actions {
  margin-top: 0.5rem;
}
</style>
