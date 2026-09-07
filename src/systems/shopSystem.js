import { ref } from 'vue'
import { bus, EVENTS } from '../utils/eventBus.js'
import { getJoker, JOKERS_BY_RARITY, getConsumableDef, TAROT_MAP, PLANET_MAP } from '../utils/gameData.js'
import { useAudio } from '../composables/useAudio.js'

const { SFX } = useAudio()

/**
 * 商店系统：商店物品生成、购买、刷新、卖出
 * 不直接放 game state，独立维护自己的响应式列表
 */
export function createShopSystem(game, bus) {
  const items = ref([])       // 小丑商品
  const consumables = ref([]) // 消耗品商品

  // ---------- 生成 ----------

  function generate(isBoss, { resetReroll = true } = {}) {
    if (resetReroll) game.rerollCount = 0
    const count = isBoss ? 3 : 2
    items.value = []
    for (let i = 0; i < count; i++) {
      items.value.push(generateJokerItem(isBoss, i === 0 && isBoss))
    }

    consumables.value = []
    const consCount = Math.random() < 0.5 ? 2 : 1
    for (let i = 0; i < consCount; i++) {
      if (Math.random() < 0.6) {
        const tArr = Array.from(TAROT_MAP.values())
        const t = tArr[Math.floor(Math.random() * tArr.length)]
        consumables.value.push({ def: { ...t }, type: 'tarot', sold: false })
      } else {
        const pArr = Array.from(PLANET_MAP.values())
        const p = pArr[Math.floor(Math.random() * pArr.length)]
        consumables.value.push({ def: { ...p }, type: 'planet', sold: false })
      }
    }
    bus.emit(EVENTS.SHOP_OPENED)
  }

  function generateJokerItem(isBoss, forceEpicPlus) {
    const rarityTable = isBoss
      ? [{r:'common',w:25},{r:'rare',w:35},{r:'epic',w:30},{r:'legend',w:10}]
      : [{r:'common',w:50},{r:'rare',w:30},{r:'epic',w:15},{r:'legend',w:5}]
    let rarity
    if (forceEpicPlus) rarity = Math.random() < 0.67 ? 'epic' : 'legend'
    else {
      const total = rarityTable.reduce((s, r) => s + r.w, 0)
      let roll = Math.random() * total
      for (const r of rarityTable) { roll -= r.w; if (roll <= 0) { rarity = r.r; break } }
    }
    const pool = JOKERS_BY_RARITY[rarity] || []
    const def = pool[Math.floor(Math.random() * pool.length)]
    return { def: { ...def }, sold: false }
  }

  // ---------- 购买 ----------

  function buyJoker(idx) {
    const item = items.value[idx]
    if (!item || item.sold) return false
    if (game.money < item.def.cost) return false
    if (game.jokers.length >= 6) return false
    game.money -= item.def.cost
    game.jokers.push({ id: item.def.id, data: { stacks: 0 } })
    item.sold = true
    SFX.buy()
    bus.emit(EVENTS.ITEM_BOUGHT, { type: 'joker', item })
    return true
  }

  function buyConsumable(idx) {
    const item = consumables.value[idx]
    if (!item || item.sold) return false
    if (game.money < item.def.cost) return false
    if (game.consumables.length >= 2) return false
    game.money -= item.def.cost
    game.consumables.push({ id: item.def.id, type: item.type })
    item.sold = true
    SFX.buy()
    bus.emit(EVENTS.ITEM_BOUGHT, { type: 'consumable', item })
    return true
  }

  // ---------- 刷新 ----------

  function reroll() {
    const cost = 1 + game.rerollCount
    if (game.money < cost) return false
    game.money -= cost
    game.rerollCount++
    const isBoss = !!game.bossDebuff
    generate(isBoss, { resetReroll: false })
    SFX.reroll()
    return true
  }

  function getRerollCost() {
    return 1 + game.rerollCount
  }

  return {
    items,
    consumables,
    generate,
    buyJoker,
    buyConsumable,
    reroll,
    getRerollCost,
  }
}
