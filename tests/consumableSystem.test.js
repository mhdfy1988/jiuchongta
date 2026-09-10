import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { bus } from '../src/utils/eventBus.js'
import { createConsumableSystem } from '../src/systems/consumableSystem.js'
import { createCardSystem } from '../src/systems/cardSystem.js'

function makeGame() {
  return reactive({
    consumables: [],
    money: 10,
    hand: [],
    selected: [],
    deck: [],
    handUpgrades: {},
    pendingConsumable: null,
    pendingSuit: null,
    pendingOption: null,
    playBuff: null,
  })
}

describe('ConsumableSystem', () => {
  let game, cons, cards

  beforeEach(() => {
    game = makeGame()
    cards = createCardSystem(game, bus)
    cons = createConsumableSystem(game, bus, cards)
  })

  it('sellConsumable 卖出获得半价（至少1）', () => {
    game.consumables.push({ id: 'the_fool', type: 'tarot' }) // cost 3
    const price = cons.sellConsumable(0)
    expect(price).toBe(1) // floor(3/2) = 1
    expect(game.money).toBe(11)
    expect(game.consumables.length).toBe(0)
  })

  it('sellConsumable 越界返回 false', () => {
    expect(cons.sellConsumable(0)).toBe(false)
  })

  it('startUse 星球牌直接生效', () => {
    game.consumables.push({ id: 'mars', type: 'planet' })
    const result = cons.startUse(0)
    expect(result).toBe('applied')
    expect(game.consumables.length).toBe(0)
    expect(game.handUpgrades['顺子']).toBeTruthy()
    expect(game.handUpgrades['顺子'].chips).toBe(3)
  })

  it('startUse 塔罗牌进入选择状态', () => {
    cards.initDeck()
    cards.draw(8)
    game.consumables.push({ id: 'the_fool', type: 'tarot' })
    const result = cons.startUse(0)
    expect(result).toBe('selecting')
    expect(game.pendingConsumable).toBe(game.consumables[0])
    expect(game.consumables.length).toBe(1) // 还没消耗
  })

  it('startUse 无效索引返回 false', () => {
    expect(cons.startUse(99)).toBe(false)
  })

  it('cancelUse 取消选择', () => {
    game.pendingConsumable = 0
    game.pendingSuit = '♠'
    cons.cancelUse()
    expect(game.pendingConsumable).toBeNull()
    expect(game.pendingSuit).toBeNull()
  })

  it('pickSuit 设置待选花色', () => {
    cons.pickSuit('♥')
    expect(game.pendingSuit).toBe('♥')
  })

  it('isPending 判断是否有进行中的消耗品', () => {
    expect(cons.isPending()).toBe(false)
    game.pendingConsumable = 0
    expect(cons.isPending()).toBe(true)
  })

  it('getPendingDef 返回当前消耗品定义', () => {
    expect(cons.getPendingDef()).toBeNull()
    game.consumables.push({ id: 'the_fool', type: 'tarot' })
    game.pendingConsumable = game.consumables[0]
    const def = cons.getPendingDef()
    expect(def).not.toBeNull()
    expect(def.id).toBe('the_fool')
  })

  it('confirmUse 没选够牌返回错误', () => {
    cards.initDeck()
    cards.draw(8)
    game.consumables.push({ id: 'the_fool', type: 'tarot' })
    game.pendingConsumable = game.consumables[0]
    const result = cons.confirmUse()
    expect(result.error).toBeTruthy()
  })

  it('mars 星球牌加顺子 chips', () => {
    game.consumables.push({ id: 'mars', type: 'planet' })
    cons.startUse(0)
    expect(game.handUpgrades['顺子'].chips).toBe(3)
    expect(game.handUpgrades['顺子'].mult).toBe(0)
  })

  it('earth 星球牌加三条 mult 2', () => {
    game.consumables.push({ id: 'earth', type: 'planet' })
    cons.startUse(0)
    expect(game.handUpgrades['三条'].mult).toBe(2)
  })

  it('pluto 星球牌加高牌 chips+mult', () => {
    game.consumables.push({ id: 'pluto', type: 'planet' })
    cons.startUse(0)
    expect(game.handUpgrades['高牌'].chips).toBe(2)
    expect(game.handUpgrades['高牌'].mult).toBe(1)
  })

  it('confirmUse 塔罗牌成功使用后消耗', () => {
    cards.initDeck()
    cards.draw(8)
    game.consumables.push({ id: 'the_fool', type: 'tarot' })
    game.pendingConsumable = game.consumables[0]
    // 选一张牌
    cards.selectCard(game.hand[0].id)
    const result = cons.confirmUse()
    expect(result.success).toBe(true)
    expect(game.consumables.length).toBe(0)
    expect(game.pendingConsumable).toBeNull()
  })

  // ===== 礼券牌测试 =====

  it('startUse 即时礼券（小费）叠加 playBuff 后消耗', () => {
    game.consumables.push({ id: 'tip', type: 'voucher' })
    const result = cons.startUse(0)
    expect(result).toBe('applied')
    expect(game.consumables.length).toBe(0)
    expect(game.playBuff.chips).toBe(500)
    expect(game.playBuff.mult).toBe(0)
    expect(game.playBuff.finalMult).toBe(1)
  })

  it('startUse 即时礼券（掌声）叠加 playBuff', () => {
    game.consumables.push({ id: 'applause', type: 'voucher' })
    cons.startUse(0)
    expect(game.playBuff.mult).toBe(10)
  })

  it('startUse 加倍券 finalMult=2', () => {
    game.consumables.push({ id: 'double_coupon', type: 'voucher' })
    cons.startUse(0)
    expect(game.playBuff.finalMult).toBe(2)
  })

  it('多次即时礼券叠加（小费+掌声+加倍券）', () => {
    game.consumables.push({ id: 'tip', type: 'voucher' })
    game.consumables.push({ id: 'applause', type: 'voucher' })
    game.consumables.push({ id: 'double_coupon', type: 'voucher' })
    cons.startUse(0) // 小费
    cons.startUse(0) // 掌声（下标因消耗自动前移）
    cons.startUse(0) // 加倍券
    expect(game.playBuff.chips).toBe(500)
    expect(game.playBuff.mult).toBe(10)
    expect(game.playBuff.finalMult).toBe(2)
  })

  it('startUse 升降机进入选牌状态', () => {
    game.consumables.push({ id: 'elevator', type: 'voucher' })
    const result = cons.startUse(0)
    expect(result).toBe('selecting')
    expect(game.pendingConsumable).not.toBeNull()
    expect(game.pendingOption).toBeNull()
  })

  it('confirmUse 升降机 +1 点数', () => {
    cards.initDeck()
    cards.draw(8)
    game.consumables.push({ id: 'elevator', type: 'voucher' })
    cons.startUse(0)
    cards.selectCard(game.hand[0].id)
    cons.pickOption(1) // +1
    const result = cons.confirmUse()
    expect(result.success).toBe(true)
    expect(game.consumables.length).toBe(0)
    expect(game.pendingConsumable).toBeNull()
    expect(game.pendingOption).toBeNull()
  })

  it('confirmUse 升降机未选选项报错', () => {
    cards.initDeck()
    cards.draw(8)
    game.consumables.push({ id: 'elevator', type: 'voucher' })
    cons.startUse(0)
    cards.selectCard(game.hand[0].id)
    const result = cons.confirmUse()
    expect(result.error).toBeTruthy()
  })

  it('confirmUse 变装券改变点数', () => {
    cards.initDeck()
    cards.draw(8)
    const originalRank = game.hand[0].rank
    game.consumables.push({ id: 'disguise', type: 'voucher' })
    cons.startUse(0)
    cards.selectCard(game.hand[0].id)
    cons.pickOption('A')
    const result = cons.confirmUse()
    expect(result.success).toBe(true)
    expect(game.hand[0].rank).toBe('A')
    expect(game.hand[0].rank).not.toBe(originalRank)
  })

  it('pickOption 设置 pendingOption', () => {
    cons.pickOption('K')
    expect(game.pendingOption).toBe('K')
  })

  it('cancelUse 清除 pendingOption', () => {
    game.pendingOption = 'A'
    cons.cancelUse()
    expect(game.pendingOption).toBeNull()
  })

  it('sellConsumable 礼券牌卖出', () => {
    game.consumables.push({ id: 'tip', type: 'voucher' }) // cost 3
    const price = cons.sellConsumable(0)
    expect(price).toBe(1)
    expect(game.consumables.length).toBe(0)
  })
})
