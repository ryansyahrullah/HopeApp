<template>
  <div class="base-select">
    <!-- Trigger Button -->
    <button 
      type="button" 
      class="select-trigger" 
      @click="isOpen = !isOpen"
      :class="{ 'is-open': isOpen }"
    >
      <span class="selected-text">{{ selectedLabel || placeholder }}</span>
      <svg class="chevron" :class="{ 'chevron-up': isOpen }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>

    <!-- Transparent Backlog Overlay for closing when clicking outside -->
    <div v-if="isOpen" class="click-outside-overlay" @click="isOpen = false"></div>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <ul v-if="isOpen" class="select-menu">
        <li 
          v-for="option in options" 
          :key="option.value"
          class="select-option"
          :class="{ 'is-selected': option.value === modelValue }"
          @click="selectOption(option)"
        >
          {{ option.label }}
          <span v-if="option.value === modelValue" class="check-icon" style="display: flex; align-items: center;"><Check :size="16" /></span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true,
    // Format: [{ label: 'Option 1', value: 'opt1' }]
  },
  placeholder: {
    type: String,
    default: 'Pilih...'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : null
})

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}
</script>

<style scoped>
.base-select {
  position: relative;
  width: 100%;
  min-width: 140px;
}

.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  color: var(--c-text-main);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.select-trigger:hover {
  border-color: var(--c-primary);
}

.select-trigger.is-open {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.1);
}

.selected-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron {
  color: var(--c-primary);
  transition: transform 0.3s ease;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.chevron-up {
  transform: rotate(180deg);
}

/* Overlay for click outside mechanism */
.click-outside-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 40;
}

/* Menu Dropdown */
.select-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background-color: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  padding: 0.5rem;
  margin: 0;
  list-style: none;
  z-index: 50;
  max-height: 250px;
  overflow-y: auto;
}

.select-option {
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
  cursor: pointer;
  color: var(--c-text-main);
  font-size: 0.95rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.select-option:hover {
  background-color: var(--c-bg);
  color: var(--c-primary);
}

.select-option.is-selected {
  background-color: var(--c-danger-bg);
  color: var(--c-primary);
  font-weight: 600;
}

.check-icon {
  font-size: 1.1rem;
  margin-left: 1rem;
  flex-shrink: 0;
}

/* Animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .select-trigger {
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }
  
  .select-option {
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
