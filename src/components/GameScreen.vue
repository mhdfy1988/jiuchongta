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

        <!-- 封锁: 禁用牌型 -->
        <div v-if="game.bossDebuff.id === 'lockdown' && game.bossDebuff.disabledHand" class="boss-detail">
          <span class="bd-label">禁用</span>
          <span class="bd-val">{{ game.bossDebuff.disabledHand }}</span>
        </div>

        <!-- 断色: 禁用花色 -->
        <div v-if="game.bossDebuff.id === 'color_cut' && game.bossDebuff.disabledSuit" class="boss-detail">
          <span class="bd-label">禁用花色</span>
          <span class="bd-val suit">{{ game.bossDebuff.disabledSuit }}</span>
        </div>

        <!-- 沉默: 禁了哪张 -->
        <div v-if="game.bossDebuff.id === 'silence' && silencedJokerName" class="boss-detail">
          <span class="bd-label">沉默</span>
          <span class="bd-val">{{ silencedJokerName }}</span>
        </div>

        <!-- 唯一: 锁定牌型 -->
        <div v-if="game.bossDebuff.id === 'only_one' && game.lockedHandType" class="boss-detail">
          <span class="bd-label">锁定</span>
          <span class="bd-val">{{ game.lockedHandType }}</span>
        </div>

        <!-- 不许重复: 已打 -->
        <div v-if="game.bossDebuff.id === 'no_repeat' && game.playedHandTypes.length > 0" class="boss-detail">
          <span class="bd-label">已打</span>
          <span class="bd-val small">{{ game.playedHandTypes.join('、') }}</span>
        </div>

        <!-- 点名: 当前点名牌 -->
        <div v-if="game.bossDebuff.id === 'called_out' && calledOutCard" class="boss-detail">
          <span class="bd-label">点名牌</span>
          <span class="bd-val suit">{{ calledOutCard.rank }}{{ calledOutCard.suit }}</span>
        </div>
      </div>

      <div class="score-section">
        <div class="score-box target">
          <div class="label">🎯 目标分</div>
          <div class="val">{{ game.targetScore.toLocaleString() }}</div>
        </div>
        <div class="score-box score">
          <div class="label">⭐ 当前分</div>
          <div class="val">{{ displayLevelScore.toLocaleString() }}</div>
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
          <JokerCard
            v-for="(joker, idx) in game.jokers"
            :key="'j'+idx"
            :def="getJokerDef(joker) || {}"
            size="md"
            :locked="joker.data?.locked"
            :temporary="getJokerDef(joker)?.temp"
            :interactive="false"
            :stacks="joker.data?.stacks || 0"
            :show-delete="!joker.data?.locked"
            :bonus-popups="bonusPopupsFor(idx)"
            @delete="state.deleteJoker(idx)"
            @hover="(e, def) => showJokerTip(e, def, joker)"
            @leave="hideTip"
          />
          <div v-for="n in Math.max(0, 6 - game.jokers.length)" :key="'ej'+n" class="empty-slot joker-slot">
            <span class="slot-plus">+</span>
          </div>
        </div>

        <div class="consumables-area">
          <ConsumableCard
            v-for="(cons, idx) in game.consumables"
            :key="'c'+idx"
            :def="getConsDef(cons) || {}"
            :type="cons.type"
            size="md"
            :interactive="false"
            @click="state.useConsumable(idx)"
            @contextmenu="state.sellConsumable(idx)"
            @hover="(e, def) => showConsTip(e, def, cons.type)"
            @leave="hideTip"
          />
          <div v-for="n in Math.max(0, 2 - game.consumables.length)" :key="'ec'+n" class="empty-slot consumable-slot">
            <span class="slot-plus">+</span>
          </div>
        </div>
      </div>

      <!-- 手牌区 -->
      <div class="hand-area">
        <PlayingCard
          v-for="card in game.hand"
          :key="card.id"
          :card="card"
          :selected="game.selected.includes(card.id)"
          :called-out="game.calledOutId === card.id"
          @click="state.selectCard(card.id)"
        />
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

    <!-- 计分动画 -->
    <Transition name="sa-fade">
      <ScoreAnimation
        v-if="state.lastScoreResult.value"
        :result="state.lastScoreResult.value"
        @skip="state.skipScoreAnim"
      />
    </Transition>

    <!-- 悬浮提示 -->
    <Tooltip
      :visible="tip.visible"
      :x="tip.x"
      :y="tip.y"
      :icon="tip.icon"
      :name="tip.name"
      :subtitle="tip.subtitle"
      :desc="tip.desc"
      :extra="tip.extra"
    />

    <!-- 消耗品使用覆盖层 -->
    <ConsumableOverlay v-if="game.pendingConsumable !== null" :state="state" />

    <!-- 模态框 -->
    <LevelCompleteModal v-if="state.showModal.value === 'levelcomplete'" :state="state" />
    <ShopModal v-if="state.showModal.value === 'shop'" :state="state" />
    <GameOverModal v-if="state.showModal.value === 'gameover'" :state="state" />
    <HandChartModal v-if="state.showModal.value === 'handchart'" :state="state" @close="state.showModal.value = null" />
    <DeckViewModal v-if="state.showModal.value === 'deckview'" :state="state" @close="state.showModal.value = null" />
    <CardCollectionModal v-if="state.showModal.value === 'collection'" :state="state" @close="state.showModal.value = null" />
    <RunStatsModal v-if="state.showModal.value === 'runstats'" :state="state" @close="state.showModal.value = null" />
    <AchievementsModal v-if="state.showModal.value === 'achievements'" :stats="state.stats.value" @close="state.showModal.value = null" />
  </div>
</template>

<script setup>
import { computed, ref, reactive, watch } from 'vue'
import { getJoker } from '../utils/gameData.js'
import { getConsumableDef } from '../utils/gameData.js'
import { isBossLevel, RARITY_NAMES } from '../data/constants.js'
import JokerCard from './game/JokerCard.vue'
import ConsumableCard from './game/ConsumableCard.vue'
import PlayingCard from './game/PlayingCard.vue'
import Tooltip from './common/Tooltip.vue'
import ConsumableOverlay from './ConsumableOverlay.vue'
import LevelCompleteModal from './LevelCompleteModal.vue'
import ShopModal from './ShopModal.vue'
import GameOverModal from './GameOverModal.vue'
import HandChartModal from './HandChartModal.vue'
import DeckViewModal from './DeckViewModal.vue'
import CardCollectionModal from './CardCollectionModal.vue'
import RunStatsModal from './RunStatsModal.vue'
import AchievementsModal from './AchievementsModal.vue'
import ScoreAnimation from './ScoreAnimation.vue'

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

// Boss debuff 动态信息
const silencedJokerName = computed(() => {
  if (!game.silencedJoker) return ''
  const def = getJoker(game.silencedJoker.id)
  return def?.name || ''
})
const calledOutCard = computed(() => {
  if (game.calledOutId == null) return null
  return game.hand.find(c => c.id === game.calledOutId) || null
})

// 当前分滚动上涨(计分动画结束后 levelScore 才入账,这里做数字滚动)
const displayLevelScore = ref(game.levelScore)
let scoreRollRaf = null
watch(() => game.levelScore, (to, from) => {
  if (scoreRollRaf) cancelAnimationFrame(scoreRollRaf)
  if (to <= from) { displayLevelScore.value = to; return } // 重置/新层直接变
  const start = performance.now()
  const dur = 700
  function step(now) {
    const p = Math.min(1, (now - start) / dur)
    const e = 1 - Math.pow(1 - p, 3)
    displayLevelScore.value = Math.round(from + (to - from) * e)
    if (p < 1) scoreRollRaf = requestAnimationFrame(step)
  }
  scoreRollRaf = requestAnimationFrame(step)
})

const previewHand = computed(() => {
  if (game.selected.length === 0) return null
  const cards = game.selected.map(id => game.hand.find(c => c.id === id)).filter(Boolean)
  const result = props.state.evaluateHand(cards, game)
  return { type: result.type, chips: result.chips, mult: result.mult }
})

function getJokerDef(joker) {
  return getJoker(joker.id)
}

function getConsDef(cons) {
  return getConsumableDef(cons.type, cons.id)
}

function multItems(breakdown) {
  if (!breakdown) return []
  return breakdown.filter(b => b.mult > 0)
}

function bonusPopupsFor(idx) {
  return props.state.jokerBonusPopups.value.filter(p => p.jokerIdx === idx)
}

// ---------- Tooltip ----------
const tip = reactive({
  visible: false, x: 0, y: 0,
  icon: '', name: '', subtitle: '', desc: '', extra: '',
})

function showJokerTip(e, def, joker) {
  if (!def) return
  const stacks = joker.data?.stacks
  const typeLabel = def.type === 'chips' ? '底分'
    : def.type === 'mult' ? '倍率'
    : def.type === 'xmult' ? '乘倍率'
    : def.type === 'utility' ? '功能' : '临时'
  Object.assign(tip, {
    visible: true,
    x: e.clientX + 12, y: e.clientY,
    icon: def.icon, name: def.name,
    subtitle: `${typeLabel} · $${def.cost}`,
    desc: def.desc,
    extra: stacks ? `叠加: ${stacks}` : '',
  })
}

function showConsTip(e, def, type) {
  if (!def) return
  Object.assign(tip, {
    visible: true,
    x: e.clientX + 12, y: e.clientY,
    icon: def.icon, name: def.name,
    subtitle: `${type === 'tarot' ? '塔罗牌' : '星球牌'} · $${def.cost}`,
    desc: def.desc,
    extra: '',
  })
}

function hideTip() { tip.visible = false }
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
.boss-detail {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 4px; padding: 2px 6px; background: rgba(0,0,0,0.25); border-radius: 4px;
  font-size: 11px;
}
.bd-label { color: var(--muted); font-weight: 600; font-size: 10px; }
.bd-val { color: var(--accent); font-weight: 800; }
.bd-val.small { font-size: 10px; }
.bd-val.suit { font-family: 'Bungee', sans-serif; font-size: 13px; }

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
.empty-slot.consumable-slot { width: 78px; height: 110px; }
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

/* ===== 计分动画 ===== */
.sa-fade-leave-active { transition: opacity 0.3s ease; }
.sa-fade-leave-to { opacity: 0; }

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
