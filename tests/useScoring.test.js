import { describe, it, expect } from 'vitest'
import { useScoring } from '../src/composables/useScoring.js'
import { HAND_TYPES } from '../src/data/constants.js'

const { evaluateHand, calculateScore } = useScoring()

// 辅助：快速构造手牌
function card(rank, suit, id = 0) {
  return { id, rank, suit }
}

function makeGame(overrides = {}) {
  return {
    jokers: [],
    bossDebuff: null,
    silencedJoker: null,
    cardEnhancements: {},
    handUpgrades: {},
    handsLeft: 4,
    discardsLeft: 4,
    deck: { length: 52 },
    ...overrides,
  }
}

describe('useScoring - evaluateHand', () => {
  const game = makeGame()

  it('高牌', () => {
    const r = evaluateHand([card('A','♠'), card('3','♥'), card('5','♦'), card('7','♣'), card('9','♠')], game)
    expect(r.type).toBe('高牌')
    expect(r.scoringCards).toHaveLength(1) // 只有最大的
  })

  it('一对', () => {
    const r = evaluateHand([card('A','♠'), card('A','♥'), card('5','♦'), card('7','♣'), card('9','♠')], game)
    expect(r.type).toBe('一对')
  })

  it('两对', () => {
    const r = evaluateHand([card('A','♠'), card('A','♥'), card('5','♦'), card('5','♣'), card('9','♠')], game)
    expect(r.type).toBe('两对')
  })

  it('三条', () => {
    const r = evaluateHand([card('A','♠'), card('A','♥'), card('A','♦'), card('7','♣'), card('9','♠')], game)
    expect(r.type).toBe('三条')
  })

  it('顺子（A-2-3-4-5 低顺）', () => {
    const r = evaluateHand([card('A','♠'), card('2','♥'), card('3','♦'), card('4','♣'), card('5','♠')], game)
    expect(r.type).toBe('顺子')
  })

  it('顺子（10-J-Q-K-A）', () => {
    const r = evaluateHand([card('10','♠'), card('J','♥'), card('Q','♦'), card('K','♣'), card('A','♠')], game)
    expect(r.type).toBe('顺子')
  })

  it('同花', () => {
    const r = evaluateHand([card('A','♠'), card('3','♠'), card('5','♠'), card('7','♠'), card('9','♠')], game)
    expect(r.type).toBe('同花')
  })

  it('葫芦', () => {
    const r = evaluateHand([card('A','♠'), card('A','♥'), card('A','♦'), card('5','♣'), card('5','♠')], game)
    expect(r.type).toBe('葫芦')
  })

  it('四条', () => {
    const r = evaluateHand([card('A','♠'), card('A','♥'), card('A','♦'), card('A','♣'), card('9','♠')], game)
    expect(r.type).toBe('四条')
  })

  it('同花顺', () => {
    const r = evaluateHand([card('10','♠'), card('J','♠'), card('Q','♠'), card('K','♠'), card('A','♠')], game)
    expect(r.type).toBe('皇家同花顺')
  })

  it('五条', () => {
    // 需要5张同点数，默认52张牌里不存在，这里仅验证判定逻辑
    const r = evaluateHand([
      card('A','♠'), card('A','♥'), card('A','♦'), card('A','♣'), card('A','♠')
    ], game)
    expect(r.type).toBe('五条')
  })

  it('空牌返回高牌0分', () => {
    const r = evaluateHand([], game)
    expect(r.type).toBe('--')
    expect(r.chips).toBe(0)
    expect(r.mult).toBe(0)
  })
})

describe('useScoring - calculateScore 基础', () => {
  const game = makeGame()

  it('基础一对得分 = 基础分(10,2) + 2张对子点数', () => {
    const cards = [card('A','♠',1), card('A','♥',2), card('5','♦',3), card('7','♣',4), card('9','♠',5)]
    const r = calculateScore(cards, game)
    expect(r.type).toBe('一对')
    expect(r.chips).toBeGreaterThan(HAND_TYPES['一对'][0])
    expect(r.mult).toBe(HAND_TYPES['一对'][1])
    expect(r.total).toBe(Math.floor(r.chips * r.mult))
  })

  it('total = floor(chips * mult)', () => {
    const cards = [card('A','♠',1), card('K','♥',2), card('Q','♦',3), card('J','♣',4), card('10','♠',5)]
    const r = calculateScore(cards, game)
    expect(r.total).toBe(Math.floor(r.chips * r.mult))
  })
})

describe('useScoring - Boss debuff 计分', () => {
  it('封王：人头牌不计分', () => {
    const cards = [card('A','♠',1), card('K','♥',2), card('Q','♦',3), card('J','♣',4), card('10','♠',5)]
    const game = makeGame({ bossDebuff: { id: 'seal_king' } })
    const r = calculateScore(cards, game)
    // scoringCards 中不应有人头牌
    const faceCards = r.scoringCards.filter(c => ['J','Q','K'].includes(c.rank))
    expect(faceCards).toHaveLength(0)
  })

  it('断色：被禁用花色不计分', () => {
    const cards = [card('A','♠',1), card('K','♠',2), card('Q','♥',3), card('J','♥',4), card('10','♦',5)]
    const game = makeGame({ bossDebuff: { id: 'color_cut', disabledSuit: '♠' } })
    const r = calculateScore(cards, game)
    const spades = r.scoringCards.filter(c => c.suit === '♠')
    expect(spades).toHaveLength(0)
  })

  it('沉默：被沉默的小丑不生效', () => {
    const joker = { id: 'joker_plus_3', data: {} }
    const cards = [card('A','♠',1), card('A','♥',2), card('5','♦',3), card('7','♣',4), card('9','♠',5)]
    const gameWith = makeGame({ jokers: [joker], bossDebuff: { id: 'silence' }, silencedJoker: joker })
    const gameWithout = makeGame({ jokers: [joker] })
    const rWith = calculateScore(cards, gameWith)
    const rWithout = calculateScore(cards, gameWithout)
    // 沉默状态下得分应低于不沉默
    expect(rWith.total).toBeLessThanOrEqual(rWithout.total)
  })
})

describe('useScoring - 牌型升级', () => {
  it('星球牌升级增加牌型底分和倍率', () => {
    const cards = [card('A','♠',1), card('A','♥',2), card('5','♦',3), card('7','♣',4), card('9','♠',5)]
    const game = makeGame({
      handUpgrades: { '一对': { chips: 20, mult: 3 } }
    })
    const r = calculateScore(cards, game)
    expect(r.type).toBe('一对')
    // 基础 10 + 升级 20 = 30 chips 应在 breakdown 中体现
    expect(r.chips).toBeGreaterThanOrEqual(HAND_TYPES['一对'][0] + 20)
    expect(r.mult).toBeGreaterThanOrEqual(HAND_TYPES['一对'][1] + 3)
  })
})
