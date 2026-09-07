import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { bus } from '../src/utils/eventBus.js'
import { createShopSystem } from '../src/systems/shopSystem.js'

function makeGame() {
  return reactive({
    jokers: [],
    consumables: [],
    money: 20,
    rerollCount: 0,
    bossDebuff: null,
  })
}

describe('ShopSystem', () => {
  let game, shop

  beforeEach(() => {
    game = makeGame()
    shop = createShopSystem(game, bus)
  })

  it('generate 普通层生成 2 个小丑', () => {
    shop.generate(false)
    expect(shop.items.value.length).toBe(2)
    shop.items.value.forEach(item => {
      expect(item.def.id).toBeTruthy()
      expect(item.sold).toBe(false)
    })
  })

  it('generate Boss 层生成 3 个小丑', () => {
    shop.generate(true)
    expect(shop.items.value.length).toBe(3)
  })

  it('generate 生成消耗品', () => {
    shop.generate(false)
    expect(shop.consumables.value.length).toBeGreaterThanOrEqual(1)
    expect(shop.consumables.value.length).toBeLessThanOrEqual(2)
    shop.consumables.value.forEach(c => {
      expect(['tarot', 'planet']).toContain(c.type)
      expect(c.def.id).toBeTruthy()
    })
  })

  it('generate 重置 rerollCount', () => {
    game.rerollCount = 3
    shop.generate(false)
    expect(game.rerollCount).toBe(0)
  })

  it('buyJoker 成功购买', () => {
    shop.generate(false)
    const item = shop.items.value[0]
    const cost = item.def.cost
    const moneyBefore = game.money
    const result = shop.buyJoker(0)
    expect(result).toBe(true)
    expect(game.money).toBe(moneyBefore - cost)
    expect(game.jokers.length).toBe(1)
    expect(item.sold).toBe(true)
  })

  it('buyJoker 钱不够失败', () => {
    shop.generate(false)
    game.money = 0
    const result = shop.buyJoker(0)
    expect(result).toBe(false)
    expect(game.jokers.length).toBe(0)
  })

  it('buyJoker 已卖出的不能再买', () => {
    shop.generate(false)
    shop.buyJoker(0)
    const result = shop.buyJoker(0)
    expect(result).toBe(false)
  })

  it('buyJoker 小丑满了不能买', () => {
    shop.generate(false)
    for (let i = 0; i < 6; i++) game.jokers.push({ id: 'joker', data: {} })
    const result = shop.buyJoker(0)
    expect(result).toBe(false)
  })

  it('buyJoker 越界返回 false', () => {
    shop.generate(false)
    expect(shop.buyJoker(99)).toBe(false)
  })

  it('buyConsumable 成功购买', () => {
    shop.generate(false)
    const item = shop.consumables.value[0]
    const cost = item.def.cost
    const moneyBefore = game.money
    const result = shop.buyConsumable(0)
    expect(result).toBe(true)
    expect(game.money).toBe(moneyBefore - cost)
    expect(game.consumables.length).toBe(1)
    expect(item.sold).toBe(true)
  })

  it('buyConsumable 满了不能买', () => {
    shop.generate(false)
    game.consumables.push({ id: 'fool', type: 'tarot' })
    game.consumables.push({ id: 'mars', type: 'planet' })
    const result = shop.buyConsumable(0)
    expect(result).toBe(false)
  })

  it('buyConsumable 钱不够失败', () => {
    shop.generate(false)
    game.money = 0
    const result = shop.buyConsumable(0)
    expect(result).toBe(false)
  })

  it('reroll 刷新商品', () => {
    shop.generate(false)
    const firstIds = shop.items.value.map(i => i.def.id)
    const moneyBefore = game.money
    const result = shop.reroll()
    expect(result).toBe(true)
    expect(game.money).toBe(moneyBefore - 1)
    expect(game.rerollCount).toBe(1)
    expect(shop.items.value.length).toBe(2)
  })

  it('reroll 每次涨价', () => {
    shop.generate(false)
    expect(shop.getRerollCost()).toBe(1)
    shop.reroll()
    expect(shop.getRerollCost()).toBe(2)
    shop.reroll()
    expect(shop.getRerollCost()).toBe(3)
  })

  it('reroll 钱不够失败', () => {
    shop.generate(false)
    game.money = 0
    const result = shop.reroll()
    expect(result).toBe(false)
    expect(game.rerollCount).toBe(0)
  })

  it('Boss 层第一件必是 epic+', () => {
    // 这个有随机性，但可以验证第一件的稀有度在 epic/legend 里
    shop.generate(true)
    const first = shop.items.value[0]
    expect(['epic', 'legend']).toContain(first.def.rarity)
  })
})
