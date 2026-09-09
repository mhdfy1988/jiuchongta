import { bus, EVENTS } from '../utils/eventBus.js'
import { getJoker, JOKERS_BY_RARITY } from '../utils/gameData.js'
import { useAudio } from '../composables/useAudio.js'

const { SFX } = useAudio()

/**
 * 小丑系统：管理小丑牌列表、买入、卖出、触发
 * 负责的 state 字段：jokers
 */
export function createJokerSystem(game, bus) {

  function addJoker(id, { locked = false } = {}) {
    if (game.jokers.length >= 6) return false
    const def = getJoker(id)
    if (!def) return false
    game.jokers.push({ id, data: { stacks: 0, locked } })
    bus.emit(EVENTS.JOKER_ADDED, { id, def })
    return true
  }

  function removeJoker(idx) {
    if (idx < 0 || idx >= game.jokers.length) return null
    const [removed] = game.jokers.splice(idx, 1)
    bus.emit(EVENTS.JOKER_REMOVED, { idx, joker: removed })
    return removed
  }

  function sellJoker(idx) {
    if (idx < 0 || idx >= game.jokers.length) return false
    const joker = game.jokers[idx]
    const def = getJoker(joker.id)
    if (!def) return false
    if (joker.data?.locked) return false
    const sellPrice = Math.max(1, Math.floor(def.cost / 2))
    game.money += sellPrice
    removeJoker(idx)
    SFX.sell()
    return sellPrice
  }

  function getDef(joker) {
    return getJoker(joker.id)
  }

  function triggerOnPlay(handType) {
    for (const joker of game.jokers) {
      const def = getJoker(joker.id)
      def?.onPlay?.(joker, handType)
    }
  }

  function triggerOnDiscard(cards, handType) {
    for (const joker of game.jokers) {
      const def = getJoker(joker.id)
      def?.onDiscard?.(cards, joker, handType)
    }
  }

  // 清理消耗型小丑（打完就消失的）
  function consumeTempJokers() {
    for (let i = game.jokers.length - 1; i >= 0; i--) {
      const def = getJoker(game.jokers[i].id)
      if (def?.consumeOnUse) game.jokers.splice(i, 1)
    }
  }

  return {
    addJoker,
    removeJoker,
    sellJoker,
    getDef,
    triggerOnPlay,
    triggerOnDiscard,
    consumeTempJokers,
  }
}
