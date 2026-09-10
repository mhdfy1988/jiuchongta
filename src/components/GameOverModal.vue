<template>
  <BaseModal size="lg" :close-on-overlay="false">
    <div class="result-banner" :class="{ clear: isClear, fail: !isClear }">
      {{ isClear ? '🏆 通关!' : '💀 游戏结束' }}
    </div>
    <div class="result-sub">{{ isClear ? `恭喜征服${modeName}九层塔` : `在第 ${game.level} 层倒下` }}</div>

    <div class="gameover-layout">
      <!-- 左列：数据 -->
      <div class="go-col">
        <div class="section-label">本局数据</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">总分</span>
            <span class="stat-value gold">{{ game.totalScore.toLocaleString() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最高单次</span>
            <span class="stat-value green">{{ game.maxSingleScore.toLocaleString() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">到达层数</span>
            <span class="stat-value blue">{{ game.level }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">小丑收集</span>
            <span class="stat-value purple">{{ game.jokers.length }}</span>
          </div>
        </div>
        <div class="ach-total">累计成就: {{ totalUnlocked }} / {{ ACHIEVEMENTS.length }}</div>
      </div>

      <!-- 右列：本局成就 -->
      <div class="go-col">
        <div class="section-label">本局成就</div>
        <div v-if="achievementsUnlocked.length > 0" class="achievement-list">
          <div v-for="ach in achievementsUnlocked" :key="ach.id" class="ach-item">
            <span class="ach-icon">{{ ach.icon || '🏆' }}</span>
            <div class="ach-info">
              <span class="ach-name">{{ ach.name }}</span>
              <span class="ach-desc">{{ ach.desc }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-ach">本局未解锁新成就</div>
      </div>
    </div>

    <button class="btn btn-play return-btn" @click="returnToStart">返回主菜单</button>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './common/BaseModal.vue'
import { ACHIEVEMENTS } from '../data/achievements.js'

const props = defineProps({ state: Object })
const game = props.state.game

const isClear = computed(() => game.cleared && game.mode !== 'endless')

const modeName = computed(() => {
  if (game.mode === 'simple') return '简单'
  if (game.mode === 'hard') return '困难'
  return '无尽'
})

const achievementsUnlocked = computed(() => {
  return props.state.newAchievements?.value || []
})

const totalUnlocked = computed(() => {
  const stats = props.state.stats.value
  return ACHIEVEMENTS.filter(a => stats['ach_' + a.id]).length
})

function returnToStart() {
  props.state.screen.value = 'start'
  props.state.showModal.value = null
}
</script>

<style scoped>
.result-banner { font-size: 32px; font-weight: 900; font-family: 'Bungee', sans-serif; margin-bottom: 4px; text-align: center; }
.result-banner.clear { color: var(--gold); text-shadow: 0 0 30px rgba(255,204,34,0.5); }
.result-banner.fail { color: var(--red); text-shadow: 0 0 30px rgba(255,51,102,0.5); }
.result-sub { font-size: 14px; color: var(--muted); margin-bottom: 18px; text-align: center; }
.gameover-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.go-col { display: flex; flex-direction: column; gap: 8px; }
.section-label {
  font-size: 12px; font-weight: 700; color: var(--gold);
  margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,204,34,0.15);
}
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-item { background: rgba(0,0,0,0.4); border-radius: 10px; padding: 12px; }
.stat-label { font-size: 11px; color: var(--muted); display: block; margin-bottom: 4px; letter-spacing: 1px; }
.stat-value { font-size: 24px; font-weight: 900; font-family: 'Bungee', sans-serif; text-shadow: 0 0 10px currentColor; }
.stat-value.gold { color: var(--gold); }
.stat-value.green { color: var(--green); }
.stat-value.blue { color: var(--blue); }
.stat-value.purple { color: var(--purple); }
.ach-total { text-align: center; font-size: 11px; color: var(--muted); margin-top: 4px; }
.achievement-list { display: flex; flex-direction: column; gap: 6px; }
.ach-item {
  background: rgba(255,204,34,0.06); border: 1px solid rgba(255,204,34,0.15);
  border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; gap: 10px;
}
.ach-icon { font-size: 20px; }
.ach-info { display: flex; flex-direction: column; gap: 2px; }
.ach-name { font-size: 13px; font-weight: 700; color: var(--gold); }
.ach-desc { font-size: 11px; color: var(--muted); }
.no-ach { font-size: 13px; color: var(--muted); text-align: center; padding: 20px 0; }
.return-btn { padding: 14px 40px; font-size: 16px; font-family: 'Bungee', sans-serif; letter-spacing: 2px; display: block; margin: 0 auto; }
</style>
