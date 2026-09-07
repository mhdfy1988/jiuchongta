import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bus } from '../src/utils/eventBus.js'
import { useGameState } from '../src/composables/useGameState.js'

describe('useGameState 集成测试', () => {
  let state

  beforeEach(() => {
    bus.clear()
    localStorage.clear()
    vi.useFakeTimers()
    state = useGameState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------- 初始化 ----------

  it('初始状态在开始界面', () => {
    expect(state.screen.value).toBe('start')
    expect(state.showModal.value).toBeNull()
    expect(state.game.level).toBe(1)
  })

  it('选择模式和角色后可以开始游戏', () => {
    state.selectedMode.value = 'simple'
    state.selectedChar.value = null
    state.startGame()
    expect(state.screen.value).toBe('game')
    expect(state.game.mode).toBe('simple')
    expect(state.game.hand.length).toBe(8)
    expect(state.game.handsLeft).toBe(4)
    expect(state.game.discardsLeft).toBe(4)
  })

  // ---------- 选牌 ----------

  it('选牌：选中一张牌加入 selected', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const card = state.game.hand[0]
    state.selectCard(card.id)
    expect(state.game.selected).toContain(card.id)
  })

  it('选牌：最多选 5 张', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    for (let i = 0; i < 8; i++) {
      state.selectCard(state.game.hand[i].id)
    }
    expect(state.game.selected.length).toBe(5)
  })

  it('选牌：再次点击取消选中', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const card = state.game.hand[0]
    state.selectCard(card.id)
    state.selectCard(card.id)
    expect(state.game.selected).not.toContain(card.id)
  })

  // ---------- 出牌 ----------

  it('出牌：没选牌提示错误', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const before = state.toasts.value.length
    state.playHand()
    expect(state.toasts.value.length).toBeGreaterThan(before)
  })

  it('出牌：减少出牌次数并计分', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const handsBefore = state.game.handsLeft
    const scoreBefore = state.game.levelScore

    // 选 5 张牌确保能打出有效牌型
    for (let i = 0; i < 5; i++) {
      state.selectCard(state.game.hand[i].id)
    }
    state.playHand()

    // 动画期间:锁定操作,分数尚未入账
    expect(state.game.animating).toBe(true)
    expect(state.game.levelScore).toBe(scoreBefore)

    // 动画结束后才计分
    vi.advanceTimersByTime(4000)
    expect(state.game.handsLeft).toBe(handsBefore - 1)
    expect(state.game.levelScore).toBeGreaterThan(scoreBefore)
  })

  it('出牌后动画结束自动检查胜负', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    // 直接把分数设够，验证动画后触发胜利
    state.game.targetScore = 100
    state.game.levelScore = 150
    state.game.handsLeft = 1
    state.selectCard(state.game.hand[0].id)
    state.playHand()
    // 动画中
    expect(state.showModal.value).toBeNull()
    // 动画结束
    vi.advanceTimersByTime(4000)
    expect(state.showModal.value).toBe('levelcomplete')
  })

  // ---------- 弃牌 ----------

  it('弃牌：减少弃牌次数并补牌', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const discardsBefore = state.game.discardsLeft
    const handLenBefore = state.game.hand.length

    state.selectCard(state.game.hand[0].id)
    state.selectCard(state.game.hand[1].id)
    state.discardCards()

    expect(state.game.discardsLeft).toBe(discardsBefore - 1)
    expect(state.game.hand.length).toBe(handLenBefore) // 弃2补2
  })

  it('弃牌：没选牌提示', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const before = state.toasts.value.length
    state.discardCards()
    expect(state.toasts.value.length).toBeGreaterThan(before)
  })

  // ---------- 过关 & 下一层 ----------

  it('过关后进入商店', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    state.game.targetScore = 100
    state.game.levelScore = 200
    state.game.handsLeft = 1
    state.selectCard(state.game.hand[0].id)
    state.playHand()
    vi.advanceTimersByTime(4000)

    expect(state.showModal.value).toBe('levelcomplete')
    state.goToShop()
    expect(state.showModal.value).toBe('shop')
    expect(state.shopItems.value.length).toBeGreaterThan(0)
  })

  it('下一层：层数+1，状态重置', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const levelBefore = state.game.level
    state.nextLevel()
    expect(state.game.level).toBe(levelBefore + 1)
    expect(state.game.levelScore).toBe(0)
    expect(state.game.handsLeft).toBe(4)
    expect(state.game.discardsLeft).toBe(4)
  })

  // ---------- 商店 ----------

  it('商店：购买小丑', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    state.goToShop()
    const item = state.shopItems.value[0]
    const cost = item.def.cost
    const moneyBefore = state.game.money
    const jokerCountBefore = state.game.jokers.length

    if (moneyBefore >= cost) {
      state.buyShopItem(0)
      expect(state.game.money).toBe(moneyBefore - cost)
      expect(state.game.jokers.length).toBe(jokerCountBefore + 1)
      expect(item.sold).toBe(true)
    }
  })

  it('商店：刷新商品', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    state.goToShop()
    const firstIds = state.shopItems.value.map(i => i.def.id)
    state.rerollShop()
    // 刷新后数量一样但内容可能不同，rerollCount 增加
    expect(state.game.rerollCount).toBe(1)
    expect(state.shopItems.value.length).toBe(firstIds.length)
  })

  it('商店：卖出小丑', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    state.goToShop()
    // 先买一个（给足钱，避免商店随机出高价买不起）
    state.game.money = 999
    state.buyShopItem(0)
    const countBefore = state.game.jokers.length
    expect(countBefore).toBeGreaterThan(0)
    const moneyBefore = state.game.money
    state.sellJoker(0)
    expect(state.game.jokers.length).toBe(countBefore - 1)
    expect(state.game.money).toBeGreaterThan(moneyBefore)
  })

  // ---------- 存档 ----------

  it('存档：开始游戏后有存档', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    expect(state.hasSave()).toBe(true)
  })

  it('读档：继续游戏能恢复状态', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const level = state.game.level
    const money = state.game.money

    // 新建一个 state，模拟刷新页面
    const state2 = useGameState()
    const ok = state2.continueGame()
    expect(ok).toBe(true)
    expect(state2.screen.value).toBe('game')
    expect(state2.game.level).toBe(level)
    expect(state2.game.money).toBe(money)
  })

  // ---------- 排序 ----------

  it('排序：按点数排序', () => {
    state.selectedMode.value = 'simple'
    state.startGame()
    const before = [...state.game.hand.map(c => c.rank)]
    state.sortByRank()
    const after = state.game.hand.map(c => c.rank)
    expect(after).not.toEqual(before) // 顺序变了
  })

  // ---------- 失败 ----------

  it('失败：没出牌次数了游戏结束', () => {
    state.selectedMode.value = 'hard'
    state.startGame()
    state.game.targetScore = 99999
    state.game.handsLeft = 1
    state.game.levelScore = 0
    state.selectCard(state.game.hand[0].id)
    state.playHand()
    vi.advanceTimersByTime(4000)
    expect(state.showModal.value).toBe('gameover')
  })
})
