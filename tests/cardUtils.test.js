import { describe, it, expect } from 'vitest'
import { createDeck, shuffle, drawCards, sortByRank, sortBySuit } from '../src/utils/cardUtils.js'
import { SUITS, RANKS } from '../src/data/constants.js'

describe('cardUtils', () => {
  describe('createDeck', () => {
    it('生成52张牌，每张都有唯一id', () => {
      const deck = createDeck()
      expect(deck).toHaveLength(52)
      const ids = deck.map(c => c.id)
      expect(new Set(ids).size).toBe(52)
    })

    it('每张牌都有 rank 和 suit', () => {
      const deck = createDeck()
      for (const c of deck) {
        expect(RANKS).toContain(c.rank)
        expect(SUITS).toContain(c.suit)
      }
    })

    it('每个花色13张', () => {
      const deck = createDeck()
      for (const s of SUITS) {
        expect(deck.filter(c => c.suit === s)).toHaveLength(13)
      }
    })
  })

  describe('shuffle', () => {
    it('不改变数组长度', () => {
      const deck = createDeck()
      const shuffled = shuffle(deck)
      expect(shuffled).toHaveLength(52)
    })

    it('不修改原数组', () => {
      const deck = createDeck()
      const firstId = deck[0].id
      shuffle(deck)
      expect(deck[0].id).toBe(firstId)
    })

    it('所有牌都还在', () => {
      const deck = createDeck()
      const shuffled = shuffle(deck)
      const ids1 = deck.map(c => c.id).sort((a, b) => a - b)
      const ids2 = shuffled.map(c => c.id).sort((a, b) => a - b)
      expect(ids1).toEqual(ids2)
    })
  })

  describe('drawCards', () => {
    it('从牌堆抽n张到手牌', () => {
      const game = { deck: createDeck(), hand: [] }
      drawCards(game, 5)
      expect(game.hand).toHaveLength(5)
      expect(game.deck).toHaveLength(47)
    })

    it('抽的牌是牌堆顶的n张', () => {
      const deck = createDeck()
      const game = { deck: [...deck], hand: [] }
      drawCards(game, 3)
      expect(game.hand.map(c => c.id)).toEqual([deck[0].id, deck[1].id, deck[2].id])
    })
  })

  describe('sortByRank', () => {
    it('按点数从小到大排序（A最大）', () => {
      const deck = createDeck()
      // 索引: 9=♠10, 10=♠J, 11=♠Q, 12=♠K, 0=♠A
      const hand = [deck[12], deck[11], deck[10], deck[9], deck[0]] // K, Q, J, 10, A
      const sorted = sortByRank(hand)
      const ranks = sorted.map(c => c.rank)
      expect(ranks).toEqual(['10', 'J', 'Q', 'K', 'A'])
    })

    it('不改变原数组', () => {
      const hand = createDeck().slice(0, 5)
      const firstId = hand[0].id
      sortByRank(hand)
      expect(hand[0].id).toBe(firstId)
    })

    it('排序后选中状态通过 id 保持不变', () => {
      // 验证：基于 id 的选中状态在排序后仍然有效
      const hand = createDeck().slice(0, 8)
      const selectedId = hand[3].id
      const sorted = sortByRank(hand)
      const found = sorted.find(c => c.id === selectedId)
      expect(found).toBeDefined()
    })
  })

  describe('sortBySuit', () => {
    it('按花色排序：♠→♥→♣→♦，同花色按点数', () => {
      const deck = createDeck()
      // deck 顺序：♠(0-12), ♥(13-25), ♦(26-38), ♣(39-51)
      // 取：♥Q(24), ♠K(12), ♣Q(50), ♠A(0)
      const hand = [deck[24], deck[12], deck[50], deck[0]] // ♥Q, ♠K, ♣Q, ♠A
      const sorted = sortBySuit(hand)
      expect(sorted[0].suit).toBe('♠')
      expect(sorted[1].suit).toBe('♠')
      expect(sorted[2].suit).toBe('♥')
      expect(sorted[3].suit).toBe('♣')
      // 同花色点数升序
      expect(sorted[0].rank).toBe('K')
      expect(sorted[1].rank).toBe('A')
    })
  })
})
