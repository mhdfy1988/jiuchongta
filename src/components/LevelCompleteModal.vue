<template>
  <BaseModal size="sm" :close-on-overlay="false">
    <h2>🎉 第{{ game.level }}层过关!</h2>
    <div class="rewards" v-html="rewardsHTML"></div>
    <button class="btn btn-play" @click="state.goToShop()">🛒 进入商店</button>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './common/BaseModal.vue'
import { isBossLevel } from '../data/constants.js'

const props = defineProps({ state: Object })
const game = props.state.game

const rewardsHTML = computed(() => {
  const isBoss = isBossLevel(game.level) || (game.mode === 'endless' && isBossLevel(((game.level - 1) % 9) + 1))
  const exceed = game.levelScore >= game.targetScore * 2
  let reward = 0
  if (isBoss) reward += exceed ? 5 : 4
  else reward += exceed ? 5 : 3
  const handBonus = game.handsLeft
  reward += handBonus
  const interest = Math.floor(game.levelStartMoney * 0.2)
  reward += interest
  return `
    本层得分: <span style="color:var(--green); font-weight:700;">${game.levelScore.toLocaleString()}</span><br>
    ${exceed ? '超标奖励: <span style="color:var(--gold);">+$5</span><br>' : '达标奖励: <span style="color:var(--gold);">+$' + (isBoss ? 4 : 3) + '</span><br>'}
    剩余出牌: <span style="color:var(--blue);">+$${handBonus}</span><br>
    利息(20%): <span style="color:var(--gold);">+$${interest}</span><br>
    总金币: <span style="color:var(--gold); font-weight:700;">$${game.money}</span>
  `
})
</script>

<style scoped>
h2 { font-size: 24px; color: var(--gold); margin-bottom: 16px; text-align: center; }
.rewards { font-size: 14px; color: var(--text); line-height: 2; margin-bottom: 20px; text-align: left; }
.btn { display: block; margin: 0 auto; }
</style>
