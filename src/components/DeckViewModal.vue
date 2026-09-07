<template>
  <BaseModal size="md" @close="close">
    <h2>🂠 牌堆 ({{ game.deck.length }})</h2>
    <div class="deck-grid">
      <div v-for="suit in suits" :key="suit" class="suit-section">
        <div class="suit-label" :class="suitColor(suit)">{{ suit }}</div>
        <div class="suit-cards">
          <div v-for="rank in ranks" :key="rank"
            class="mini-card"
            :class="[suitColor(suit), { played: countInDeck(suit, rank) === 0 }]"
          >
            <span class="mc-rank">{{ rank }}</span>
            <span class="mc-suit">{{ suit }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="deck-legend">
      <span class="legend-item"><span class="legend-card"></span>剩余牌</span>
      <span class="legend-item"><span class="legend-card played"></span>已打出</span>
    </div>
    <div class="deck-hint">数字表示牌堆中剩余张数，— 表示已打出</div>
    <button class="btn btn-play close-btn" @click="close">关闭</button>
  </BaseModal>
</template>

<script setup>
import BaseModal from './common/BaseModal.vue'
import { SUITS, RANKS, SUIT_COLORS } from '../data/constants.js'

const props = defineProps({ state: Object })
const emit = defineEmits(['close'])
const game = props.state.game
const suits = SUITS
const ranks = RANKS

function suitColor(suit) {
  return SUIT_COLORS[suit] === 'red' ? 'red' : 'black'
}

function countInDeck(suit, rank) {
  return game.deck.filter(c => c.suit === suit && c.rank === rank).length
}

function close() {
  emit('close')
}
</script>

<style scoped>
h2 { font-size: 20px; color: var(--gold); margin-bottom: 14px; text-align: center; }

.deck-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
.suit-section { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 8px; border: 1px solid rgba(255,255,255,0.06); }
.suit-label { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
.suit-label.red { color: var(--red); }
.suit-label.black { color: var(--text); }

.suit-cards { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; }
.mini-card {
  width: 30px; height: 42px; border-radius: 4px;
  background: linear-gradient(160deg, #fff, #e0e0ea);
  border: 1.5px solid #333;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0px;
  flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.3); position: relative;
}
.mini-card.red { color: var(--red); }
.mini-card.black { color: #1a1a2a; }
.mini-card.played { opacity: 0.45; background: linear-gradient(160deg, #6a6a7a, #4a4a5a); border-color: #333340; }
.mini-card.played .mc-rank, .mini-card.played .mc-suit { color: #999; }
.mc-rank { font-size: 11px; font-weight: 900; line-height: 1; }
.mc-suit { font-size: 9px; line-height: 1; }

.deck-legend { display: flex; gap: 16px; justify-content: center; margin-bottom: 6px; }
.legend-item { font-size: 10px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
.legend-card { width: 14px; height: 20px; border-radius: 3px; background: rgba(255,255,255,0.8); border: 1.5px solid #333; display: inline-block; }
.legend-card.played { background: rgba(80,80,80,0.5); border-color: #333; opacity: 0.5; }

.deck-hint { font-size: 11px; color: var(--muted); margin-bottom: 14px; text-align: center; }
.close-btn { padding: 10px 32px; font-size: 14px; display: block; margin: 0 auto; }
</style>
