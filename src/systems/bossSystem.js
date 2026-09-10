import { bus, EVENTS } from '../utils/eventBus.js'
import { BOSS_MAP } from '../utils/gameData.js'
import { isBossLevel, getBossPool, SUITS } from '../data/constants.js'
import { BOSS_DEBUFFS } from '../data/bosses.js'

/**
 * Boss 系统：管理 Boss debuff 的生成、应用、校验
 * 负责的 state 字段：bossDebuff, silencedJoker, calledOutId, lockedHandType, playedHandTypes
 */
export function createBossSystem(game, bus) {

  // ---------- Boss 生成 ----------

  function pickBoss() {
    const isBoss = isBossLevel(getEffectiveLevel())
    if (!isBoss && game.mode !== 'endless') { game.bossDebuff = null; return }
    if (game.mode === 'endless' && !isBossLevel(getEffectiveLevel())) { game.bossDebuff = null; return }

    const poolName = game.mode === 'endless'
      ? getBossPool(getEffectiveLevel())
      : getBossPool(game.level)
    const pool = BOSS_DEBUFFS[poolName]
    game.bossDebuff = { ...pool[Math.floor(Math.random() * pool.length)] }
    game.silencedJoker = null

    applyEffects({ scaleTarget: true })
    bus.emit(EVENTS.BOSS_APPLIED, { boss: game.bossDebuff })
  }

  // 无尽模式下，取当前层在 9 层循环中的位置
  function getEffectiveLevel() {
    return game.mode === 'endless'
      ? ((game.level - 1) % 9) + 1
      : game.level
  }

  // ---------- 效果应用 ----------

  // 效果策略表：id → 处理函数，替代 if-else 链
  const EFFECT_HANDLERS = {
    shackles: () => { game.handSize = 7 },
    no_discard: () => { game.discardsLeft = 0 },
    pinhole: () => { game.handsLeft = 1 },
    high_wall: (opts) => { if (opts.scaleTarget) game.targetScore = Math.floor(game.targetScore * 1.5) },
    low_wall: (opts) => { if (opts.scaleTarget) game.targetScore = Math.floor(game.targetScore * 1.25) },
    color_cut: () => {
      if (!game.bossDebuff.disabledSuit) game.bossDebuff.disabledSuit = SUITS[Math.floor(Math.random() * 4)]
    },
    lockdown: () => {
      if (!game.bossDebuff.disabledHand) {
        const types = ['同花顺','同花','顺子','葫芦','四条','一对']
        game.bossDebuff.disabledHand = types[Math.floor(Math.random() * types.length)]
      }
    },
    silence: () => {
      if (game.jokers.length > 0 && !game.silencedJoker) {
        const permanent = game.jokers.filter(j => !j.data?.locked)
        if (permanent.length > 0) game.silencedJoker = permanent[Math.floor(Math.random() * permanent.length)]
      }
    },
    called_out: () => rollCalledOut(),
  }

  // scaleTarget: high_wall 目标分倍率只在进入 Boss 层时乘一次，复活时跳过
  function applyEffects({ scaleTarget = true } = {}) {
    if (!game.bossDebuff) return
    const handler = EFFECT_HANDLERS[game.bossDebuff.id]
    if (handler) handler({ scaleTarget })
  }

  // ---------- 点名 ----------

  function rollCalledOut() {
    game.calledOutId = game.hand.length > 0
      ? game.hand[Math.floor(Math.random() * game.hand.length)].id
      : null
  }

  // 进层/复活后确保有点名牌(必须在手牌抽完后调用,否则手牌为空 roll 不出)
  function ensureCalledOut() {
    if (game.bossDebuff?.id !== 'called_out') return
    if (game.calledOutId === null || !game.hand.some(c => c.id === game.calledOutId)) {
      rollCalledOut()
    }
  }

  // 出牌/弃牌前的点名校验：返回 true 表示被阻止
  function checkCalledOut() {
    if (game.bossDebuff?.id !== 'called_out') return false
    // 如果点名牌不在手牌里了，重 roll
    if (game.calledOutId !== null && !game.hand.some(c => c.id === game.calledOutId)) {
      rollCalledOut()
    }
    if (game.calledOutId !== null && !game.selected.includes(game.calledOutId)) {
      return '点名: 必须打出或弃掉指定的牌!'
    }
    return false
  }

  // ---------- 出牌校验 ----------
  // 返回 false 表示通过，返回字符串表示被阻止（带提示信息）

  const VALIDATE_HANDLERS = {
    only_one: (type) => {
      if (!game.lockedHandType) { game.lockedHandType = type; return false }
      if (type !== game.lockedHandType) return `唯一: 只能打${game.lockedHandType}!`
      return false
    },
    lockdown: (type, debuff) => {
      if (!debuff.disabledHand) return false
      const dh = debuff.disabledHand
      if (type === dh
        || (dh === '一对' && type === '两对')
        || (dh === '同花顺' && type === '皇家同花顺')) {
        return `封锁: ${dh}被禁用!`
      }
      return false
    },
    ocd: () => {
      if (game.selected.length < 5) return '强迫症: 必须打出5张!'
      return false
    },
  }

  function validatePlay(resultType) {
    const debuff = game.bossDebuff
    if (!debuff) return false

    const calledMsg = checkCalledOut()
    if (calledMsg) return calledMsg

    const handler = VALIDATE_HANDLERS[debuff.id]
    if (handler) return handler(resultType, debuff)
    return false
  }

  // ---------- 记录已打牌型 ----------

  function recordPlayed(type) {
    game.handTypeCounts[type] = (game.handTypeCounts[type] || 0) + 1
    game.playedHandTypes = [...game.playedHandTypes, type]
  }

  // 立柱：记录本层打出过的具体牌（rank+suit），之后同牌不计分
  function recordPlayedCards(playedCards) {
    if (game.bossDebuff?.id !== 'pillar') return
    if (!game.playedCardsThisLevel) game.playedCardsThisLevel = []
    for (const c of playedCards) {
      const key = c.rank + c.suit
      if (!game.playedCardsThisLevel.includes(key)) game.playedCardsThisLevel.push(key)
    }
  }

  // ---------- 重置（新一层） ----------

  function resetForNewLevel() {
    game.bossDebuff = null
    game.silencedJoker = null
    game.lockedHandType = null
    game.playedHandTypes = []
    game.playedCardsThisLevel = []
    game.calledOutId = null
  }

  // ---------- 复活时重新应用（跳过目标分倍率） ----------

  function reapplyForRevive() {
    game.lockedHandType = null
    game.playedHandTypes = []
    game.playedCardsThisLevel = []
    game.calledOutId = null
    applyEffects({ scaleTarget: false })
    if (game.bossDebuff?.id === 'called_out') rollCalledOut()
  }

  function isBoss() {
    return !!game.bossDebuff
  }

  return {
    pickBoss,
    applyEffects,
    validatePlay,
    recordPlayed,
    recordPlayedCards,
    rollCalledOut,
    checkCalledOut,
    ensureCalledOut,
    resetForNewLevel,
    reapplyForRevive,
    isBoss,
    getEffectiveLevel,
  }
}
