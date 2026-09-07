<template>
  <div class="modal-overlay" @click.self="handleOverlayClick">
    <div class="modal" :class="[sizeClass, { 'no-close-on-overlay': !closeOnOverlay }]">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md' }, // sm | md | lg | full
  closeOnOverlay: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const sizeClass = computed(() => `size-${props.size}`)

function handleOverlayClick() {
  if (props.closeOnOverlay) emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: linear-gradient(145deg, rgba(20, 15, 40, 0.98), rgba(15, 10, 30, 0.98));
  border: 1px solid rgba(255, 204, 34, 0.3);
  border-radius: 16px;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 40px rgba(255, 204, 34, 0.15);
}

.size-sm { width: 320px; max-width: 90%; }
.size-md { width: 560px; max-width: 92%; }
.size-lg { width: 720px; max-width: 92%; }
.size-full { width: 95%; height: 90%; }
</style>
