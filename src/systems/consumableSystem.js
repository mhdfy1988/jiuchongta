import { bus, EVENTS } from '../utils/eventBus.js'
import { getConsumableDef } from '../utils/gameData.js'
import { useAudio } from '../composables/useAudio.js'

const { SFX } = useAudio()

/**
 * 消耗品系统：管理消耗品使用
 * 负责的 state 字段：consumables, pendingConsumable, pendingSuit, pendingOption, playBuff
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

    // 即时礼券（小费/掌声/加倍券）：叠加到下次出牌增益
    if (def.instant) {
      def.apply(game)
      game.consumables.splice(idx, 1)
      SFX.useConsumable()
      bus.emit(EVENTS.CONSUMABLE_USED, { type: cons.type, id: cons.id })
      return 'applied'
    }

    // 无需选牌的消耗品（如命运之轮）：直接执行
    if (def.selectCount === 0) {
      const result = def.use(game, [])
      if (result !== false) {
        game.consumables.splice(idx, 1)
        SFX.useConsumable()
        bus.emit(EVENTS.CONSUMABLE_USED, { type: cons.type, id: cons.id })
        return { applied: true, name: def.name, upgradedHandType: result?.upgradedHandType || null }
      }
      return false
    }

    // 其余进入待选牌状态（存对象引用，避免下标因卖出错位）
    game.pendingConsumable = cons
    game.pendingSuit = null
    game.pendingOption = null
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

  function pickOption(value) {
    game.pendingOption = value
  }

  function cancelUse() {
    game.pendingConsumable = null
    game.pendingSuit = null
    game.pendingOption = null
    cardSystem.clearSelection()
  }

  // 统一获取 pending 消耗品信息（下标 + 定义），避免重复 indexOf
  function getPendingInfo() {
    if (game.pendingConsumable === null) return null
    const idx = game.consumables.indexOf(game.pendingConsumable)
    if (idx < 0) return null
    const cons = game.consumables[idx]
    return { idx, cons, def: getConsumableDef(cons.type, cons.id) }
  }

  // 确认使用消耗品（塔罗/礼券选牌流程）
  function confirmUse() {
    const info = getPendingInfo()
    if (!info) {
      game.pendingConsumable = null
      game.pendingSuit = null
      game.pendingOption = null
      return false
    }
    const { idx, cons, def } = info
    if (!def) return false

    const selectedCards = cardSystem.getSelectedCards()
    if (selectedCards.length < def.selectCount) return { error: `需要选择 ${def.selectCount} 张手牌` }

    const result = def.use(game, selectedCards)

    if (result === 'destroy') {
      if (selectedCards[0]) cardSystem.removeCardById(selectedCards[0].id)
    } else if (result === 'choose_suit') {
      if (!game.pendingSuit) return { error: '请先选择花色' }
      selectedCards[0].suit = game.pendingSuit
    } else if (result === 'choose_option') {
      if (game.pendingOption === null || game.pendingOption === undefined) return { error: '请先选择一个选项' }
      def.applyOption(selectedCards[0], game.pendingOption)
    } else if (result === false) {
      return { error: '选择的手牌数量不对' }
    }

    game.consumables.splice(idx, 1)
    game.pendingConsumable = null
    game.pendingSuit = null
    game.pendingOption = null
    cardSystem.clearSelection()
    SFX.useConsumable()
    bus.emit(EVENTS.CONSUMABLE_USED, { type: cons.type, id: cons.id })
    return { success: true, name: def.name, type: cons.type, handType: def.handType || null }
  }

  function getPendingDef() {
    return getPendingInfo()?.def ?? null
  }

  function isPending() {
    return game.pendingConsumable !== null
  }

  return {
    sellConsumable,
    startUse,
    pickSuit,
    pickOption,
    cancelUse,
    confirmUse,
    getPendingDef,
    isPending,
  }
}
