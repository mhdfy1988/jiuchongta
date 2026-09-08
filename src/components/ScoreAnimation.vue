<template>
  <div class="sa-overlay" @click="onOverlayClick">
    <!-- 全屏闪光 -->
    <div v-if="flashOn" class="sa-flash"></div>

    <div class="sa-panel">
      <!-- 牌型名 -->
      <div class="sa-type">{{ result.type }}</div>

      <!-- 底分 × 倍率 -->
      <div v-if="started" class="sa-formula">
        <div class="sa-num chips" :class="{ bump: chipsBump }">
          <div class="sa-num-label">底分</div>
          <div class="sa-num-val">{{ fmt(displayChips) }}</div>
        </div>
        <div class="sa-times">×</div>
        <div class="sa-num mult" :class="{ bump: multBump }">
          <div class="sa-num-label">倍率</div>
          <div class="sa-num-val">{{ fmt(displayMult) }}</div>
        </div>
      </div>

      <!-- 逐条叠加项 -->
      <div class="sa-items">
        <div v-for="it in shownItems" :key="it.key" class="sa-item" :class="it.kind">
          <span class="sa-item-label">{{ it.label }}</span>
          <span v-if="it.chips" class="sa-item-chips">+{{ it.chips }}</span>
          <span v-if="it.mult" class="sa-item-mult">+{{ it.mult }}倍</span>
        </div>
      </div>

      <!-- 总分 -->
      <div v-if="isFinal" class="sa-total" :class="[tierClass, { 'zeroed': result.zeroedByNoRepeat }]">{{ fmt(displayTotal) }}</div>
      <div v-if="isFinal && result.zeroedByNoRepeat" class="sa-zeroed-label">不许重复 · 不计分</div>
    </div>

    <!-- 爆燃特效层(归零则没有) -->
    <template v-if="isFinal && !result.zeroedByNoRepeat">
      <div class="sa-shockwave"></div>
      <div v-for="p in particles" :key="p.key" class="sa-particle" :style="p.style"></div>
    </template>
    <!-- 归零特效 -->
    <template v-if="isFinal && result.zeroedByNoRepeat">
      <div class="sa-zero-flash"></div>
    </template>

    <div v-if="!isFinal" class="sa-skip-hint">双击跳过</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { SFX } from '../composables/useAudio.js'
import { SA_TIMING, SA_SKIP_REMAIN } from '../utils/scoreAnim.js'

const props = defineProps({ result: Object })
const emit = defineEmits(['skip'])

const phase = ref('type') // type -> steps -> final -> hold
const shownItems = ref([])
const targetChips = ref(0)
const targetMult = ref(0)
const displayChips = ref(0)
const displayMult = ref(0)
const displayTotal = ref(0)
const chipsBump = ref(false)
const multBump = ref(false)
const flashOn = ref(false)
const particles = ref([])

const timers = []
let rafId = null

const steps = computed(() => props.result?.breakdown || [])
const stepInterval = steps.value.length > 8 ? SA_TIMING.STEP_FAST : SA_TIMING.STEP_SLOW
const started = computed(() => shownItems.value.length > 0)
const isFinal = computed(() => phase.value === 'final' || phase.value === 'hold')

const tierClass = computed(() => {
  const t = props.result?.total || 0
  if (t >= 3000) return 'tier-3'
  if (t >= 800) return 'tier-2'
  return 'tier-1'
})

function fmt(n) {
  return Math.round(n).toLocaleString()
}

function later(fn, ms) {
  timers.push(setTimeout(fn, ms))
}

// ---------- 数字缓动滚动 ----------
function tick() {
  [[targetChips, displayChips], [targetMult, displayMult]].forEach(([t, d]) => {
    const diff = t.value - d.value
    d.value = Math.abs(diff) > 0.4 ? d.value + diff * 0.22 : t.value
  })
  rafId = requestAnimationFrame(tick)
}

function countTotal(dur) {
  const from = displayTotal.value
  const to = props.result.total
  const start = performance.now()
  function step(now) {
    const p = Math.min(1, (now - start) / dur)
    const e = 1 - Math.pow(1 - p, 3) // easeOutCubic,前快后慢
    displayTotal.value = from + (to - from) * e
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ---------- 逐条叠加 ----------
function landStep(item, idx) {
  shownItems.value.push({
    ...item,
    key: idx,
    kind: item.mult > 0 ? 'is-mult' : 'is-chips',
  })
  if (shownItems.value.length > 5) shownItems.value.shift()
  targetChips.value += item.chips || 0
  targetMult.value += item.mult || 0
  if (item.chips) { chipsBump.value = true; later(() => { chipsBump.value = false }, 260) }
  if (item.mult) { multBump.value = true; later(() => { multBump.value = false }, 260) }
  SFX.scoreTick(idx)
}

// ---------- 爆燃结算 ----------
function spawnParticles() {
  const t = props.result.total || 0
  const n = t >= 3000 ? 26 : t >= 800 ? 18 : 12
  const arr = []
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2
    const dist = 90 + Math.random() * 170
    arr.push({
      key: i,
      style: {
        '--dx': (Math.cos(ang) * dist).toFixed(0) + 'px',
        '--dy': (Math.sin(ang) * dist).toFixed(0) + 'px',
        '--sz': (3 + Math.random() * 5).toFixed(1) + 'px',
        '--hue': [45, 35, 20, 50, 10][i % 5],
        animationDelay: (Math.random() * 90).toFixed(0) + 'ms',
      },
    })
  }
  particles.value = arr
}

function toFinal(fast) {
  phase.value = 'final'
  const zeroed = props.result.zeroedByNoRepeat
  if (!zeroed) {
    flashOn.value = true
    later(() => { flashOn.value = false }, 220)
    document.body.classList.add('sa-shake')
    later(() => document.body.classList.remove('sa-shake'), 500)
    spawnParticles()
    SFX.explosion()
  } else {
    SFX.zeroScore()
  }
  const dur = fast ? 250 : SA_TIMING.COUNT
  countTotal(dur)
  later(() => { phase.value = 'hold' }, dur)
}

// ---------- 跳过(双击才生效,防误触) ----------
let lastClickAt = 0
function onOverlayClick() {
  const now = performance.now()
  if (now - lastClickAt < 350) {
    lastClickAt = 0
    skip()
  } else {
    lastClickAt = now
  }
}

function skip() {
  if (isFinal.value) return
  timers.forEach(clearTimeout)
  timers.length = 0
  shownItems.value = steps.value.slice(-5).map((s, i) => ({
    ...s, key: 'f' + i, kind: s.mult > 0 ? 'is-mult' : 'is-chips',
  }))
  targetChips.value = props.result.chips
  targetMult.value = props.result.mult
  displayChips.value = props.result.chips
  displayMult.value = props.result.mult
  chipsBump.value = false
  multBump.value = false
  toFinal(true)
  emit('skip', SA_SKIP_REMAIN)
}

onMounted(() => {
  SFX.scoreSlam()
  const list = steps.value
  if (list.length === 0) {
    // 空步骤：直接跳到最终结算
    later(() => toFinal(false), SA_TIMING.TYPE + SA_TIMING.PRE_FINAL)
    rafId = requestAnimationFrame(tick)
    return
  }
  list.forEach((item, i) => {
    const at = i === 0
      ? SA_TIMING.TYPE
      : SA_TIMING.TYPE + SA_TIMING.FIRST + (i - 1) * stepInterval
    later(() => landStep(item, i), at)
  })
  const finalAt = SA_TIMING.TYPE + SA_TIMING.FIRST +
    Math.max(0, list.length - 1) * stepInterval + SA_TIMING.PRE_FINAL
  later(() => toFinal(false), finalAt)
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  timers.forEach(clearTimeout)
  if (rafId) cancelAnimationFrame(rafId)
  document.body.classList.remove('sa-shake')
})
</script>

<style scoped>
.sa-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}

.sa-panel {
  position: relative; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 20px 40px;
}

/* ===== 牌型名 ===== */
.sa-type {
  font-size: 42px; font-weight: 900; font-family: 'Bungee', sans-serif;
  color: var(--gold);
  text-shadow: 0 0 24px rgba(255,204,34,0.7), 0 4px 0 rgba(0,0,0,0.5);
  animation: typeSlam 0.38s cubic-bezier(0.2, 1.6, 0.4, 1);
  letter-spacing: 4px;
}
@keyframes typeSlam {
  0% { transform: scale(2.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* ===== 底分 × 倍率 ===== */
.sa-formula {
  display: flex; align-items: center; gap: 14px;
  animation: itemIn 0.25s ease-out;
}
.sa-num {
  min-width: 110px; padding: 8px 18px; border-radius: 12px;
  background: #0d0d24;
}
.sa-num.chips { border: 2px solid var(--blue); box-shadow: 0 0 20px rgba(0,153,255,0.5); }
.sa-num.mult { border: 2px solid var(--red); box-shadow: 0 0 20px rgba(255,51,102,0.5); }
.sa-num-label { font-size: 11px; color: var(--muted); font-weight: 700; letter-spacing: 2px; }
.sa-num-val {
  font-size: 34px; font-weight: 900; font-family: 'Bungee', sans-serif; line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.sa-num.chips .sa-num-val { color: var(--blue); text-shadow: 0 0 14px rgba(0,153,255,0.8); }
.sa-num.mult .sa-num-val { color: var(--red); text-shadow: 0 0 14px rgba(255,51,102,0.8); }
.sa-num.bump { animation: bump 0.26s ease-out; }
@keyframes bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.14); }
  100% { transform: scale(1); }
}
.sa-times { font-size: 30px; font-weight: 900; color: var(--muted); }

/* ===== 叠加条目 ===== */
.sa-items {
  display: flex; flex-direction: column; gap: 3px; align-items: center;
  min-height: 108px; justify-content: flex-end;
}
.sa-item {
  display: flex; gap: 8px; align-items: center;
  font-size: 15px; font-weight: 800;
  background: #0d0d24; border-radius: 8px; padding: 2px 12px;
  animation: itemIn 0.22s cubic-bezier(0.2, 1.4, 0.4, 1);
  transition: transform 0.2s ease;
}
.sa-item:nth-last-child(1) { transform: scale(1); }
.sa-item:nth-last-child(n+2) { transform: scale(0.92); }
@keyframes itemIn {
  0% { transform: translateY(16px) scale(0.6); opacity: 0; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
.sa-item-label { color: var(--text); }
.sa-item-chips { color: var(--blue); font-family: 'Bungee', sans-serif; }
.sa-item-mult { color: var(--red); font-family: 'Bungee', sans-serif; }

/* ===== 总分(爆燃) ===== */
.sa-total {
  font-size: 64px; font-weight: 900; font-family: 'Bungee', sans-serif;
  font-variant-numeric: tabular-nums; line-height: 1.1;
  animation: totalPop 0.45s cubic-bezier(0.2, 1.8, 0.4, 1);
}
@keyframes totalPop {
  0% { transform: scale(0.2); opacity: 0; }
  60% { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1); }
}
.sa-total.tier-1 {
  color: var(--green);
  text-shadow: 0 0 24px rgba(0,255,136,0.8), 0 0 60px rgba(0,255,136,0.4);
}
.sa-total.tier-2 {
  background: linear-gradient(180deg, #fff6c8, #ffd23f 40%, #ff7a18);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 18px rgba(255,150,30,0.8)) drop-shadow(0 0 46px rgba(255,100,0,0.45));
}
.sa-total.tier-3 {
  background: linear-gradient(180deg, #ffffff, #ffe95c 25%, #ff9a1f 55%, #ff2d2d 85%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: totalPop 0.45s cubic-bezier(0.2, 1.8, 0.4, 1), fireFlicker 0.28s ease-in-out infinite alternate;
}
@keyframes fireFlicker {
  from { filter: drop-shadow(0 0 20px rgba(255,170,30,0.9)) drop-shadow(0 0 60px rgba(255,60,0,0.55)); transform: scale(1); }
  to { filter: drop-shadow(0 0 30px rgba(255,200,60,1)) drop-shadow(0 0 90px rgba(255,80,0,0.75)); transform: scale(1.03); }
}

.sa-total.zeroed {
  background: none; -webkit-background-clip: initial; background-clip: initial;
  color: #888;
  text-shadow: 0 0 12px rgba(255,255,255,0.2);
  animation: zeroPop 0.5s cubic-bezier(0.2, 1.8, 0.4, 1);
}
@keyframes zeroPop {
  0% { transform: scale(0.2) rotate(-15deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}
.sa-zeroed-label {
  font-size: 14px; font-weight: 800; color: #ff6b6b;
  letter-spacing: 4px; margin-top: -4px;
  animation: zeroLabelIn 0.4s ease-out 0.15s both;
}
@keyframes zeroLabelIn { from { opacity: 0; transform: translateY(10px); } }
.sa-zero-flash {
  position: fixed; inset: 0; pointer-events: none;
  background: radial-gradient(circle at 50% 45%, rgba(255,80,80,0.35), transparent 60%);
  animation: flashOut 0.25s ease-out forwards;
}

/* ===== 特效层 ===== */
.sa-flash {
  position: fixed; inset: 0; pointer-events: none;
  background: radial-gradient(circle at 50% 45%, rgba(255,230,150,0.85), rgba(255,140,40,0.35) 40%, transparent 70%);
  animation: flashOut 0.22s ease-out forwards;
}
@keyframes flashOut { from { opacity: 1; } to { opacity: 0; } }

.sa-shockwave {
  position: fixed; top: 45%; left: 50%; width: 120px; height: 120px;
  transform: translate(-50%, -50%); pointer-events: none;
  border: 5px solid rgba(255,200,80,0.8); border-radius: 50%;
  animation: shock 0.6s ease-out forwards;
}
@keyframes shock {
  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.9; }
  100% { transform: translate(-50%, -50%) scale(4.5); opacity: 0; }
}

.sa-particle {
  position: fixed; top: 45%; left: 50%; pointer-events: none;
  width: var(--sz); height: var(--sz); border-radius: 50%;
  background: hsl(var(--hue), 100%, 60%);
  box-shadow: 0 0 8px hsl(var(--hue), 100%, 55%);
  animation: particleFly 0.75s ease-out forwards;
}
@keyframes particleFly {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.1); opacity: 0; }
}

.sa-skip-hint {
  position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
  font-size: 11px; color: var(--muted); letter-spacing: 2px;
  animation: hintPulse 1.2s ease-in-out infinite;
}
@keyframes hintPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }
</style>

<style>
/* 震屏(全局,作用于游戏根容器) */
body.sa-shake .game-screen {
  animation: saShake 0.45s ease-in-out;
}
@keyframes saShake {
  0%, 100% { transform: translate(0, 0); }
  15% { transform: translate(-7px, 4px); }
  30% { transform: translate(6px, -5px); }
  45% { transform: translate(-5px, -3px); }
  60% { transform: translate(5px, 4px); }
  75% { transform: translate(-3px, 2px); }
  90% { transform: translate(2px, -1px); }
}
</style>
