<template>
  <BaseModal size="sm" @close="close">
    <h2>📊 本局统计</h2>

    <div class="stats-section">
      <div class="section-label">总览</div>
      <div class="stat-row"><span class="sr-label">当前层数</span><span class="sr-value">{{ game.level }}</span></div>
      <div class="stat-row"><span class="sr-label">总分</span><span class="sr-value gold">{{ game.totalScore.toLocaleString() }}</span></div>
      <div class="stat-row"><span class="sr-label">本层得分</span><span class="sr-value green">{{ game.levelScore.toLocaleString() }}</span></div>
      <div class="stat-row"><span class="sr-label">本层目标</span><span class="sr-value blue">{{ game.targetScore.toLocaleString() }}</span></div>
      <div class="stat-row"><span class="sr-label">最高单次</span><span class="sr-value purple">{{ game.maxSingleScore.toLocaleString() }}</span></div>
      <div class="stat-row"><span class="sr-label">金币</span><span class="sr-value gold">{{ game.money }}</span></div>
    </div>

    <div class="stats-section">
      <div class="section-label">牌型统计</div>
      <div v-if="handCountList.length === 0" class="empty-text">尚未打出任何牌型</div>
      <div v-for="item in handCountList" :key="item.name" class="stat-row">
        <span class="sr-label">{{ item.name }}</span>
        <span class="sr-value">{{ item.count }} 次</span>
      </div>
    </div>

    <div class="stats-section">
      <div class="section-label">小丑牌 ({{ game.jokers.length }}/6)</div>
      <div v-if="game.jokers.length === 0" class="empty-text">暂无小丑牌</div>
      <div v-for="(joker, idx) in game.jokers" :key="idx" class="stat-row">
        <span class="sr-label">{{ getJokerDef(joker)?.icon }} {{ getJokerDef(joker)?.name }}</span>
        <span class="sr-value" :class="`rarity-text-${getJokerDef(joker)?.rarity}`">{{ rarityName(getJokerDef(joker)?.rarity) }}</span>
      </div>
    </div>

    <button class="btn btn-play close-btn" @click="close">关闭</button>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './common/BaseModal.vue'
import { JOKERS } from '../data/jokers.js'
import { HAND_TYPES, RARITY_NAMES } from '../data/constants.js'

const props = defineProps({ state: Object })
const emit = defineEmits(['close'])
const game = props.state.game

function getJokerDef(joker) {
  return JOKERS.find(j => j.id === joker.id)
}

function rarityName(r) { return RARITY_NAMES[r] || '' }

const handCountList = computed(() => {
  const counts = game.handTypeCounts
  const order = Object.keys(HAND_TYPES)
  return order.filter(name => counts[name]).map(name => ({ name, count: counts[name] }))
})

function close() {
  emit('close')
}
</script>

<style scoped>
h2 { font-size: 20px; color: var(--gold); margin-bottom: 16px; text-align: center; }
.stats-section { margin-bottom: 16px; }
.section-label { font-size: 13px; font-weight: 800; color: var(--accent2); margin-bottom: 8px; }
.stat-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 14px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 4px; }
.sr-label { font-size: 13px; color: var(--text); }
.sr-value { font-size: 14px; font-weight: 800; font-family: 'Bungee', sans-serif; }
.sr-value.gold { color: var(--gold); }
.sr-value.green { color: var(--green); }
.sr-value.blue { color: var(--blue); }
.sr-value.purple { color: var(--purple); }
.rarity-text-common { color: var(--rarity-common); }
.rarity-text-rare { color: var(--rarity-rare); }
.rarity-text-epic { color: var(--rarity-epic); }
.rarity-text-legend { color: var(--rarity-legend); }
.empty-text { font-size: 12px; color: var(--muted); padding: 8px; }
.close-btn { padding: 10px 32px; font-size: 14px; margin-top: 4px; display: block; margin: 0 auto; }
</style>
