<template>
  <div v-if="visible" class="debug-console" @click.self="close">
    <div class="debug-panel">
      <div class="debug-header">
        <span>🛠️ 调试控制台</span>
        <span class="debug-hint">` 键开关 · ↑↓ 历史</span>
        <button class="debug-close" @click="close">✕</button>
      </div>

      <div ref="logEl" class="debug-log">
        <div
          v-for="(line, i) in log"
          :key="i"
          class="debug-line"
          :class="line.type"
        >{{ line.text }}</div>
      </div>

      <div class="debug-input-row">
        <span class="debug-prompt">&gt;</span>
        <input
          ref="inputEl"
          v-model="input"
          class="debug-input"
          placeholder="输入 help 查看命令"
          @keydown.enter="run"
          @keydown.up.prevent="historyPrev"
          @keydown.down.prevent="historyNext"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { JOKERS } from '../data/jokers.js'
import { TAROT_MAP, PLANET_MAP, BOSS_MAP } from '../utils/gameData.js'
import { getTargetScore } from '../data/constants.js'

const props = defineProps({ state: { type: Object, required: true } })

const visible = ref(false)
const input = ref('')
const log = ref([])
const logEl = ref(null)
const inputEl = ref(null)
const history = ref([])
let historyIdx = -1

const game = props.state.game

// ---------- 开关 ----------
function open() {
  visible.value = true
  nextTick(() => inputEl.value?.focus())
}
function close() { visible.value = false }
function toggle() { visible.value ? close() : open() }

function onKeydown(e) {
  if (e.key === '`' && props.state.screen.value === 'game') {
    e.preventDefault()
    toggle()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ---------- 输出 ----------
function print(text, type = 'info') {
  log.value.push({ text, type })
  nextTick(() => { if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight })
}

// ---------- 模糊查找 ----------
function fuzzy(list, kw) {
  const k = kw.toLowerCase()
  return list.filter(item => item.id.toLowerCase().includes(k) || item.name.includes(kw))
}

// ---------- 牌解析：As / 10h / K♠ ----------
const SUIT_ALIAS = { s: '♠', h: '♥', d: '♦', c: '♣', '♠': '♠', '♥': '♥', '♦': '♦', '♣': '♣' }
function parseCard(str) {
  const m = str.match(/^(10|[2-9]|[JQKAjqka])([shdc♠♥♦♣])$/)
  if (!m) return null
  return { rank: m[1].toUpperCase(), suit: SUIT_ALIAS[m[2]] }
}

// ---------- 命令 ----------
const COMMANDS = {
  help() {
    print('可用命令:', 'cmd')
    print('  money 100 / money +50 / money -20   设置或增减金币')
    print('  joker 城堡        按名字/id 模糊搜索并添加小丑')
    print('  cons 死神         添加塔罗/星球消耗牌')
    print('  card 0 As         修改手牌第0张为 A♠（花色: s/h/d/c）')
    print('  score 500         设置当前层分数')
    print('  target 2000       设置目标分')
    print('  hands 5 / discards 5   设置出牌/弃牌次数')
    print('  boss high_wall / boss none   设置/清除 Boss debuff')
    print('  level 3           跳到第N层（含目标分重算）')
    print('  draw              补满手牌')
    print('  list joker|cons|boss       列出全部可选项')
    print('  clear             清空日志')
  },

  money(arg) {
    if (!arg) return print('用法: money 100 / money +50', 'err')
    if (/^[+-]/.test(arg)) game.money += parseInt(arg)
    else game.money = parseInt(arg)
    print(`金币 → ${game.money}`, 'ok')
  },

  joker(kw) {
    if (!kw) return print('用法: joker 城堡', 'err')
    const hits = fuzzy(JOKERS, kw)
    if (hits.length === 0) return print('没有找到匹配的小丑', 'err')
    if (hits.length > 1) return print('多个匹配: ' + hits.map(h => `${h.name}(${h.id})`).join('、'), 'err')
    const def = hits[0]
    if (game.jokers.length >= 6) return print('小丑槽已满 (6)', 'err')
    game.jokers.push({ id: def.id, data: def.initData ? def.initData() : { stacks: 0 } })
    print(`已添加 ${def.icon} ${def.name}`, 'ok')
  },

  cons(kw) {
    if (!kw) return print('用法: cons 死神', 'err')
    const all = [...TAROT_MAP.values()].map(d => ({ ...d, _type: 'tarot' }))
      .concat([...PLANET_MAP.values()].map(d => ({ ...d, _type: 'planet' })))
    const hits = fuzzy(all, kw)
    if (hits.length === 0) return print('没有找到匹配的消耗牌', 'err')
    if (hits.length > 1) return print('多个匹配: ' + hits.map(h => `${h.name}(${h.id})`).join('、'), 'err')
    const def = hits[0]
    if (game.consumables.length >= 2) return print('消耗牌槽已满 (2)', 'err')
    game.consumables.push({ id: def.id, type: def._type })
    print(`已添加 ${def.icon || ''} ${def.name} (${def._type === 'tarot' ? '塔罗' : '星球'})`, 'ok')
  },

  card(...args) {
    if (args.length < 2) return print('用法: card 0 As （第0张改为 A♠）', 'err')
    const idx = parseInt(args[0])
    if (isNaN(idx) || idx < 0 || idx >= game.hand.length) {
      return print(`手牌下标 0~${game.hand.length - 1}`, 'err')
    }
    const parsed = parseCard(args[1])
    if (!parsed) return print('牌格式: 点数(2-10,J,Q,K,A) + 花色(s,h,d,c)，如 As / 10h / Kd', 'err')
    game.hand[idx].rank = parsed.rank
    game.hand[idx].suit = parsed.suit
    print(`手牌[${idx}] → ${parsed.rank}${parsed.suit}`, 'ok')
  },

  score(arg) {
    const n = parseInt(arg)
    if (isNaN(n)) return print('用法: score 500', 'err')
    game.levelScore = n
    print(`当前分 → ${n} / 目标 ${game.targetScore}`, 'ok')
  },

  target(arg) {
    const n = parseInt(arg)
    if (isNaN(n)) return print('用法: target 2000', 'err')
    game.targetScore = n
    print(`目标分 → ${n}`, 'ok')
  },

  hands(arg) {
    const n = parseInt(arg)
    if (isNaN(n)) return print('用法: hands 5', 'err')
    game.handsLeft = n
    print(`出牌次数 → ${n}`, 'ok')
  },

  discards(arg) {
    const n = parseInt(arg)
    if (isNaN(n)) return print('用法: discards 5', 'err')
    game.discardsLeft = n
    print(`弃牌次数 → ${n}`, 'ok')
  },

  boss(kw) {
    if (!kw) return print('用法: boss high_wall / boss none', 'err')
    if (kw === 'none') {
      game.bossDebuff = null
      return print('已清除 Boss debuff', 'ok')
    }
    const hits = fuzzy([...BOSS_MAP.values()], kw)
    if (hits.length === 0) return print('没有找到匹配的 Boss', 'err')
    if (hits.length > 1) return print('多个匹配: ' + hits.map(h => `${h.name}(${h.id})`).join('、'), 'err')
    game.bossDebuff = { ...hits[0] }
    props.state.boss.applyEffects?.()
    print(`已设置 Boss: ${hits[0].name}`, 'ok')
  },

  level(arg) {
    const n = parseInt(arg)
    if (isNaN(n) || n < 1) return print('用法: level 3', 'err')
    game.level = n
    game.levelScore = 0
    game.targetScore = getTargetScore(n, game.mode)
    print(`已跳到第 ${n} 层，目标分 ${game.targetScore}（手牌/资源未重置）`, 'ok')
  },

  draw() {
    props.state.cards.refillHand()
    print(`手牌 → ${game.hand.length} 张`, 'ok')
  },

  list(what) {
    if (what === 'joker') print(JOKERS.map(j => `${j.name}(${j.id})`).join('、'), 'cmd')
    else if (what === 'cons') print([...TAROT_MAP.keys(), ...PLANET_MAP.keys()].join('、'), 'cmd')
    else if (what === 'boss') print([...BOSS_MAP.values()].map(b => `${b.name}(${b.id})`).join('、'), 'cmd')
    else print('用法: list joker|cons|boss', 'err')
  },

  clear() { log.value = [] },
}

// ---------- 执行 ----------
function run() {
  const raw = input.value.trim()
  if (!raw) return
  history.value.unshift(raw)
  if (history.value.length > 30) history.value.pop()
  historyIdx = -1
  print('> ' + raw, 'echo')
  input.value = ''

  const [cmd, ...args] = raw.split(/\s+/)
  const fn = COMMANDS[cmd.toLowerCase()]
  if (!fn) {
    print(`未知命令 "${cmd}"，输入 help 查看`, 'err')
    return
  }
  try {
    fn(...args)
    props.state.saveGameNow?.()
  } catch (err) {
    print('执行出错: ' + err.message, 'err')
  }
}

function historyPrev() {
  if (historyIdx < history.value.length - 1) input.value = history.value[++historyIdx]
}
function historyNext() {
  if (historyIdx > 0) input.value = history.value[--historyIdx]
  else { historyIdx = -1; input.value = '' }
}
</script>

<style scoped>
.debug-console {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.debug-panel {
  width: 560px;
  max-width: 92vw;
  max-height: 60vh;
  background: #0d0d1f;
  border: 1px solid rgba(255, 204, 34, 0.35);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}
.debug-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 204, 34, 0.08);
  border-bottom: 1px solid rgba(255, 204, 34, 0.2);
  color: var(--gold, #ffcc22);
  font-size: 13px;
  font-weight: 700;
}
.debug-hint {
  flex: 1;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 400;
}
.debug-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
}
.debug-close:hover { color: #fff; }
.debug-log {
  flex: 1;
  min-height: 160px;
  overflow-y: auto;
  padding: 10px 12px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
}
.debug-line { white-space: pre-wrap; word-break: break-all; }
.debug-line.echo { color: rgba(255, 255, 255, 0.45); }
.debug-line.ok { color: #6fdd8b; }
.debug-line.err { color: #ff6b81; }
.debug-line.cmd { color: #8ab4ff; }
.debug-line.info { color: var(--text, #e0e0e0); }
.debug-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.debug-prompt { color: var(--gold, #ffcc22); font-weight: 900; font-family: monospace; }
.debug-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
}
</style>
