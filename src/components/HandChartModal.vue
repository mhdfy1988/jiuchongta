<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal chart-modal">
      <h2>📋 牌型速查</h2>
      <div class="chart-grid">
        <div v-for="hand in handList" :key="hand.name" class="chart-card" :class="{ upgraded: getUpgrade(hand.name) }">
          <div class="cc-header">
            <span class="cc-name">{{ hand.name }}</span>
            <span v-if="getUpgrade(hand.name)" class="cc-up">+{{ getUpgrade(hand.name).chips || 0 }}/{{ getUpgrade(hand.name).mult || 0 }}</span>
          </div>
          <div class="cc-cards">
            <div v-for="(card, ci) in hand.cards" :key="ci"
              class="mini-card"
              :class="{ red: card.s === '♥' || card.s === '♦', black: card.s === '♠' || card.s === '♣', scoring: hand.scoring.includes(ci) }"
            >
              <span class="mc-rank">{{ card.r }}</span>
              <span class="mc-suit">{{ card.s }}</span>
            </div>
          </div>
          <div class="cc-score">
            <span class="cc-chip"><span class="cc-chip-label">底分</span><span class="cc-chip-val">{{ hand.base[0] }}</span></span>
            <span class="cc-mult"><span class="cc-mult-label">倍率</span><span class="cc-mult-val">{{ hand.base[1] }}</span></span>
          </div>
        </div>
      </div>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-card scoring"></span>计分牌</span>
        <span class="legend-item"><span class="legend-card"></span>非计分牌</span>
      </div>
      <button class="btn btn-play close-btn" @click="close">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { HAND_TYPES } from '../data/constants.js'

const props = defineProps({ state: Object })
const game = props.state.game

const handList = [
  {
    name: '高牌', base: HAND_TYPES['高牌'],
    cards: [{r:'A',s:'♠'},{r:'K',s:'♦'},{r:'7',s:'♣'},{r:'4',s:'♥'},{r:'2',s:'♠'}],
    scoring: [0]
  },
  {
    name: '一对', base: HAND_TYPES['一对'],
    cards: [{r:'K',s:'♠'},{r:'K',s:'♦'},{r:'7',s:'♣'},{r:'4',s:'♥'},{r:'2',s:'♠'}],
    scoring: [0,1]
  },
  {
    name: '两对', base: HAND_TYPES['两对'],
    cards: [{r:'K',s:'♠'},{r:'K',s:'♦'},{r:'7',s:'♣'},{r:'7',s:'♥'},{r:'2',s:'♠'}],
    scoring: [0,1,2,3]
  },
  {
    name: '三条', base: HAND_TYPES['三条'],
    cards: [{r:'5',s:'♠'},{r:'5',s:'♦'},{r:'5',s:'♣'},{r:'4',s:'♥'},{r:'2',s:'♠'}],
    scoring: [0,1,2]
  },
  {
    name: '顺子', base: HAND_TYPES['顺子'],
    cards: [{r:'5',s:'♠'},{r:'6',s:'♦'},{r:'7',s:'♣'},{r:'8',s:'♥'},{r:'9',s:'♠'}],
    scoring: [0,1,2,3,4]
  },
  {
    name: '同花', base: HAND_TYPES['同花'],
    cards: [{r:'A',s:'♠'},{r:'8',s:'♠'},{r:'5',s:'♠'},{r:'3',s:'♠'},{r:'2',s:'♠'}],
    scoring: [0,1,2,3,4]
  },
  {
    name: '葫芦', base: HAND_TYPES['葫芦'],
    cards: [{r:'K',s:'♠'},{r:'K',s:'♦'},{r:'K',s:'♣'},{r:'7',s:'♥'},{r:'7',s:'♠'}],
    scoring: [0,1,2,3,4]
  },
  {
    name: '四条', base: HAND_TYPES['四条'],
    cards: [{r:'9',s:'♠'},{r:'9',s:'♦'},{r:'9',s:'♣'},{r:'9',s:'♥'},{r:'2',s:'♠'}],
    scoring: [0,1,2,3]
  },
  {
    name: '同花顺', base: HAND_TYPES['同花顺'],
    cards: [{r:'5',s:'♠'},{r:'6',s:'♠'},{r:'7',s:'♠'},{r:'8',s:'♠'},{r:'9',s:'♠'}],
    scoring: [0,1,2,3,4]
  },
  {
    name: '皇家同花顺', base: HAND_TYPES['皇家同花顺'],
    cards: [{r:'10',s:'♠'},{r:'J',s:'♠'},{r:'Q',s:'♠'},{r:'K',s:'♠'},{r:'A',s:'♠'}],
    scoring: [0,1,2,3,4]
  },
  {
    name: '五条', base: HAND_TYPES['五条'],
    cards: [{r:'A',s:'♠'},{r:'A',s:'♦'},{r:'A',s:'♣'},{r:'A',s:'♥'},{r:'A',s:'♠'}],
    scoring: [0,1,2,3,4]
  },
]

function getUpgrade(name) {
  return game.handUpgrades[name] || null
}

function close() {
  props.state.showModal.value = null
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: linear-gradient(145deg, rgba(20,15,40,0.98), rgba(15,10,30,0.98)); border: 1px solid rgba(255,204,34,0.3); border-radius: 16px; padding: 18px; max-width: 720px; width: 94%; max-height: 90vh; overflow-y: auto; text-align: center; box-shadow: 0 0 40px rgba(255,204,34,0.15); }
h2 { font-size: 18px; color: var(--gold); margin-bottom: 12px; }

.chart-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.chart-card { background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.2s; }
.chart-card:hover { background: rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.12); }
.chart-card.upgraded { border-color: rgba(170,68,255,0.4); background: rgba(170,68,255,0.08); }

.cc-header { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; }
.cc-name { font-size: 14px; font-weight: 800; color: var(--text); }
.cc-up { font-size: 9px; color: var(--purple); font-weight: 700; background: rgba(170,68,255,0.15); padding: 1px 5px; border-radius: 4px; }

.cc-cards { display: flex; gap: 3px; justify-content: center; }
.mini-card {
  width: 30px; height: 42px; border-radius: 4px;
  background: linear-gradient(160deg, #fff, #e0e0ea);
  border: 1.5px solid #333;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0px;
  flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.mini-card.red { color: var(--red); }
.mini-card.black { color: #1a1a2a; }
.mini-card.scoring { border-color: var(--gold); border-width: 2px; box-shadow: 0 0 8px rgba(255,204,34,0.5); background: linear-gradient(160deg, #fff, #f5f0e0); }
.mini-card:not(.scoring) { opacity: 0.5; }
.mc-rank { font-size: 11px; font-weight: 900; line-height: 1; }
.mc-suit { font-size: 9px; line-height: 1; }

.cc-score { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
.cc-chip, .cc-mult {
  display: flex; align-items: center; gap: 3px;
  background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 6px;
}
.cc-chip-label, .cc-mult-label {
  font-size: 9px; color: var(--muted); font-weight: 600;
}
.cc-chip-val { font-size: 14px; font-weight: 900; color: var(--blue); font-family: 'Bungee', sans-serif; }
.cc-mult-val { font-size: 14px; font-weight: 900; color: var(--red); font-family: 'Bungee', sans-serif; }

.chart-legend { display: flex; gap: 16px; justify-content: center; margin-bottom: 10px; }
.legend-item { font-size: 10px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
.legend-card { width: 14px; height: 20px; border-radius: 3px; background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.15); display: inline-block; }
.legend-card.scoring { border-color: var(--gold); background: rgba(255,204,34,0.1); box-shadow: 0 0 6px rgba(255,204,34,0.3); }

.close-btn { padding: 10px 32px; font-size: 14px; }
</style>
