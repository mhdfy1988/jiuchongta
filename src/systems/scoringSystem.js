import { RANK_VALUES, RANK_ORDER, FACE_CARDS, HAND_TYPES } from '../data/constants.js'
import { getJoker } from '../utils/gameData.js'

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

    const hasFourFingers = game.jokers.some(j => j.id === 'four_fingers')
    const hasShortcut = game.jokers.some(j => j.id === 'shortcut')
    const hasFuzzy = game.jokers.some(j => j.id === 'fuzzy')

    const effectiveCards = cards.map(c => ({ ...c }))
    if (hasFuzzy) {
      effectiveCards.forEach(c => {
        if (c.suit === '♥') c.effSuit = '♦'
        else if (c.suit === '♠') c.effSuit = '♣'
        else c.effSuit = c.suit
      })
    } else {
      effectiveCards.forEach(c => c.effSuit = c.suit)
    }

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
      scoringCards = effectiveCards.filter(c => rankCount[c.rank] >= 5).map(c => cards[effectiveCards.indexOf(c)])
    } else if (isStraight && isFlush && straightCards) {
      const straightRanks = straightCards.map(c => c.rank)
      if (straightRanks.includes('10') && straightRanks.includes('J') && straightRanks.includes('Q') && straightRanks.includes('K') && straightRanks.includes('A')) {
        handType = '皇家同花顺'
      } else {
        handType = '同花顺'
      }
      scoringCards = straightCards.map(c => cards[effectiveCards.indexOf(c)])
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
      scoringCards = straightCards.map(c => cards[effectiveCards.indexOf(c)])
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
    if (handType === '四条' && game.jokers.some(j => j.id === 'neighbor')) {
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

    // splash：所有打出的有效牌都计分
    let scoringCards = evalResult.scoringCards
    const splash = game.jokers.find(j => j.id === 'splash')
    if (splash) scoringCards = [...effectiveCards]

    // Boss 过滤（人头牌不计分,只影响底分不影响牌型）
    if (game.bossDebuff?.id === 'seal_king') {
      scoringCards = scoringCards.filter(c => !FACE_CARDS.includes(c.rank))
    }

    // 基础：每张计分牌的点数
    scoringCards.forEach(card => {
      chips += RANK_VALUES[card.rank] + (game.cardEnhancements[card.id] || 0)
    })

    // 额外触发（吊牌、喜与悲）
    const hanger = game.jokers.find(j => j.id === 'hanger')
    const joySorrow = game.jokers.find(j => j.id === 'joy_sorrow')
    let extraTriggers = {}
    if (hanger && scoringCards.length > 0) extraTriggers[0] = (extraTriggers[0] || 0) + 2
    if (joySorrow) scoringCards.forEach((c, i) => { if (FACE_CARDS.includes(c.rank)) extraTriggers[i] = (extraTriggers[i] || 0) + 1 })
    for (const idx in extraTriggers) {
      const card = scoringCards[idx]
      if (!card) continue
      for (let t = 0; t < extraTriggers[idx]; t++) {
        chips += RANK_VALUES[card.rank] + (game.cardEnhancements[card.id] || 0)
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
      game, joker: null, finalMult: 1,
    }

    for (const joker of game.jokers) {
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
        triggerLog.push({ name: def.name, chips: dChips, mult: dMult, jokerIdx: game.jokers.indexOf(joker) })
      }
    }

    chips = ctx.chips
    mult = ctx.mult
    const total = Math.floor(chips * mult * ctx.finalMult)

    // no_repeat: 重复牌型不计分
    let finalTotal = total
    let noRepeatZeroed = false
    if (game.bossDebuff?.id === 'no_repeat' && game.playedHandTypes.includes(evalResult.type)) {
      finalTotal = 0
      noRepeatZeroed = true
    }

    // 明细
    const breakdown = []
    breakdown.push({ label: evalResult.type + ' 基础', chips: evalResult.chips, mult: evalResult.mult })
    scoringCards.forEach(card => {
      breakdown.push({ label: card.rank + card.suit, chips: RANK_VALUES[card.rank] + (game.cardEnhancements[card.id] || 0), mult: 0 })
    })
    triggerLog.forEach(log => {
      breakdown.push({ label: log.name, chips: log.chips || 0, mult: log.mult || 0 })
    })

    return { type: evalResult.type, chips, mult, total: finalTotal, scoringCards, triggerLog, breakdown, zeroedByNoRepeat: noRepeatZeroed }
  }

  return { evaluateHand, calculateScore, findStraight }
}
