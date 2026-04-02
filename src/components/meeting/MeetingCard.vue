<template>
  <BaseCard 
    class="meeting-card" 
    hoverEffect 
    @click="$emit('open', meeting.id)"
  >
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="meeting-number">Sesi {{ meeting.meeting_number }}</span>
        <StatusBadge :type="dateStatus.type">{{ dateStatus.label }}</StatusBadge>
      </div>
      <div v-if="isAdmin" class="admin-quick-actions" @click.stop>
        <button class="icon-btn edit-btn" @click.stop="$emit('edit', meeting)" title="Edit">
          <Edit :size="16" />
        </button>
        <button class="icon-btn delete-btn" @click.stop="$emit('delete', meeting)" title="Hapus">
          <Trash2 :size="16" />
        </button>
      </div>
    </div>
    
    <h3 class="meeting-title">{{ meeting.title }}</h3>
    <p class="meeting-topic">{{ meeting.topic }}</p>
    
    <template #footer>
      <div class="card-footer flex-between">
        <span class="meeting-date" style="display: flex; align-items: center; gap: 0.4rem;">
          <Calendar :size="16" /> {{ formattedDate }}
        </span>
        <span class="arrow-hint">→</span>
      </div>
    </template>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import { Calendar, Edit, Trash2 } from 'lucide-vue-next'
import BaseCard from '@/components/common/BaseCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAuth } from '@/composables/useAuth'

const { isAdmin } = useAuth()

const props = defineProps({
  meeting: {
    type: Object,
    required: true
  }
})

defineEmits(['open', 'edit', 'delete'])

const formattedDate = computed(() => {
  if (!props.meeting.meeting_date) return '-'
  return new Date(props.meeting.meeting_date).toLocaleDateString('id-ID', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
})

const dateStatus = computed(() => {
  const meetingDate = new Date(props.meeting.meeting_date)
  const today = new Date()
  
  if (meetingDate < today) return { label: 'Selesai', type: 'success' }
  if (meetingDate.toDateString() === today.toDateString()) return { label: 'Hari Ini', type: 'warning' }
  return { label: 'Akan Datang', type: 'info' }
})
</script>

<style scoped>
.meeting-card {
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.admin-quick-actions {
  display: flex;
  gap: 0.25rem;
}

.icon-btn {
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--c-text-muted);
}

.edit-btn:hover {
  background-color: var(--c-surface);
  color: var(--c-primary);
}

.delete-btn:hover {
  background-color: var(--c-danger-bg);
  color: var(--c-danger);
}

.meeting-number {
  font-weight: 700;
  color: var(--c-primary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.meeting-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-text-main);
  margin-bottom: 0.5rem;
}

.meeting-topic {
  font-size: 0.95rem;
  color: var(--c-text-muted);
  flex-grow: 1;
}

.card-footer {
  font-size: 0.85rem;
  color: var(--c-text-muted);
}

.arrow-hint {
  color: var(--c-primary);
  font-weight: bold;
  opacity: 0.5;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.meeting-card:hover .arrow-hint {
  opacity: 1;
  transform: translateX(4px);
}
</style>
