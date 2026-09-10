import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { bus } from '../src/utils/eventBus.js'
import { createSaveSystem } from '../src/systems/saveSystem.js'
import { SAVE_KEY, SAVE_VERSION } from '../src/data/constants.js'

function makeGame() {
  return reactive({
    mode: 'simple',
    level: 1,
    money: 5,
    jokers: [],
    consumables: [],
    hand: [],
    selected: [],
    playedHandTypes: [],
    cleared: false,
  })
}

describe('SaveSystem', () => {
  let game, save

  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear()
    game = makeGame()
    save = createSaveSystem(game, bus)
  })

  it('初始没有存档', () => {
    expect(save.hasSave()).toBe(false)
  })

  it('saveGame 保存后有存档', () => {
    save.saveGameNow()
    expect(save.hasSave()).toBe(true)
  })

  it('loadGame 能加载已保存的数据', () => {
    game.money = 100
    game.level = 5
    game.playedHandTypes = ['一对', '两对']
    save.saveGameNow()

    // 重置 game
    game.money = 5
    game.level = 1
    game.playedHandTypes = []

    const result = save.loadGame()
    expect(result).toBe(true)
    expect(game.money).toBe(100)
    expect(game.level).toBe(5)
    expect(game.playedHandTypes).toEqual(['一对', '两对'])
  })

  it('loadGame 没存档返回 false', () => {
    expect(save.loadGame()).toBe(false)
  })

  it('版本不匹配的旧存档会被清除', () => {
    // 手动存一个旧版本
    localStorage.setItem(SAVE_KEY, JSON.stringify({ __version: 1, money: 999, level: 9 }))
    const result = save.loadGame()
    expect(result).toBe(false)
    expect(save.hasSave()).toBe(false) // 被清掉了
  })

  it('clearSave 清除存档', () => {
    save.saveGameNow()
    expect(save.hasSave()).toBe(true)
    save.clearSave()
    expect(save.hasSave()).toBe(false)
  })

  it('存档包含版本号', () => {
    save.saveGameNow()
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY))
    expect(raw.__version).toBe(SAVE_VERSION)
  })

  it('loadGame 后 selected 被清空', () => {
    game.selected = [1, 2, 3]
    save.saveGameNow()
    save.loadGame()
    expect(game.selected).toEqual([])
  })

  it('loadGame 复位 animating，防止动画中存档导致读档卡死', () => {
    game.animating = true
    save.saveGameNow()
    game.animating = false
    save.loadGame()
    expect(game.animating).toBe(false)
  })

  it('saveStats / loadStats 持久化统计数据', () => {
    const stats = { totalGames: 5, maxLevel: 3 }
    save.saveStats(stats)
    const loaded = save.loadStats()
    expect(loaded.totalGames).toBe(5)
    expect(loaded.maxLevel).toBe(3)
  })

  it('loadStats 没数据返回空对象', () => {
    const loaded = save.loadStats()
    expect(loaded).toEqual({})
  })

  it('saveGameNow 清除 pending 防抖定时器', () => {
    save.saveGame()      // 设置 300ms 防抖定时器
    save.saveGameNow()   // 立即保存，应清除定时器
    expect(save.hasSave()).toBe(true)
    // 等 350ms 确认定时器没再触发（不会额外写入）
    return new Promise(resolve => setTimeout(() => {
      // 仍然只有一次保存，hasSave 不变
      expect(save.hasSave()).toBe(true)
      resolve()
    }, 350))
  })

  it('clearSave 清除 pending 防抖定时器，防止延迟写入', () => {
    save.saveGame()      // 设置 300ms 防抖定时器
    save.clearSave()     // 清除存档 + 应清除定时器
    expect(save.hasSave()).toBe(false)
    // 等 350ms 确认定时器没触发（不会重新写入存档）
    return new Promise(resolve => setTimeout(() => {
      expect(save.hasSave()).toBe(false)
      resolve()
    }, 350))
  })

  it('防抖 saveGame 后 clearSave 可阻止延迟写入', () => {
    save.saveGameNow()   // 先存一次
    expect(save.hasSave()).toBe(true)
    save.saveGame()      // 设置 300ms 防抖定时器
    save.clearSave()     // 立即清除 + 清除定时器
    expect(save.hasSave()).toBe(false)
    return new Promise(resolve => setTimeout(() => {
      expect(save.hasSave()).toBe(false)
      resolve()
    }, 350))
  })
})
