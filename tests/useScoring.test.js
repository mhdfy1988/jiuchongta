import { describe, it, expect } from 'vitest'
import { reactive } from 'vue'
import { createScoringSystem } from '../src/systems/scoringSystem.js'
import { HAND_TYPES } from '../src/data/constants.js'

const { evaluateHand, calculateScore } = createScoringSystem()

function makeCards(list) {
  let id = 1
  return list.map(([rank, suit]) => ({ rank, suit, id: id++ }))
}

function fakeGame(overrides = {}) {
  return reactive({
    jokers: [],
    bossDebuff: null,
    silencedJoker: null,
    cardEnhancements: {},
    handUpgrades: {},
    handsLeft: 4,
    discardsLeft: 4,
    deck: [],
    ...overrides,
  })
}

describe('牌型判定', () => {
  it('高牌', () => {
    const cards = makeCards([['2','♠'],['5','♥'],['9','♣'],['J','♦'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('高牌')
    expect(r.scoringCards.length).toBe(1)
  })

  it('一对', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('一对')
    expect(r.scoringCards.length).toBe(2)
  })

  it('两对', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['9','♦'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('两对')
    expect(r.scoringCards.length).toBe(4)
  })

  it('三条', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['2','♣'],['J','♦'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('三条')
    expect(r.scoringCards.length).toBe(3)
  })

  it('顺子', () => {
    const cards = makeCards([['2','♠'],['3','♥'],['4','♣'],['5','♦'],['6','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('顺子')
  })

  it('同花', () => {
    const cards = makeCards([['2','♠'],['5','♠'],['9','♠'],['J','♠'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('同花')
  })

  it('葫芦', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['2','♣'],['K','♦'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('葫芦')
  })

  it('四条', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['2','♣'],['2','♦'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('四条')
  })

  it('同花顺', () => {
    const cards = makeCards([['2','♠'],['3','♠'],['4','♠'],['5','♠'],['6','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('同花顺')
  })

  it('皇家同花顺', () => {
    const cards = makeCards([['10','♠'],['J','♠'],['Q','♠'],['K','♠'],['A','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).toBe('皇家同花顺')
  })

  it('五条需要5张同点', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['2','♣'],['2','♦'],['K','♠']])
    const r = evaluateHand(cards, fakeGame())
    expect(r.type).not.toBe('五条')
  })
})

describe('计分', () => {
  it('基础计分：高牌底分5x1 + 最高牌点数（J/Q/K都是10点）', () => {
    const cards = makeCards([['2','♠'],['5','♥'],['9','♣'],['J','♦'],['K','♠']])
    const r = calculateScore(cards, fakeGame())
    // 底分5，最高牌K=10点（J/Q/K都是10点）
    expect(r.chips).toBe(5 + 10)
    expect(r.mult).toBe(1)
    expect(r.total).toBe(5 + 10)
  })

  it('一对计分正确', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const r = calculateScore(cards, fakeGame())
    // 一对底分 10x2，2张2各加2点
    const expectedChips = HAND_TYPES['一对'][0] + 2 + 2
    expect(r.chips).toBe(expectedChips)
    expect(r.mult).toBe(HAND_TYPES['一对'][1])
  })

  it('Boss seal_king 人头牌不计分', () => {
    // 用一对来测，两张2都不是人头牌，正常计分
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const game = fakeGame({ bossDebuff: { id: 'seal_king' } })
    const r = calculateScore(cards, game)
    // 一对基础10 + 两张2各2点 = 14
    expect(r.chips).toBe(10 + 2 + 2)
  })

  it('Boss color_cut 禁用花色不参与牌型判定和计分', () => {
    // 一对2(♠+♥) + 9♣ + J♦ + K♠,禁用♠后有效牌:2♥,9♣,J♦ → 高牌
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const game = fakeGame({ bossDebuff: { id: 'color_cut', disabledSuit: '♠' } })
    const r = calculateScore(cards, game)
    expect(r.type).toBe('高牌')
    // 高牌基础5 + J(10点)
    expect(r.chips).toBe(5 + 10)
  })

  it('Boss no_repeat 重复牌型不计分(能打但得0分)', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const game = fakeGame({ bossDebuff: { id: 'no_repeat', name: '不许重复' }, playedHandTypes: ['一对'] })
    const r = calculateScore(cards, game)
    expect(r.total).toBe(0)
    expect(r.zeroedByNoRepeat).toBe(true)
    // 首次打的牌型正常计分
    const game2 = fakeGame({ bossDebuff: { id: 'no_repeat', name: '不许重复' }, playedHandTypes: [] })
    const r2 = calculateScore(cards, game2)
    expect(r2.total).toBeGreaterThan(0)
    expect(r2.zeroedByNoRepeat).toBeFalsy()
  })

  it('牌型升级加chips', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const game = fakeGame({ handUpgrades: { '一对': { chips: 10, mult: 0 } } })
    const r = calculateScore(cards, game)
    const baseChips = HAND_TYPES['一对'][0] + 2 + 2
    expect(r.chips).toBe(baseChips + 10)
  })

  it('牌型升级加mult', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const game = fakeGame({ handUpgrades: { '一对': { chips: 0, mult: 3 } } })
    const r = calculateScore(cards, game)
    expect(r.mult).toBe(HAND_TYPES['一对'][1] + 3)
  })

  it('小丑 hanger 触发两次首牌计分', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const game = fakeGame({ jokers: [{ id: 'hanger', data: {} }] })
    const r = calculateScore(cards, game)
    // 一对基础分 + 2张2各2点 + hanger额外2次首牌(2点)
    const baseChips = HAND_TYPES['一对'][0] + 2 + 2
    expect(r.chips).toBe(baseChips + 2 + 2)
  })

  it('返回 breakdown 明细', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const r = calculateScore(cards, fakeGame())
    expect(r.breakdown.length).toBeGreaterThan(0)
    expect(r.breakdown[0].label).toContain('一对')
  })

  it('scoringCards 是实际参与计分的牌', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const r = calculateScore(cards, fakeGame())
    expect(r.scoringCards.length).toBe(2) // 一对只有两张2计分
  })

  it('splash 小丑让所有打出的牌都计分', () => {
    const cards = makeCards([['2','♠'],['2','♥'],['9','♣'],['J','♦'],['K','♠']])
    const game = fakeGame({ jokers: [{ id: 'splash', data: {} }] })
    const r = calculateScore(cards, game)
    expect(r.scoringCards.length).toBe(5) // 所有5张都计分
  })

  it('total = floor(chips * mult * finalMult)', () => {
    const cards = makeCards([['2','♠'],['5','♥'],['9','♣'],['J','♦'],['K','♠']])
    const r = calculateScore(cards, fakeGame())
    expect(r.total).toBe(Math.floor(r.chips * r.mult))
  })
})

describe('幻视联动', () => {
  // 一对(2,2)：基础(10,2) + 牌面 2+2 = 14底分，2张计分牌均非人头
  const pairCards = () => makeCards([['2','♠'],['2','♥'],['9','♣'],['5','♦'],['7','♠']])

  it('幻视+恐怖人头：所有计分牌按人头 +35', () => {
    const game = fakeGame({ jokers: [{ id: 'vision', data: {} }, { id: 'scary_face', data: {} }] })
    const r = calculateScore(pairCards(), game)
    expect(r.chips).toBe(14 + 2 * 35) // 84
    expect(r.mult).toBe(2)
  })

  it('无幻视：恐怖人头只认真实 J/Q/K', () => {
    const game = fakeGame({ jokers: [{ id: 'scary_face', data: {} }] })
    const r = calculateScore(pairCards(), game)
    expect(r.chips).toBe(14) // 没有人头牌，不加成
  })

  it('幻视+微笑表情：所有计分牌 +5倍率', () => {
    const game = fakeGame({ jokers: [{ id: 'vision', data: {} }, { id: 'smiley', data: {} }] })
    const r = calculateScore(pairCards(), game)
    expect(r.mult).toBe(2 + 2 * 5) // 12
  })

  it('幻视+石头小丑：人头牌判定反转后石头不生效', () => {
    const game = fakeGame({ jokers: [{ id: 'vision', data: {} }, { id: 'stone', data: {} }] })
    const r = calculateScore(pairCards(), game)
    expect(r.chips).toBe(14) // 全部视为人头 → 石头无人头条件不成立
  })

  it('幻视遇上 seal_king Boss：所有计分牌都被过滤', () => {
    const game = fakeGame({
      jokers: [{ id: 'vision', data: {} }],
      bossDebuff: { id: 'seal_king' },
    })
    const r = calculateScore(pairCards(), game)
    expect(r.scoringCards.length).toBe(0)
    expect(r.chips).toBe(10) // 只剩牌型基础分
  })
})
