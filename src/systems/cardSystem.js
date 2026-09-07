import { bus, EVENTS } from '../utils/eventBus.js'
import { createDeck, shuffle, drawCards, sortByRank, sortBySuit } from '../utils/cardUtils.js'
import { useAudio } from '../composables/useAudio.js'

const { SFX } = useAudio()

/**
 * 卡牌系统：管理牌堆、手牌、选中、抽牌、弃牌、排序
 * 负责的 state 字段：deck, hand, selected, handSize
 */
export function createCardSystem(game, bus) {
  // ---------- 选中 ----------

  function selectCard(cardId, { maxSelect = 5 } = {}) {
    const idx = game.selected.indexOf(cardId)
    if (idx >= 0) {
      game.selected.splice(idx, 1)
      SFX.deselect()
      bus.emit(EVENTS.CARD_DESELECTED, { cardId })
      return false
    }
    if (game.selected.length >= maxSelect) return false
    game.selected.push(cardId)
    SFX.select()
    bus.emit(EVENTS.CARD_SELECTED, { cardId })
    return true
  }

  function clearSelection() {
    game.selected = []
  }

  function getSelectedCards() {
    return game.selected.map(id => game.hand.find(c => c.id === id)).filter(Boolean)
  }

  function isSelected(cardId) {
    return game.selected.includes(cardId)
  }

  // ---------- 抽牌 ----------

  function initDeck() {
    game.deck = shuffle(createDeck())
    game.hand = []
    game.selected = []
  }

  function draw(n) {
    drawCards(game, n)
    if (n > 0) bus.emit(EVENTS.HAND_DRAWN, { count: n })
  }

  function refillHand() {
    const need = game.handSize - game.hand.length
    if (need > 0) draw(need)
  }

  // ---------- 移除（出牌/弃牌用） ----------

  function removeSelected() {
    const removed = getSelectedCards()
    const selSet = new Set(game.selected)
    game.hand = game.hand.filter(c => !selSet.has(c.id))
    game.selected = []
    return removed
  }

  function removeCardById(cardId) {
    const idx = game.hand.findIndex(c => c.id === cardId)
    if (idx >= 0) {
      const [card] = game.hand.splice(idx, 1)
      // 从选中里也移除
      const si = game.selected.indexOf(cardId)
      if (si >= 0) game.selected.splice(si, 1)
      return card
    }
    return null
  }

  // ---------- 排序 ----------

  function sortByRankAsc() {
    game.hand = sortByRank(game.hand)
  }

  function sortBySuitAsc() {
    game.hand = sortBySuit(game.hand)
  }

  // ---------- 重置 ----------

  function reset() {
    game.selected = []
  }

  return {
    selectCard,
    clearSelection,
    getSelectedCards,
    isSelected,
    initDeck,
    draw,
    refillHand,
    removeSelected,
    removeCardById,
    sortByRank: sortByRankAsc,
    sortBySuit: sortBySuitAsc,
    reset,
  }
}
