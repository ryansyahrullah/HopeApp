<template>
  <!-- VARIANT: LIST (Mahasiswa, Users) -->
  <div v-if="variant === 'list'" class="skeleton-list">
    <div v-for="i in count" :key="i" class="skeleton-list-item">
      <SkeletonLoader width="48px" height="48px" radius="999px" />
      <div style="flex:1; display:flex; flex-direction:column; gap:0.4rem;">
        <SkeletonLoader :width="randomWidth(60, 85)" height="0.95rem" />
        <SkeletonLoader :width="randomWidth(30, 50)" height="0.7rem" />
      </div>
      <SkeletonLoader width="20px" height="20px" radius="4px" />
    </div>
  </div>

  <!-- VARIANT: CARDS (Meetings grid) -->
  <div v-else-if="variant === 'cards'" class="skeleton-cards">
    <div v-for="i in count" :key="i" class="skeleton-card">
      <SkeletonLoader width="50px" height="50px" radius="12px" />
      <SkeletonLoader :width="randomWidth(60, 80)" height="1.1rem" style="margin-top:1rem;" />
      <SkeletonLoader :width="randomWidth(40, 60)" height="0.8rem" style="margin-top:0.5rem;" />
      <SkeletonLoader width="100%" height="0.75rem" style="margin-top:1rem;" />
      <SkeletonLoader :width="randomWidth(50, 70)" height="0.75rem" style="margin-top:0.35rem;" />
    </div>
  </div>

  <!-- VARIANT: MOBILE-LIST (Chat-like items) -->
  <div v-else-if="variant === 'mobile-list'" class="skeleton-mobile-list">
    <div v-for="i in count" :key="i" class="skeleton-mobile-item">
      <SkeletonLoader width="48px" height="48px" radius="999px" />
      <div style="flex:1; display:flex; flex-direction:column; gap:0.35rem;">
        <SkeletonLoader :width="randomWidth(55, 80)" height="0.95rem" />
        <SkeletonLoader :width="randomWidth(25, 40)" height="0.65rem" />
      </div>
    </div>
  </div>

  <!-- VARIANT: TABLE (Presensi, Resume, Summary) -->
  <div v-else-if="variant === 'table'" class="skeleton-table">
    <div class="skeleton-table-header">
      <SkeletonLoader v-for="i in 6" :key="i" :width="i === 1 ? '120px' : '60px'" height="0.8rem" />
    </div>
    <div v-for="row in count" :key="row" class="skeleton-table-row">
      <SkeletonLoader width="120px" height="0.85rem" />
      <SkeletonLoader v-for="i in 5" :key="i" width="30px" height="0.85rem" radius="4px" />
    </div>
  </div>

  <!-- VARIANT: DETAIL (MeetingDetail, MahasiswaDetail) -->
  <div v-else-if="variant === 'detail'" class="skeleton-detail">
    <SkeletonLoader width="100%" height="180px" radius="16px" />
    <div style="margin-top:1.5rem; display:flex; flex-direction:column; gap:0.75rem;">
      <SkeletonLoader width="60%" height="1.5rem" />
      <SkeletonLoader width="40%" height="0.9rem" />
      <SkeletonLoader width="100%" height="0.85rem" style="margin-top:0.5rem;" />
      <SkeletonLoader width="90%" height="0.85rem" />
      <SkeletonLoader width="75%" height="0.85rem" />
    </div>
    <div style="margin-top:2rem; display:flex; gap:1rem;">
      <SkeletonLoader width="120px" height="40px" radius="12px" />
      <SkeletonLoader width="120px" height="40px" radius="12px" />
    </div>
  </div>

  <!-- VARIANT: PROFILE -->
  <div v-else-if="variant === 'profile'" class="skeleton-profile">
    <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; margin-bottom:2rem;">
      <SkeletonLoader width="80px" height="80px" radius="999px" />
      <SkeletonLoader width="50%" height="1.2rem" />
      <SkeletonLoader width="30%" height="0.8rem" />
    </div>
    <div v-for="i in 4" :key="i" style="display:flex; justify-content:space-between; padding:0.75rem 0; border-bottom: 1px solid var(--c-border);">
      <SkeletonLoader width="30%" height="0.85rem" />
      <SkeletonLoader width="40%" height="0.85rem" />
    </div>
  </div>
</template>

<script setup>
import SkeletonLoader from './SkeletonLoader.vue'

defineProps({
  variant: {
    type: String,
    default: 'list', // list, cards, mobile-list, table, detail, profile
    validator: (v) => ['list', 'cards', 'mobile-list', 'table', 'detail', 'profile'].includes(v)
  },
  count: {
    type: Number,
    default: 5
  }
})

const randomWidth = (min, max) => `${Math.floor(Math.random() * (max - min) + min)}%`
</script>

<style scoped>
.skeleton-list, .skeleton-mobile-list {
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border);
  overflow: hidden;
}

.skeleton-list-item, .skeleton-mobile-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
}

.skeleton-list-item:last-child, .skeleton-mobile-item:last-child {
  border-bottom: none;
}

.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.skeleton-table {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.skeleton-table-header {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
}

.skeleton-table-row {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border);
}

.skeleton-table-row:last-child {
  border-bottom: none;
}

.skeleton-detail {
  padding: 0;
}

.skeleton-profile {
  padding: 1rem;
}

@media (max-width: 768px) {
  .skeleton-cards {
    grid-template-columns: 1fr;
  }
}
</style>
