<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="tooltip-popup"
      :style="{ left: x + 'px', top: y + 'px' }"
    >
      <div class="tt-header">
        <span class="tt-icon">{{ icon }}</span>
        <div class="tt-titles">
          <div class="tt-name">{{ name }}</div>
          <div v-if="subtitle" class="tt-subtitle">{{ subtitle }}</div>
        </div>
      </div>
      <div v-if="desc" class="tt-desc">{{ desc }}</div>
      <div v-if="extra" class="tt-extra">{{ extra }}</div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  icon: { type: String, default: '' },
  name: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  desc: { type: String, default: '' },
  extra: { type: String, default: '' },
})
</script>

<style scoped>
.tooltip-popup {
  position: fixed;
  z-index: 9999;
  min-width: 220px;
  max-width: 300px;
  background: rgba(15, 20, 30, 0.97);
  border: 1px solid rgba(100, 130, 180, 0.4);
  border-radius: 8px;
  padding: 12px;
  color: #e0e8f0;
  font-size: 12px;
  line-height: 1.5;
  pointer-events: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  transform: translate(12px, -50%);
}

.tt-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(100, 130, 180, 0.2);
}
.tt-icon { font-size: 28px; }
.tt-titles { flex: 1; }
.tt-name { font-size: 14px; font-weight: 700; color: #fff; }
.tt-subtitle { font-size: 11px; color: #8aa; margin-top: 2px; }

.tt-desc { color: #c0d0e0; margin-bottom: 6px; }
.tt-extra { font-size: 11px; color: #f0c040; font-weight: 600; }
</style>
