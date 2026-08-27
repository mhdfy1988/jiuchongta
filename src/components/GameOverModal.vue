<template>
  <div class="modal-overlay" @click.self="returnToStart">
    <div class="modal game-over-modal">
      <div class="result-banner" :class="{ clear: isClear, fail: !isClear }">
        {{ isClear ? '🏆 通关!' : '💀 游戏结束' }}
      </div>
      <div class="result-sub">{{ isClear ? `恭喜征服${modeName}九层塔` : `在第 ${game.level} 层倒下` }}</div>

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

      <div v-if="achievementsUnlocked.length > 0" class="achievement-list">
        <div class="ach-title">解锁成就</div>
        <div v-for="ach in achievementsUnlocked" :key="ach.id" class="ach-item">
          <span class="ach-icon">🏆</span>
          <span class="ach-name">{{ ach.name }}</span>
          <span class="ach-desc">{{ ach.desc }}</span>
        </div>
      </div>

      <button class="btn btn-play return-btn" @click="returnToStart">返回主菜单</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
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
  const stats = props.state.stats.value
  return ACHIEVEMENTS.filter(a => stats['ach_' + a.id])
})

function returnToStart() {
  props.state.screen.value = 'start'
  props.state.showModal.value = null
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 300; }
.modal { background: linear-gradient(145deg, rgba(20,15,40,0.98), rgba(15,10,30,0.98)); border: 1px solid rgba(255,204,34,0.3); border-radius: 16px; padding: 28px; max-width: 440px; width: 90%; text-align: center; box-shadow: 0 0 50px rgba(255,204,34,0.15); }
.result-banner { font-size: 32px; font-weight: 900; font-family: 'Bungee', sans-serif; margin-bottom: 4px; }
.result-banner.clear { color: var(--gold); text-shadow: 0 0 30px rgba(255,204,34,0.5); }
.result-banner.fail { color: var(--red); text-shadow: 0 0 30px rgba(255,51,102,0.5); }
.result-sub { font-size: 14px; color: var(--muted); margin-bottom: 20px; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.stat-item { background: rgba(0,0,0,0.4); border-radius: 10px; padding: 12px; }
.stat-label { font-size: 11px; color: var(--muted); display: block; margin-bottom: 4px; letter-spacing: 1px; }
.stat-value { font-size: 24px; font-weight: 900; font-family: 'Bungee', sans-serif; text-shadow: 0 0 10px currentColor; }
.stat-value.gold { color: var(--gold); }
.stat-value.green { color: var(--green); }
.stat-value.blue { color: var(--blue); }
.stat-value.purple { color: var(--purple); }
.achievement-list { text-align: left; margin-bottom: 20px; }
.ach-title { font-size: 14px; font-weight: 800; color: var(--gold); margin-bottom: 8px; text-align: center; }
.ach-item { background: rgba(255,204,34,0.06); border: 1px solid rgba(255,204,34,0.15); border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
.ach-icon { font-size: 18px; }
.ach-name { font-size: 13px; font-weight: 700; color: var(--gold); }
.ach-desc { font-size: 11px; color: var(--muted); }
.return-btn { padding: 14px 40px; font-size: 16px; font-family: 'Bungee', sans-serif; letter-spacing: 2px; }
</style>
