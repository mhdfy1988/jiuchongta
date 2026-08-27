<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box ach-modal">
      <button class="close-btn" @click="$emit('close')">✕</button>
      <h2 class="modal-title">🏆 成就</h2>
      <div class="ach-progress">
        已解锁 {{ unlockedCount }} / {{ achievements.length }}
      </div>
      <div class="ach-grid">
        <div
          v-for="ach in achievements"
          :key="ach.id"
          class="ach-card"
          :class="{ unlocked: isUnlocked(ach.id), locked: !isUnlocked(ach.id) }"
        >
          <div class="ach-icon">{{ isUnlocked(ach.id) ? ach.icon : '🔒' }}</div>
          <div class="ach-name">{{ ach.name }}</div>
          <div class="ach-desc">{{ ach.desc }}</div>
          <div class="ach-status">
            <span v-if="isUnlocked(ach.id)" class="ach-done">✓ 已解锁</span>
            <span v-else class="ach-undone">未解锁</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ACHIEVEMENTS } from '../data/achievements.js'

const props = defineProps({
  stats: { type: Object, default: () => ({}) }
})
defineEmits(['close'])

const achievements = ACHIEVEMENTS

const unlockedCount = computed(() =>
  achievements.filter(a => props.stats['ach_' + a.id]).length
)

function isUnlocked(id) {
  return !!props.stats['ach_' + id]
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.modal-box {
  position: relative;
  background: linear-gradient(145deg, rgba(20,15,40,0.98), rgba(15,10,30,0.98));
  border: 1px solid rgba(255,204,34,0.3); border-radius: 16px; padding: 18px;
  box-shadow: 0 0 40px rgba(255,204,34,0.15);
}
.close-btn {
  position: absolute; top: 10px; right: 12px; width: 28px; height: 28px;
  background: rgba(255,51,102,0.15); border: 1px solid rgba(255,51,102,0.3);
  border-radius: 50%; color: var(--red); font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.close-btn:hover { background: rgba(255,51,102,0.3); }
.modal-title { font-size: 18px; color: var(--gold); text-align: center; margin-bottom: 8px; }
.ach-modal {
  max-width: 640px; width: 92%; max-height: 80vh;
  display: flex; flex-direction: column;
}
.ach-progress {
  text-align: center; color: var(--gold); font-size: 14px; font-weight: 700;
  margin-bottom: 14px;
}
.ach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
  overflow-y: auto; padding-right: 4px;
}
.ach-card {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 14px 8px; border-radius: 12px; gap: 6px;
  transition: all 0.2s;
}
.ach-card.unlocked {
  background: linear-gradient(135deg, rgba(255,204,34,0.12), rgba(255,204,34,0.04));
  border: 1px solid rgba(255,204,34,0.3);
}
.ach-card.unlocked:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(255,204,34,0.2);
}
.ach-card.locked {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  opacity: 0.5;
}
.ach-icon {
  font-size: 32px; width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
}
.ach-card.unlocked .ach-icon {
  background: rgba(255,204,34,0.15);
  filter: drop-shadow(0 0 8px rgba(255,204,34,0.3));
}
.ach-card.locked .ach-icon {
  background: rgba(255,255,255,0.05);
}
.ach-name {
  font-size: 13px; font-weight: 700;
}
.ach-card.unlocked .ach-name { color: var(--gold); }
.ach-card.locked .ach-name { color: var(--muted); }
.ach-desc {
  font-size: 10px; color: var(--muted); line-height: 1.4;
}
.ach-status { margin-top: 2px; }
.ach-done {
  font-size: 10px; color: #4ade80; font-weight: 600;
}
.ach-undone {
  font-size: 10px; color: var(--muted);
}
</style>
