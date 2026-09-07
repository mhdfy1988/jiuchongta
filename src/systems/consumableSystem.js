import { bus, EVENTS } from '../utils/eventBus.js'
import { getConsumableDef } from '../utils/gameData.js'
import { useAudio } from '../composables/useAudio.js'

const { SFX } = useAudio()

/**
 * 消耗品系统：管理消耗品使用
 * 负责的 state 字段：consumables, pendingConsumable, pendingSuit
 */
export function createConsumableSystem(game, bus, cardSystem) {

  // ---------- 卖出 ----------

  function sellConsumable(idx) {
    if (idx < 0 || idx >= game.consumables.length) return false
    const cons = game.consumables[idx]
    const def = getConsumableDef(cons.type, cons.id)
    if (!def) return false
    const sellPrice = Math.max(1, Math.floor((def.cost || 3) / 2))
    game.money += sellPrice
    game.consumables.splice(idx, 1)
    SFX.sell()
    bus.emit(EVENTS.ITEM_SOLD, { type: 'consumable', idx })
    return sellPrice
  }

  // ---------- 使用 ----------

  function startUse(idx) {
    const cons = game.consumables[idx]
    if (!cons) return false
    const def = getConsumableDef(cons.type, cons.id)
    if (!def) return false

    // 星球牌直接生效
    if (cons.type === 'planet') {
      applyPlanet(def)
      game.consumables.splice(idx, 1)
      SFX.useConsumable()
      bus.emit(EVENTS.CONSUMABLE_USED, { type: 'planet', id: cons.id })
      return 'applied'
    }

    // 塔罗牌进入待选牌状态（存对象引用，避免下标因卖出错位）
    game.pendingConsumable = cons
    game.pendingSuit = null
    cardSystem.clearSelection()
    return 'selecting'
  }

  function applyPlanet(def) {
    const ht = def.handType
    if (!game.handUpgrades[ht]) game.handUpgrades[ht] = { chips: 0, mult: 0 }
    if (def.id === 'mars') game.handUpgrades[ht].chips += 3
    else if (def.id === 'pluto') { game.handUpgrades[ht].chips += 2; game.handUpgrades[ht].mult += 1 }
    else game.handUpgrades[ht].mult +=
      (def.id === 'mercury' || def.id === 'venus') ? 1 :
      (def.id === 'earth') ? 2 :
      (def.id === 'saturn' || def.id === 'uranus') ? 3 : 4
  }

  function pickSuit(suit) {
    game.pendingSuit = suit
  }

  function cancelUse() {
    game.pendingConsumable = null
    game.pendingSuit = null
    cardSystem.clearSelection()
  }

  // 确认使用塔罗牌
  function confirmUse() {
    if (game.pendingConsumable === null) return false
    const idx = game.consumables.indexOf(game.pendingConsumable)
    if (idx < 0) {
      game.pendingConsumable = null
      game.pendingSuit = null
      return false
    }
    const cons = game.consumables[idx]
    const def = getConsumableDef(cons.type, cons.id)
    if (!def) return false

    const selectedCards = cardSystem.getSelectedCards()
    if (selectedCards.length < def.selectCount) return { error: `需要选择 ${def.selectCount} 张手牌` }

    const result = def.use(game, selectedCards)

    if (result === 'destroy') {
      if (selectedCards[0]) {
        cardSystem.removeCardById(selectedCards[0].id)
      }
    } else if (result === 'choose_suit') {
      if (!game.pendingSuit) return { error: '请先选择花色' }
      selectedCards[0].suit = game.pendingSuit
    } else if (result === false) {
      return { error: '选择的手牌数量不对' }
    }

    game.consumables.splice(idx, 1)
    game.pendingConsumable = null
    game.pendingSuit = null
    cardSystem.clearSelection()
    SFX.useConsumable()
    bus.emit(EVENTS.CONSUMABLE_USED, { type: 'tarot', id: cons.id })
    return { success: true, name: def.name }
  }

  function getPendingDef() {
    if (game.pendingConsumable === null) return null
    const idx = game.consumables.indexOf(game.pendingConsumable)
    if (idx < 0) return null
    const cons = game.consumables[idx]
    return getConsumableDef(cons.type, cons.id)
  }

  function isPending() {
    return game.pendingConsumable !== null
  }

  return {
    sellConsumable,
    startUse,
    pickSuit,
    cancelUse,
    confirmUse,
    getPendingDef,
    isPending,
  }
}
