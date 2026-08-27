<template>
  <div class="modal-overlay" @click.self="state.goToShop()">
    <div class="modal">
      <h2>🎉 第{{ game.level }}层过关!</h2>
      <div class="rewards" v-html="rewardsHTML"></div>
      <button class="btn btn-play" @click="state.goToShop()">🛒 进入商店</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
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
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: linear-gradient(145deg, rgba(20,15,40,0.98), rgba(15,10,30,0.98)); border: 1px solid rgba(255,204,34,0.3); border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 0 40px rgba(255,204,34,0.15); }
h2 { font-size: 24px; color: var(--gold); margin-bottom: 16px; }
.rewards { font-size: 14px; color: var(--text); line-height: 2; margin-bottom: 20px; text-align: left; }
</style>
