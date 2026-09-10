import { RANK_VALUES, RANK_ORDER, FACE_CARDS, HAND_TYPES } from '../data/constants.js'
import { getJoker } from '../utils/gameData.js'

// 每次调用构建新 Set（jokers 通常 ≤5 个，开销可忽略）
// 之前的模块级缓存用引用比较，Vue reactive 数组 push/splice 后引用不变会导致缓存过期
function buildJokerIdSet(jokers) {
  return new Set(jokers.map(j => j.id))
}

/**
 * 计分系统：牌型判定 + 分数计算
 * 纯计算模块，只读 game 不写 game
 */
export function createScoringSystem() {

  function findStraight(cards, minLen, allowGap) {
    const sorted = [...cards].sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank])
    const unique = []
    const seen = new Set()
    sorted.forEach(c => { if (!seen.has(c.rank)) { unique.push(c); seen.add(c.rank) } })

    for (let i = 0; i <= unique.length - minLen; i++) {
      let ok = true, gaps = 0
      for (let j = 0; j < minLen - 1; j++) {
        const diff = RANK_ORDER[unique[i + j + 1].rank] - RANK_ORDER[unique[i + j].rank]
        if (diff === 0) continue
        if (diff === 1) continue
        if (allowGap && diff === 2 && gaps < 1) { gaps++; continue }
        ok = false; break
      }
      if (ok) return unique.slice(i, i + minLen)
    }
    // A-2-3-4-5 低顺
    const ace = unique.find(c => c.rank === 'A')
    const low = unique.filter(c => ['2', '3', '4', '5'].includes(c.rank))
    if (ace && low.length >= (minLen - 1)) {
      const needed = minLen - 1
      return [low.slice(0, needed), ace].flat()
    }
    return null
  }

  function evaluateHand(cards, game) {
    if (cards.length === 0) return { type: '--', chips: 0, mult: 0, scoringCards: [] }

    const idSet = buildJokerIdSet(game.jokers)
    const hasFourFingers = idSet.has('four_fingers')
    const hasShortcut = idSet.has('shortcut')
    const hasFuzzy = idSet.has('fuzzy')

    // 构建 original → effectiveCard 的索引映射，避免后续 indexOf O(n) 查找
    const cardIndex = new Map()
    const effectiveCards = cards.map(c => {
      const ec = { ...c }
      ec.effSuit = hasFuzzy
        ? (c.suit === '♥' ? '♦' : c.suit === '♠' ? '♣' : c.suit)
        : c.suit
      cardIndex.set(c, ec)
      return ec
    })
    // effectiveCard → original card 的反查表
    const ecToOriginal = new Map(effectiveCards.map((ec, i) => [ec, cards[i]]))

    const rankCount = {}
    effectiveCards.forEach(c => { rankCount[c.rank] = (rankCount[c.rank] || 0) + 1 })
    const counts = Object.values(rankCount).sort((a, b) => b - a)

    const isFlush = effectiveCards.every(c => c.effSuit === effectiveCards[0].effSuit)
    const minStraight = hasFourFingers ? 4 : 5
    let isStraight = false, straightCards = null
    if (cards.length >= minStraight) {
      const result = findStraight(effectiveCards, minStraight, hasShortcut)
      if (result) { isStraight = true; straightCards = result }
    }

    let handType = '高牌'
    let scoringCards = [...cards]

    if (counts[0] >= 5) {
      handType = '五条'
      scoringCards = effectiveCards.filter(c => rankCount[c.rank] >= 5).map(ec => ecToOriginal.get(ec))
    } else if (isStraight && isFlush && straightCards) {
      const straightRanks = straightCards.map(c => c.rank)
      if (straightRanks.includes('10') && straightRanks.includes('J') && straightRanks.includes('Q') && straightRanks.includes('K') && straightRanks.includes('A')) {
        handType = '皇家同花顺'
      } else {
        handType = '同花顺'
      }
      scoringCards = straightCards.map(ec => ecToOriginal.get(ec))
    } else if (counts[0] === 4) {
      handType = '四条'
      scoringCards = cards.filter(c => rankCount[c.rank] === 4)
    } else if (counts[0] === 3 && counts[1] === 2) {
      handType = '葫芦'
      scoringCards = cards.filter(c => rankCount[c.rank] >= 2)
    } else if (isFlush && cards.length >= 5) {
      handType = '同花'
      scoringCards = cards.slice().sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]).slice(0, 5)
    } else if (isStraight && straightCards) {
      handType = '顺子'
      scoringCards = straightCards.map(ec => ecToOriginal.get(ec))
    } else if (counts[0] === 3) {
      handType = '三条'
      scoringCards = cards.filter(c => rankCount[c.rank] === 3)
    } else if (counts[0] === 2 && counts[1] === 2) {
      handType = '两对'
      scoringCards = cards.filter(c => rankCount[c.rank] === 2)
    } else if (counts[0] === 2) {
      handType = '一对'
      scoringCards = cards.filter(c => rankCount[c.rank] === 2)
    } else {
      handType = '高牌'
      scoringCards = [cards.reduce((max, c) => RANK_VALUES[c.rank] > RANK_VALUES[max.rank] ? c : max)]
    }

    // 邻座小丑：四条+差1点变五条
    if (handType === '四条' && idSet.has('neighbor')) {
      const fourRank = Object.keys(rankCount).find(r => rankCount[r] === 4)
      const fifthCard = cards.find(c => c.rank !== fourRank)
      if (fifthCard) {
        const diff = Math.abs(RANK_VALUES[fourRank] - RANK_VALUES[fifthCard.rank])
        if (diff === 1) {
          handType = '五条'
          scoringCards = [...cards]
        }
      }
    }

    const base = HAND_TYPES[handType] || [5, 1]
    return { type: handType, chips: base[0], mult: base[1], scoringCards }
  }

  function calculateScore(cards, game) {
    // color_cut:被禁花色的牌不参与牌型判定和计分
    const disabledSuit = game.bossDebuff?.id === 'color_cut' ? game.bossDebuff.disabledSuit : null
    const effectiveCards = disabledSuit
      ? cards.filter(c => c.suit !== disabledSuit)
      : cards

    const evalResult = evaluateHand(effectiveCards, game)
    let chips = evalResult.chips
    let mult = evalResult.mult
    const triggerLog = []

    // 燧石：牌型基础底分和倍率减半
    if (game.bossDebuff?.id === 'flint') {
      chips = Math.ceil(chips / 2)
      mult = Math.max(1, Math.ceil(mult / 2))
    }
    // 明细里的"基础"项用这个值（燧石调整后、卡牌点数和小丑叠加前）
    const baseChips = chips
    const baseMult = mult

    // 贬值：牌面值减半（向上取整）
    const devalued = game.bossDebuff?.id === 'devalue'
    const cardChips = (card) => {
      const v = RANK_VALUES[card.rank] + (game.cardEnhancements[card.id] || 0)
      return devalued ? Math.ceil(v / 2) : v
    }

    // splash：所有打出的有效牌都计分
    let scoringCards = evalResult.scoringCards
    const idSet = buildJokerIdSet(game.jokers)
    if (idSet.has('splash')) scoringCards = [...effectiveCards]

    // 幻视：所有计分牌视为人头牌（影响人头相关的小丑与Boss判定）
    const hasVision = idSet.has('vision')
    const isFace = (c) => hasVision || FACE_CARDS.includes(c.rank)

    // 立柱：本层打出过的牌不再计分（仍参与牌型判定）
    if (game.bossDebuff?.id === 'pillar' && game.playedCardsThisLevel?.length) {
      scoringCards = scoringCards.filter(c => !game.playedCardsThisLevel.includes(c.rank + c.suit))
    }

    // Boss 过滤（人头牌不计分,只影响底分不影响牌型）
    if (game.bossDebuff?.id === 'seal_king') {
      scoringCards = scoringCards.filter(c => !isFace(c))
    }

    // 基础：每张计分牌的点数
    const cardSeals = game.cardSeals || {}
    scoringCards.forEach(card => {
      chips += cardChips(card)
    })

    // 卡牌印记：金色印记 +3倍率
    scoringCards.forEach(card => {
      if (cardSeals[card.id] === 'gold') mult += 3
    })

    // 额外触发（吊牌、喜与悲）
    const hasHanger = idSet.has('hanger')
    const hasJoySorrow = idSet.has('joy_sorrow')
    let extraTriggers = {}
    if (hasHanger && scoringCards.length > 0) extraTriggers[0] = (extraTriggers[0] || 0) + 2
    if (hasJoySorrow) scoringCards.forEach((c, i) => { if (isFace(c)) extraTriggers[i] = (extraTriggers[i] || 0) + 1 })
    for (const idx in extraTriggers) {
      const card = scoringCards[idx]
      if (!card) continue
      for (let t = 0; t < extraTriggers[idx]; t++) {
        chips += cardChips(card)
      }
    }

    // 牌型升级（星球牌）
    const upgrade = game.handUpgrades[evalResult.type]
    if (upgrade) {
      if (upgrade.chips) { chips += upgrade.chips; triggerLog.push({ name: '牌型升级', chips: upgrade.chips, mult: 0 }) }
      if (upgrade.mult) { mult += upgrade.mult; triggerLog.push({ name: '牌型升级', chips: 0, mult: upgrade.mult }) }
    }

    // 小丑效果遍历
    const ctx = {
      chips, mult, scoringCards, playedCards: cards, handType: evalResult.type,
      handLeft: game.handsLeft, discardLeft: game.discardsLeft, deckCount: game.deck.length,
      game, joker: null, finalMult: 1, isFace,
    }

    const jokers = game.jokers
    for (let ji = 0; ji < jokers.length; ji++) {
      const joker = jokers[ji]
      if (game.bossDebuff?.id === 'silence' && game.silencedJoker === joker) continue
      const def = getJoker(joker.id)
      if (!def || !def.effect) continue
      ctx.joker = joker
      const beforeChips = ctx.chips
      const beforeMult = ctx.mult
      def.effect(ctx)
      const dChips = ctx.chips - beforeChips
      const dMult = ctx.mult - beforeMult
      if (dChips > 0 || dMult > 0) {
        triggerLog.push({ name: def.name, chips: dChips, mult: dMult, jokerIdx: ji })
      }
    }

    // 礼券增益（小费/掌声/加倍券）：下次出牌一次性生效
    if (game.playBuff) {
      const b = game.playBuff
      if (b.chips) { ctx.chips += b.chips; triggerLog.push({ name: '礼券', chips: b.chips, mult: 0 }) }
      if (b.mult) { ctx.mult += b.mult; triggerLog.push({ name: '礼券', chips: 0, mult: b.mult }) }
      if (b.finalMult && b.finalMult !== 1) ctx.finalMult *= b.finalMult
    }

    chips = ctx.chips
    mult = ctx.mult
    const total = Math.max(0, Math.floor(chips * mult * ctx.finalMult))

    // no_repeat: 重复牌型不计分
    let finalTotal = total
    let noRepeatZeroed = false
    if (game.bossDebuff?.id === 'no_repeat' && game.playedHandTypes.includes(evalResult.type)) {
      finalTotal = 0
      noRepeatZeroed = true
    }

    // 赌徒：总分 ±30% 随机波动
    let gambleFactor = null
    if (game.bossDebuff?.id === 'gambler' && !noRepeatZeroed) {
      gambleFactor = 0.7 + Math.random() * 0.6
      finalTotal = Math.max(0, Math.floor(total * gambleFactor))
    }

    // 明细
    const breakdown = []
    breakdown.push({ label: evalResult.type + ' 基础', chips: baseChips, mult: baseMult })
    scoringCards.forEach(card => {
      breakdown.push({ label: card.rank + card.suit, chips: cardChips(card), mult: 0 })
    })
    triggerLog.forEach(log => {
      breakdown.push({ label: log.name, chips: log.chips || 0, mult: log.mult || 0 })
    })
    if (gambleFactor !== null) {
      breakdown.push({ label: `赌徒波动 ×${gambleFactor.toFixed(2)}`, chips: 0, mult: 0 })
    }

    return { type: evalResult.type, chips, mult, total: finalTotal, scoringCards, triggerLog, breakdown, zeroedByNoRepeat: noRepeatZeroed }
  }

  return { evaluateHand, calculateScore, findStraight }
}
