<template>
  <div class="game-screen">
    <!-- 左侧状态栏 -->
    <aside class="sidebar">
      <div class="blind-info">
        <span :class="isBoss ? 'boss-tag' : 'normal-tag'">第 {{ game.level }} 层</span>
      </div>
      <div v-if="game.bossDebuff" class="boss-debuff">
        <div class="boss-name">{{ game.bossDebuff.name }}</div>
        <div class="boss-desc">{{ game.bossDebuff.desc }}</div>
      </div>

      <div class="score-section">
        <div class="score-box target">
          <div class="label">🎯 目标分</div>
          <div class="val">{{ game.targetScore.toLocaleString() }}</div>
        </div>
        <div class="score-box score">
          <div class="label">⭐ 当前分</div>
          <div class="val">{{ game.levelScore.toLocaleString() }}</div>
        </div>
        <div class="score-progress">
          <div class="score-progress-bar" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="hand-eval" v-if="previewHand">
        <div class="eval-type">{{ previewHand.type }}</div>
        <div class="eval-formula">
          <span class="eval-chip"><span class="eval-label">底分</span><span class="eval-val chips">{{ previewHand.chips }}</span></span>
          <span class="eval-mult"><span class="eval-label">倍率</span><span class="eval-val mult">{{ previewHand.mult }}</span></span>
        </div>
      </div>

      <div class="resources">
        <div class="resource">
          <span class="r-label">出牌</span>
          <span class="r-value hands">{{ game.handsLeft }}</span>
        </div>
        <div class="resource">
          <span class="r-label">换牌</span>
          <span class="r-value discards">{{ game.discardsLeft }}</span>
        </div>
        <div class="resource">
          <span class="r-label">💰 金币</span>
          <span class="r-value money">{{ game.money }}</span>
        </div>
      </div>

      <div class="sidebar-actions">
        <button class="sidebar-btn" @click="state.showModal.value = 'collection'">📖 卡牌图鉴</button>
        <button class="sidebar-btn" @click="state.showModal.value = 'runstats'">📊 本局统计</button>
        <button class="sidebar-btn" @click="state.showModal.value = 'handchart'">📋 牌型速查</button>
        <button class="sidebar-btn" @click="state.showModal.value = 'achievements'">🏆 成就</button>
        <button class="sidebar-btn exit-btn" @click="state.exitToMenu()">🚪 退出回主菜单</button>
        <button class="sidebar-btn sound-btn" @click="state.initAudio(); soundEnabled = !soundEnabled">
          {{ soundEnabled ? '🔊' : '🔇' }}
        </button>
      </div>
    </aside>

    <!-- 中间卡牌区 -->
    <main class="card-area">
      <!-- 小丑牌 + 消耗品行 -->
      <div class="cards-row">
        <div class="jokers-area">
          <div v-for="(joker, idx) in game.jokers" :key="'j'+idx"
            class="joker-card"
            :class="[`rarity-${getJokerDef(joker)?.rarity}`, { temporary: getJokerDef(joker)?.temp, locked: joker.data?.locked }]"
            @mouseenter="showJokerTooltip($event, joker)"
            @mouseleave="hideTooltip"
          >
            <span class="j-icon">{{ getJokerDef(joker)?.icon }}</span>
            <span class="j-name">{{ getJokerDef(joker)?.name }}</span>
            <div v-if="joker.data?.stacks" class="j-stacks">{{ joker.data.stacks }}</div>
            <div v-if="!joker.data?.locked" class="j-delete" @click.stop="state.deleteJoker(idx)">$</div>
            <div v-for="popup in bonusPopupsFor(idx)" :key="popup.text" class="joker-bonus-popup" :style="{ color: popup.color }">{{ popup.text }}</div>
          </div>
          <div v-for="n in Math.max(0, 6 - game.jokers.length)" :key="'ej'+n" class="empty-slot joker-slot">
            <span class="slot-plus">+</span>
          </div>
        </div>

        <div class="consumables-area">
          <div v-for="(cons, idx) in game.consumables" :key="'c'+idx"
            class="consumable-card"
            :class="cons.type"
            @click="state.useConsumable(idx)"
            @contextmenu.prevent="state.sellConsumable(idx)"
            @mouseenter="showConsTooltip($event, cons)"
            @mouseleave="hideTooltip"
          >
            <span class="c-icon">{{ getConsDef(cons)?.icon }}</span>
            <span class="c-name">{{ getConsDef(cons)?.name }}</span>
          </div>
          <div v-for="n in Math.max(0, 2 - game.consumables.length)" :key="'ec'+n" class="empty-slot consumable-slot">
            <span class="slot-plus">+</span>
          </div>
        </div>
      </div>

      <!-- 手牌区 -->
      <div class="hand-area">
        <div
          v-for="(card, idx) in game.hand" :key="card.id"
          class="playing-card"
          :class="{ red: card.suit === '♥' || card.suit === '♦', black: card.suit === '♠' || card.suit === '♣', selected: game.selected.includes(idx), 'called-out': game.calledOutIndex === idx }"
          @click="state.selectCard(idx)"
        >
          <div class="pc-corner top"><span class="pc-rank">{{ card.rank }}</span><span class="pc-suit">{{ card.suit }}</span></div>
          <div class="pc-center">{{ card.suit }}</div>
          <div class="pc-corner bot"><span class="pc-rank">{{ card.rank }}</span><span class="pc-suit">{{ card.suit }}</span></div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="controls">
        <button class="btn btn-play" :disabled="game.animating || game.selected.length === 0 || game.handsLeft <= 0" @click="state.playHand()">▶ 出牌</button>
        <button class="btn btn-discard" :disabled="game.animating || game.selected.length === 0 || game.discardsLeft <= 0" @click="state.discardCards()">✕ 弃牌</button>
        <button class="btn btn-sort" @click="state.sortByRank()">排序(点数)</button>
        <button class="btn btn-sort" @click="state.sortBySuit()">排序(花色)</button>
      </div>
    </main>

    <!-- 右侧牌堆 -->
    <aside class="deck-side">
      <div class="deck-pile" @click="state.showModal.value = 'deckview'">
        <div class="deck-back"></div>
        <div class="deck-count">{{ game.deck.length }}</div>
      </div>

      <div v-if="game.lastPlayedHand" class="last-hand">
        <div class="lh-title">上一手</div>
        <div class="lh-type">{{ game.lastPlayedHand.type }}</div>

        <div class="lh-section">
          <div class="lh-section-title">倍率</div>
          <div v-for="(b, i) in multItems(game.lastPlayedHand.breakdown)" :key="'m'+i" class="lh-row">
            <span class="lh-label">{{ b.label }}</span>
            <span class="lh-mult">+{{ b.mult }}</span>
          </div>
          <div class="lh-sum">
            <span class="lh-sum-label">倍率合计</span>
            <span class="lh-mult-val">{{ game.lastPlayedHand.mult }}</span>
          </div>
        </div>

        <div class="lh-section">
          <div class="lh-section-title">分值</div>
          <div v-for="(b, i) in (game.lastPlayedHand.breakdown || [])" :key="i" class="lh-row">
            <span class="lh-label">{{ b.label }}</span>
            <span class="lh-chips">{{ b.chips ? '+' + b.chips : '' }}</span>
          </div>
          <div class="lh-sum">
            <span class="lh-sum-label">底分合计</span>
            <span class="lh-sum-val">{{ game.lastPlayedHand.chips }}</span>
          </div>
        </div>

        <div class="lh-formula">{{ game.lastPlayedHand.chips }} × {{ game.lastPlayedHand.mult }}</div>
        <div class="lh-total">= {{ game.lastPlayedHand.total.toLocaleString() }}</div>
      </div>
    </aside>

    <!-- 计分弹窗 -->
    <div v-if="state.lastScoreResult.value" class="score-popup">
      <div class="sp-type">{{ state.lastScoreResult.value.type }}</div>
      <div class="sp-formula">
        <span class="sp-chips">{{ state.lastScoreResult.value.chips }}</span>
        <span class="sp-times">×</span>
        <span class="sp-mult">{{ state.lastScoreResult.value.mult }}</span>
      </div>
      <div class="sp-total">{{ state.lastScoreResult.value.total.toLocaleString() }}</div>
    </div>

    <!-- 悬浮提示 -->
    <div v-if="tooltipContent" class="joker-tooltip" :style="tooltipStyle" v-html="tooltipContent"></div>

    <!-- 消耗品使用覆盖层 -->
    <ConsumableOverlay v-if="game.pendingConsumable !== null" :state="state" />

    <!-- 模态框 -->
    <LevelCompleteModal v-if="state.showModal.value === 'levelcomplete'" :state="state" />
    <ShopModal v-if="state.showModal.value === 'shop'" :state="state" />
    <GameOverModal v-if="state.showModal.value === 'gameover'" :state="state" />
    <HandChartModal v-if="state.showModal.value === 'handchart'" :state="state" />
    <DeckViewModal v-if="state.showModal.value === 'deckview'" :state="state" />
    <CardCollectionModal v-if="state.showModal.value === 'collection'" :state="state" />
    <RunStatsModal v-if="state.showModal.value === 'runstats'" :state="state" />
    <AchievementsModal v-if="state.showModal.value === 'achievements'" :stats="state.stats.value" @close="state.showModal.value = null" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { JOKERS } from '../data/jokers.js'
import { TAROTS, PLANETS, getConsumableDef } from '../data/consumables.js'
import { isBossLevel } from '../data/constants.js'
import ConsumableOverlay from './ConsumableOverlay.vue'
import LevelCompleteModal from './LevelCompleteModal.vue'
import ShopModal from './ShopModal.vue'
import GameOverModal from './GameOverModal.vue'
import HandChartModal from './HandChartModal.vue'
import DeckViewModal from './DeckViewModal.vue'
import CardCollectionModal from './CardCollectionModal.vue'
import RunStatsModal from './RunStatsModal.vue'
import AchievementsModal from './AchievementsModal.vue'

const props = defineProps({ state: Object })
const game = props.state.game
const soundEnabled = ref(true)

const isBoss = computed(() => {
  const lvl = game.mode === 'endless' ? ((game.level - 1) % 9) + 1 : game.level
  return isBossLevel(lvl)
})

const progressPercent = computed(() => {
  return Math.min(100, (game.levelScore / game.targetScore) * 100)
})

const previewHand = computed(() => {
  if (game.selected.length === 0) return null
  const cards = game.selected.map(i => game.hand[i])
  const result = props.state.evaluateHand(cards, game)
  return { type: result.type, chips: result.chips, mult: result.mult }
})

function getJokerDef(joker) {
  return JOKERS.find(j => j.id === joker.id)
}

function getConsDef(cons) {
  return getConsumableDef(cons)
}

function multItems(breakdown) {
  if (!breakdown) return []
  return breakdown.filter(b => b.mult > 0)
}

function bonusPopupsFor(idx) {
  return props.state.jokerBonusPopups.value.filter(p => p.jokerIdx === idx)
}

const tooltipContent = ref('')
const tooltipStyle = ref({})

function showJokerTooltip(e, joker) {
  const def = getJokerDef(joker)
  if (!def) return
  const stacks = joker.data?.stacks
  tooltipContent.value = `
    <div style="font-size:22px;">${def.icon}</div>
    <div style="font-size:14px; font-weight:800; color:var(--gold); margin:4px 0;">${def.name}</div>
    <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">${def.type === 'chips' ? '底分' : def.type === 'mult' ? '倍率' : def.type === 'xmult' ? '乘倍率' : def.type === 'utility' ? '功能' : '临时'} · $${def.cost}</div>
    <div style="font-size:11px; color:var(--text); line-height:1.5; max-width:180px;">${def.desc}</div>
    ${stacks ? `<div style="font-size:11px; color:var(--accent); margin-top:4px;">叠加: ${stacks}</div>` : ''}
  `
  tooltipStyle.value = { left: e.clientX + 15 + 'px', top: e.clientY - 10 + 'px' }
}

function showConsTooltip(e, cons) {
  const def = getConsDef(cons)
  if (!def) return
  tooltipContent.value = `
    <div style="font-size:22px;">${def.icon}</div>
    <div style="font-size:14px; font-weight:800; color:var(--gold); margin:4px 0;">${def.name}</div>
    <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">${cons.type === 'tarot' ? '塔罗牌' : '星球牌'} · $${def.cost}</div>
    <div style="font-size:11px; color:var(--text); line-height:1.5; max-width:180px;">${def.desc}</div>
  `
  tooltipStyle.value = { left: e.clientX + 15 + 'px', top: e.clientY - 10 + 'px' }
}

function hideTooltip() {
  tooltipContent.value = ''
}
</script>

<style scoped>
.game-screen {
  display: flex; height: 100vh; overflow: hidden;
}

/* ===== 左侧状态栏 ===== */
.sidebar {
  width: 220px; flex-shrink: 0; padding: 12px;
  background: rgba(10,10,30,0.8); backdrop-filter: blur(12px);
  border-right: 1px solid rgba(255,204,34,0.2);
  display: flex; flex-direction: column; gap: 10px;
  overflow-y: auto;
}
.blind-info { text-align: center; font-size: 14px; font-weight: 700; letter-spacing: 2px; }
.blind-info .boss-tag { color: var(--accent); text-shadow: 0 0 12px rgba(255,51,102,0.5); }
.blind-info .normal-tag { color: var(--blue); text-shadow: 0 0 10px rgba(0,153,255,0.4); }
.boss-debuff {
  text-align: center; font-size: 12px; color: var(--accent);
  background: rgba(255,51,102,0.1); padding: 6px 10px; border-radius: 8px;
  border: 1px solid rgba(255,51,102,0.2);
}
.boss-debuff .boss-name { font-weight: 800; margin-bottom: 2px; }
.boss-debuff .boss-desc { font-size: 10px; color: var(--muted); line-height: 1.4; }

.score-section { background: rgba(0,0,0,0.4); border-radius: 10px; padding: 10px; }
.score-box { text-align: center; margin-bottom: 6px; }
.score-box .label { font-size: 10px; color: var(--muted); letter-spacing: 1px; font-weight: 600; margin-bottom: 2px; }
.score-box .val { font-size: 24px; font-weight: 900; font-family: 'Bungee', sans-serif; text-shadow: 0 0 12px currentColor; line-height: 1.1; }
.score-box.target .val { color: var(--accent2); }
.score-box.score .val { color: var(--green); }
.score-progress { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-top: 4px; }
.score-progress-bar { height: 100%; background: linear-gradient(90deg, var(--green), var(--accent2)); border-radius: 2px; transition: width 0.5s ease; box-shadow: 0 0 8px var(--green); }

.hand-eval { text-align: center; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px; }
.eval-type { font-size: 14px; font-weight: 800; color: var(--accent); margin-bottom: 6px; }
.eval-formula { display: flex; align-items: center; justify-content: center; gap: 6px; }
.eval-chip, .eval-mult {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.06); padding: 3px 10px; border-radius: 6px;
}
.eval-label { font-size: 10px; color: var(--muted); font-weight: 600; }
.eval-val { font-size: 16px; font-weight: 900; font-family: 'Bungee', sans-serif; }
.eval-val.chips { color: var(--blue); }
.eval-val.mult { color: var(--red); }

.resources { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.resource { text-align: center; background: rgba(0,0,0,0.4); border-radius: 8px; padding: 6px; }
.r-label { font-size: 9px; color: var(--muted); display: block; letter-spacing: 0.5px; }
.r-value { font-size: 20px; font-weight: 900; font-family: 'Bungee', sans-serif; text-shadow: 0 0 8px currentColor; }
.r-value.hands { color: var(--blue); }
.r-value.discards { color: var(--red); }
.r-value.money { color: var(--gold); }
.r-value.jokers { color: var(--purple); }
.r-value.consumables { color: #9c27b0; }

.last-hand {
  background: rgba(20,15,50,0.6); border: 1px solid rgba(255,204,34,0.15);
  border-radius: 8px; padding: 8px 6px; margin-top: 12px; width: 100%;
}
.lh-title { font-size: 9px; color: var(--muted); margin-bottom: 2px; text-align: center; }
.lh-type { font-size: 13px; font-weight: 800; color: var(--gold); margin-bottom: 6px; text-align: center; }
.lh-section { margin-bottom: 6px; }
.lh-section-title { font-size: 9px; color: var(--accent2); font-weight: 700; margin-bottom: 2px; padding-left: 2px; }
.lh-row { display: flex; justify-content: space-between; align-items: center; font-size: 9px; padding: 1px 4px; background: rgba(255,255,255,0.04); border-radius: 3px; }
.lh-label { color: var(--text); }
.lh-chips { color: var(--blue); font-weight: 700; }
.lh-mult { color: var(--red); font-weight: 700; }
.lh-sum { display: flex; justify-content: space-between; align-items: center; font-size: 10px; padding: 2px 4px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 1px; }
.lh-sum-label { color: var(--muted); font-weight: 600; }
.lh-sum-val { color: var(--blue); font-weight: 800; }
.lh-mult-val { color: var(--red); font-weight: 800; }
.lh-formula { font-size: 11px; color: var(--text); font-weight: 600; text-align: center; padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.1); }
.lh-total { font-size: 14px; color: var(--gold); font-weight: 800; text-align: center; }
.sidebar-actions { display: flex; flex-direction: column; gap: 4px; margin-top: auto; }
.sidebar-btn {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: var(--text); font-size: 12px; font-weight: 600; padding: 8px 12px;
  border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: center;
}
.sidebar-btn:hover { background: rgba(255,255,255,0.12); }
.sidebar-btn.exit-btn { color: var(--red); border-color: rgba(255,51,102,0.2); }
.sidebar-btn.exit-btn:hover { background: rgba(255,51,102,0.1); border-color: rgba(255,51,102,0.4); }
.sidebar-btn.sound-btn { text-align: center; font-size: 16px; }

/* ===== 中间卡牌区 ===== */
.card-area {
  flex: 1; display: flex; flex-direction: column; justify-content: space-between;
  padding: 12px; overflow: hidden; position: relative;
}
.cards-row { display: flex; gap: 32px; align-items: flex-start; justify-content: center; }
.jokers-area {
  display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;
  min-height: 118px; padding: 4px;
}
.consumables-area {
  display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;
}
.empty-hint { color: var(--muted); font-size: 11px; padding: 40px 8px; text-align: center; }
.empty-hint.small { padding: 30px 4px; font-size: 10px; }

.empty-slot {
  border: 2px dashed rgba(255,255,255,0.25); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.35); flex-shrink: 0;
  transition: border-color 0.3s, background 0.3s;
}
.empty-slot.joker-slot { width: 78px; height: 110px; }
.empty-slot.consumable-slot { width: 70px; height: 100px; }
.empty-slot .slot-plus { font-size: 32px; color: rgba(255,255,255,0.25); font-weight: 300; }
.empty-slot:hover { border-color: rgba(255,204,34,0.5); background: rgba(255,204,34,0.06); }
.empty-slot:hover .slot-plus { color: rgba(255,204,34,0.5); }

.j-stacks {
  position: absolute; top: -2px; left: -2px; background: var(--accent);
  color: #fff; font-size: 9px; font-weight: 900; padding: 1px 5px; border-radius: 4px 0 4px 0;
}
.joker-bonus-popup {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  font-size: 14px; font-weight: 900; white-space: nowrap;
  text-shadow: 0 0 8px currentColor; animation: bonusFloat 1s ease-out;
}
@keyframes bonusFloat {
  0% { transform: translateX(-50%) translateY(0); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
}

.hand-area {
  flex: 1; display: flex; gap: 6px; justify-content: center; align-items: center;
  background: radial-gradient(ellipse at center, rgba(40,20,60,0.3) 0%, transparent 70%);
  border-radius: 14px; padding: 20px 12px; margin: 8px 0;
  overflow-x: auto; overflow-y: hidden;
}
.playing-card.called-out {
  box-shadow: 0 0 20px rgba(255,51,102,0.8) !important;
  border-color: var(--accent) !important;
}

.controls { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

/* ===== 右侧牌堆 ===== */
.deck-side {
  width: 140px; flex-shrink: 0; padding: 12px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  background: rgba(10,10,30,0.6); border-left: 1px solid rgba(255,255,255,0.06);
}
.deck-pile { position: relative; cursor: pointer; margin-top: 20px; transition: transform 0.2s; }
.deck-pile:hover { transform: scale(1.05); }
.deck-pile:hover .deck-back { box-shadow: 0 6px 20px rgba(170,68,255,0.4), 0 0 15px rgba(255,204,34,0.15); }
.deck-pile:hover .deck-back::after { color: rgba(255,204,34,0.7); }
.deck-back {
  width: 56px; height: 80px; border-radius: 7px;
  background:
    radial-gradient(circle at 50% 30%, rgba(170,68,255,0.15), transparent 60%),
    linear-gradient(145deg, #1a0a2e, #16213e 50%, #0f1a3a);
  border: 2px solid rgba(170,68,255,0.35);
  box-shadow: 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
  position: relative; overflow: hidden;
}
.deck-back::before {
  content:''; position:absolute; inset:3px; border:1px solid rgba(170,68,255,0.25); border-radius:4px;
  background:
    repeating-linear-gradient(45deg, rgba(170,68,255,0.04) 0, rgba(170,68,255,0.04) 3px, transparent 3px, transparent 6px),
    repeating-linear-gradient(-45deg, rgba(255,204,34,0.02) 0, rgba(255,204,34,0.02) 3px, transparent 3px, transparent 6px);
}
.deck-back::after {
  content:'♠'; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  font-size:26px; color:rgba(170,68,255,0.35);
  text-shadow: 0 0 8px rgba(170,68,255,0.3);
  transition: color 0.3s;
}
.deck-count {
  position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
  background: var(--bg); color: var(--gold); font-size: 14px; font-weight: 800;
  padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,204,34,0.3);
}
.cs-label { color: var(--purple); font-size: 12px; font-weight: 600; text-align: center; }

/* ===== 计分弹窗 ===== */
.score-popup {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(10,10,30,0.95); backdrop-filter: blur(12px);
  border: 2px solid var(--gold); border-radius: 16px; padding: 16px 32px;
  text-align: center; z-index: 200; box-shadow: 0 0 40px rgba(255,204,34,0.3);
  animation: scorePopup 0.4s ease-out;
}
@keyframes scorePopup { from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } }
.sp-type { font-size: 20px; font-weight: 800; color: var(--accent); margin-bottom: 8px; }
.sp-formula { font-size: 28px; font-weight: 900; font-family: 'Bungee', sans-serif; margin-bottom: 4px; }
.sp-chips { color: var(--blue); }
.sp-times { color: var(--muted); margin: 0 8px; }
.sp-mult { color: var(--red); }
.sp-total { font-size: 36px; font-weight: 900; font-family: 'Bungee', sans-serif; color: var(--green); text-shadow: 0 0 20px var(--green); }

/* ===== Toast ===== */
.toast-container { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 300; }
.toast {
  background: rgba(10,10,30,0.95); color: var(--text); font-size: 14px; font-weight: 600;
  padding: 10px 24px; border-radius: 10px; border: 1px solid rgba(255,204,34,0.3);
  margin-bottom: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  animation: toastSlide 0.3s ease-out;
}
.toast.achievement { border-color: var(--gold); color: var(--gold); }
@keyframes toastSlide { from { opacity: 0; transform: translateY(-20px); } }

/* ===== 悬浮提示 ===== */
.joker-tooltip {
  position: fixed; z-index: 500; pointer-events: none;
  background: rgba(10,10,30,0.97); border: 1px solid rgba(255,204,34,0.3);
  border-radius: 10px; padding: 10px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  max-width: 220px;
}
</style>
