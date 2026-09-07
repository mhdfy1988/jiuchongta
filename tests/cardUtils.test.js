import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { createDeck, shuffle, drawCards, sortByRank, sortBySuit } from '../src/utils/cardUtils.js'
import { SUITS, RANKS } from '../src/data/constants.js'

describe('cardUtils', () => {
  it('createDeck 生成52张不重复的牌', () => {
    const deck = createDeck()
    expect(deck.length).toBe(52)
    const ids = new Set(deck.map(c => c.id))
    expect(ids.size).toBe(52)
  })

  it('每张牌都有 suit, rank, id', () => {
    const deck = createDeck()
    for (const card of deck) {
      expect(SUITS).toContain(card.suit)
      expect(RANKS).toContain(card.rank)
      expect(typeof card.id).toBe('number')
    }
  })

  it('shuffle 返回相同张数', () => {
    const deck = createDeck()
    const shuffled = shuffle([...deck])
    expect(shuffled.length).toBe(52)
    const shuffledIds = new Set(shuffled.map(c => c.id))
    expect(shuffledIds.size).toBe(52)
  })

  it('shuffle 不修改原数组', () => {
    const deck = createDeck()
    const original = deck.map(c => c.id).join(',')
    shuffle(deck)
    expect(deck.map(c => c.id).join(',')).toBe(original)
  })

  it('drawCards 从牌堆抽牌到手牌', () => {
    const game = reactive({ deck: shuffle(createDeck()), hand: [], handSize: 8 })
    drawCards(game, 5)
    expect(game.hand.length).toBe(5)
    expect(game.deck.length).toBe(47)
  })

  it('drawCards 从牌堆抽指定数量的牌', () => {
    const game = reactive({ deck: shuffle(createDeck()), hand: [], handSize: 8 })
    drawCards(game, 10)
    expect(game.hand.length).toBe(10)
    expect(game.deck.length).toBe(42)
  })

  it('sortByRank 按点数升序', () => {
    const deck = createDeck()
    const sorted = sortByRank(deck)
    const ranks = sorted.map(c => c.rank)
    // 检查整体非递减
    let prev = -1
    for (const r of ranks) {
      const order = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'].indexOf(r)
      expect(order).toBeGreaterThanOrEqual(prev)
      prev = order
    }
  })

  it('sortBySuit 按花色分组', () => {
    const deck = createDeck()
    const sorted = sortBySuit(deck)
    const suits = sorted.map(c => c.suit)
    // 同花色应该连续出现
    const seen = new Set()
    let lastSuit = null
    for (const s of suits) {
      if (s !== lastSuit) {
        expect(seen.has(s)).toBe(false)
        seen.add(s)
        lastSuit = s
      }
    }
  })

  it('sortByRank 不修改原数组', () => {
    const deck = shuffle(createDeck())
    const before = deck.map(c => c.id).join(',')
    sortByRank(deck)
    expect(deck.map(c => c.id).join(',')).toBe(before)
  })

  it('sortBySuit 不修改原数组', () => {
    const deck = shuffle(createDeck())
    const before = deck.map(c => c.id).join(',')
    sortBySuit(deck)
    expect(deck.map(c => c.id).join(',')).toBe(before)
  })

  it('createDeck 4种花色各13张', () => {
    const deck = createDeck()
    const countBySuit = {}
    deck.forEach(c => { countBySuit[c.suit] = (countBySuit[c.suit] || 0) + 1 })
    expect(Object.keys(countBySuit).length).toBe(4)
    for (const suit of SUITS) {
      expect(countBySuit[suit]).toBe(13)
    }
  })

  it('drawCards 从牌堆顶抽', () => {
    const deck = createDeck()
    const topCard = deck[0]
    const game = reactive({ deck: [...deck], hand: [], handSize: 8 })
    drawCards(game, 1)
    expect(game.hand[0].id).toBe(topCard.id)
  })
})
