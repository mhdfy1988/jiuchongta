<template>
  <BaseModal size="lg" @close="$emit('close')">
    <button class="close-btn" @click="$emit('close')">✕</button>
    <h2 class="modal-title">📊 全局统计</h2>

    <div class="stats-layout">
      <!-- 左列 -->
      <div class="stats-col">
        <div class="stats-section">
          <div class="section-label">总览</div>
          <div class="stat-row"><span class="sr-label">总局数</span><span class="sr-value">{{ totalGames }}</span></div>
          <div class="stat-row"><span class="sr-label">困难通关</span><span class="sr-value gold">{{ stats.hardClears || 0 }}</span></div>
          <div class="stat-row"><span class="sr-label">最高总分</span><span class="sr-value gold">{{ (stats.maxScore || 0).toLocaleString() }}</span></div>
          <div class="stat-row"><span class="sr-label">最高单次</span><span class="sr-value purple">{{ (stats.maxSingleScore || 0).toLocaleString() }}</span></div>
          <div class="stat-row"><span class="sr-label">无尽最高层</span><span class="sr-value blue">{{ stats.maxEndless || 0 }}</span></div>
        </div>

        <div class="stats-section">
          <div class="section-label">成就进度</div>
          <div class="stat-row"><span class="sr-label">已解锁</span><span class="sr-value gold">{{ unlockedCount }} / {{ ACHIEVEMENTS.length }}</span></div>
        </div>

        <div class="stats-section">
          <div class="section-label">解锁内容</div>
          <div class="stat-row"><span class="sr-label">无尽模式</span><span class="sr-value" :class="{ unlocked: stats.unlockedEndless }">{{ stats.unlockedEndless ? '✓ 已解锁' : '— 未解锁' }}</span></div>
          <div class="stat-row"><span class="sr-label">解锁角色</span><span class="sr-value">{{ (stats.unlockedChars || []).length }} 个</span></div>
        </div>
      </div>

      <!-- 右列 -->
      <div class="stats-col">
        <div class="stats-section">
          <div class="section-label">游戏行为</div>
          <div class="stat-row"><span class="sr-label">累计弃牌</span><span class="sr-value">{{ stats.totalDiscards || 0 }}</span></div>
          <div class="stat-row"><span class="sr-label">累计刷新</span><span class="sr-value">{{ stats.totalRerolls || 0 }}</span></div>
          <div class="stat-row"><span class="sr-label">Boss击杀</span><span class="sr-value">{{ stats.bossDefeats || 0 }}</span></div>
          <div class="stat-row"><span class="sr-label">完美一层</span><span class="sr-value">{{ stats.perfectLevels || 0 }}</span></div>
        </div>

        <div class="stats-section">
          <div class="section-label">牌型图鉴</div>
          <div class="handtype-grid">
            <div v-for="item in handTypeList" :key="item.name" class="ht-item" :class="{ unlocked: item.unlocked }">
              <span class="ht-check">{{ item.unlocked ? '✓' : '—' }}</span>
              <span class="ht-name">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './common/BaseModal.vue'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { HAND_TYPES } from '../data/constants.js'

const props = defineProps({
  stats: { type: Object, default: () => ({}) }
})
defineEmits(['close'])

const totalGames = computed(() => (props.stats.totalGames || 0))
const unlockedCount = computed(() => ACHIEVEMENTS.filter(a => props.stats['ach_' + a.id]).length)

const handTypeList = computed(() => {
  const played = props.stats.handTypesPlayed || {}
  return Object.keys(HAND_TYPES).map(name => ({ name, unlocked: !!played[name] }))
})
</script>

<style scoped>
.close-btn {
  position: absolute; top: 10px; right: 12px; width: 28px; height: 28px;
  background: rgba(255,51,102,0.15); border: 1px solid rgba(255,51,102,0.3);
  border-radius: 50%; color: var(--red); font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.close-btn:hover { background: rgba(255,51,102,0.3); }
.modal-title { font-size: 18px; color: var(--gold); text-align: center; margin-bottom: 14px; }
.stats-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.stats-col { display: flex; flex-direction: column; gap: 14px; }
.stats-section { margin-bottom: 0; }
.section-label {
  font-size: 12px; font-weight: 700; color: var(--gold);
  margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,204,34,0.15);
}
.stat-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 13px;
}
.sr-label { color: var(--text); }
.sr-value { font-weight: 700; color: var(--text); }
.sr-value.gold { color: var(--gold); }
.sr-value.green { color: #4ade80; }
.sr-value.blue { color: var(--blue); }
.sr-value.purple { color: var(--purple); }
.sr-value.unlocked { color: #4ade80; }
.handtype-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.ht-item {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 8px; border-radius: 6px;
  background: rgba(255,255,255,0.03);
  font-size: 12px;
}
.ht-item.unlocked {
  background: rgba(74,222,128,0.08);
}
.ht-check { font-weight: 700; }
.ht-item.unlocked .ht-check { color: #4ade80; }
.ht-item:not(.unlocked) .ht-check { color: var(--muted); }
.ht-name { color: var(--text); }
.ht-item:not(.unlocked) .ht-name { color: var(--muted); }
</style>
