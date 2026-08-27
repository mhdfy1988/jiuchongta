<template>
  <div class="consumable-overlay">
    <div class="overlay-panel">
      <div class="overlay-title">{{ def?.icon }} {{ def?.name }}</div>
      <div class="overlay-desc">{{ def?.desc }}</div>
      <div class="overlay-hint">{{ hint }}</div>
      <div v-if="showSuitPicker" class="suit-picker">
        <button
          v-for="suit in suits" :key="suit"
          class="suit-btn"
          :class="[suitClass(suit), { selected: game.pendingSuit === suit }]"
          @click="state.pickSuit(suit)"
        >{{ suit }}</button>
      </div>
      <div class="overlay-actions">
        <button class="confirm-btn" @click="state.confirmConsumable()">确认</button>
        <button class="cancel-btn" @click="state.cancelConsumable()">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { SUITS } from '../data/constants.js'
import { TAROTS } from '../data/consumables.js'

const props = defineProps({ state: Object })
const game = props.state.game
const suits = SUITS

const def = computed(() => {
  if (game.pendingConsumable === null) return null
  const cons = game.consumables[game.pendingConsumable]
  if (!cons) return null
  return TAROTS.find(t => t.id === cons.id)
})

const showSuitPicker = computed(() => {
  return def.value?.id === 'the_world' && game.selected.length >= def.value.selectCount
})

const hint = computed(() => {
  if (!def.value) return ''
  if (game.pendingSuit) return `已选花色 ${game.pendingSuit},点击确认使用`
  const remaining = def.value.selectCount - game.selected.length
  if (remaining > 0) return `还需选择 ${remaining} 张手牌 (已选 ${game.selected.length}/${def.value.selectCount})`
  return `已选 ${game.selected.length} 张,点击确认使用`
})

function suitClass(suit) {
  if (suit === '♥' || suit === '♦') return 'red-suit'
  return 'black-suit'
}
</script>

<style scoped>
.consumable-overlay {
  position: fixed; bottom: 0; left: 220px; right: 80px; z-index: 90;
  display: flex; justify-content: center; align-items: flex-end;
  pointer-events: none;
}
.overlay-panel {
  pointer-events: auto;
  background: linear-gradient(180deg, rgba(30,20,60,0.98) 0%, rgba(20,15,40,0.98) 100%);
  border-radius: 14px 14px 0 0; padding: 14px 24px; max-width: 680px; width: 100%;
  text-align: center; border-top: 2px solid rgba(170,68,255,0.5);
  box-shadow: 0 -4px 30px rgba(120,40,200,0.3);
}
.overlay-title { font-size: 16px; font-weight: 800; color: var(--purple); margin-bottom: 4px; }
.overlay-desc { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.overlay-hint { font-size: 14px; color: var(--gold); font-weight: 700; margin-bottom: 10px; min-height: 18px; }
.suit-picker { display: flex; gap: 12px; justify-content: center; margin-bottom: 10px; }
.suit-btn {
  font-size: 28px; padding: 8px 18px;
  background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.15);
  border-radius: 10px; cursor: pointer; transition: all 0.25s;
}
.suit-btn.red-suit { color: #ff4466; }
.suit-btn.black-suit { color: #e8e8e8; }
.suit-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px) scale(1.1); }
.suit-btn.selected {
  border-color: var(--gold); background: rgba(255,204,34,0.15);
  box-shadow: 0 0 16px rgba(255,204,34,0.5);
  animation: suit-pulse 0.6s infinite alternate;
}
@keyframes suit-pulse {
  from { box-shadow: 0 0 12px rgba(255,204,34,0.4); }
  to { box-shadow: 0 0 24px rgba(255,204,34,0.7); }
}
.overlay-actions { display: flex; gap: 12px; justify-content: center; }
.confirm-btn { background: linear-gradient(135deg, var(--green), #00aa5e); color: #fff; border: none; border-radius: 8px; padding: 8px 24px; font-weight: 700; cursor: pointer; }
.cancel-btn { background: rgba(255,51,102,0.2); color: var(--red); border: 1px solid rgba(255,51,102,0.3); border-radius: 8px; padding: 8px 24px; font-weight: 700; cursor: pointer; }
</style>
