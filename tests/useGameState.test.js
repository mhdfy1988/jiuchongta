import { describe, it, expect, beforeEach } from 'vitest'
import { reactive, ref } from 'vue'
import { bus, EVENTS } from '../src/utils/eventBus.js'
import { createCardSystem } from '../src/systems/cardSystem.js'
import { createBossSystem } from '../src/systems/bossSystem.js'
import { createLevelSystem } from '../src/systems/levelSystem.js'
import { createJokerSystem } from '../src/systems/jokerSystem.js'
import { createScoringSystem } from '../src/systems/scoringSystem.js'
import { shuffle, createDeck, drawCards } from '../src/utils/cardUtils.js'

function makeGame() {
  return reactive({
    mode: 'simple', character: null, level: 1,
    deck: [], hand: [], selected: [], jokers: [],
    money: 5, handsLeft: 4, discardsLeft: 4, handSize: 8,
    levelScore: 0, targetScore: 300,
    bossDebuff: null, silencedJoker: null,
    handTypeCounts: {}, cardEnhancements: {},
    lockedHandType: null, playedHandTypes: [],
    rerollCount: 0, levelStartMoney: 5, lives: 0,
    totalScore: 0, maxSingleScore: 0,
    animating: false, consumables: [], handUpgrades: {},
    pendingConsumable: null, pendingSuit: null, lastPlayedHand: null,
    calledOutId: null, cleared: false,
  })
}

describe('CardSystem - 选中状态基于 id', () => {
  let game, cards

  beforeEach(() => {
    game = makeGame()
    cards = createCardSystem(game, bus)
    cards.initDeck()
    cards.draw(8)
  })

  it('选中一张牌，selected 里存的是 id', () => {
    const card = game.hand[0]
    cards.selectCard(card.id)
    expect(game.selected).toContain(card.id)
    expect(typeof game.selected[0]).toBe('number')
  })

  it('再次点击取消选中', () => {
    const card = game.hand[0]
    cards.selectCard(card.id)
    cards.selectCard(card.id)
    expect(game.selected).not.toContain(card.id)
  })

  it('最多选5张', () => {
    for (let i = 0; i < 8; i++) cards.selectCard(game.hand[i].id)
    expect(game.selected.length).toBe(5)
  })

  it('getSelectedCards 返回牌对象数组', () => {
    cards.selectCard(game.hand[0].id)
    cards.selectCard(game.hand[2].id)
    const selected = cards.getSelectedCards()
    expect(selected.length).toBe(2)
    expect(selected[0].rank).toBe(game.hand[0].rank)
  })

  it('排序后选中牌跟随移动（id 制）', () => {
    const card = game.hand[3]
    cards.selectCard(card.id)
    cards.sortByRank()
    // 选中的 id 还在 selected 里
    expect(game.selected).toContain(card.id)
    // 牌在 hand 里的位置变了，但 id 不变
    const newIdx = game.hand.findIndex(c => c.id === card.id)
    expect(newIdx).not.toBe(3) // 位置变了
    expect(cards.isSelected(card.id)).toBe(true) // 选中状态跟随
  })

  it('removeSelected 移除选中的牌', () => {
    cards.selectCard(game.hand[0].id)
    cards.selectCard(game.hand[1].id)
    const removed = cards.removeSelected()
    expect(removed.length).toBe(2)
    expect(game.selected.length).toBe(0)
    expect(game.hand.length).toBe(6)
  })

  it('clearSelection 清空选中', () => {
    cards.selectCard(game.hand[0].id)
    cards.clearSelection()
    expect(game.selected.length).toBe(0)
  })
})

describe('BossSystem - 点名机制', () => {
  let game, boss, cards

  beforeEach(() => {
    game = makeGame()
    cards = createCardSystem(game, bus)
    boss = createBossSystem(game, bus)
    cards.initDeck()
    cards.draw(8)
    game.bossDebuff = { id: 'called_out' }
  })

  it('rollCalledOut 会把 calledOutId 设为某张手牌的 id', () => {
    boss.rollCalledOut()
    expect(game.calledOutId).not.toBeNull()
    const card = game.hand.find(c => c.id === game.calledOutId)
    expect(card).toBeDefined()
  })

  it('checkCalledOut 选中包含点名牌 → 通过', () => {
    boss.rollCalledOut()
    game.selected = [game.calledOutId]
    const blocked = boss.checkCalledOut()
    expect(blocked).toBe(false)
  })

  it('checkCalledOut 没选点名牌 → 被阻止', () => {
    boss.rollCalledOut()
    // 选一张不是点名的牌
    const otherCard = game.hand.find(c => c.id !== game.calledOutId)
    game.selected = [otherCard.id]
    const blocked = boss.checkCalledOut()
    expect(typeof blocked).toBe('string')
    expect(blocked).toContain('点名')
  })

  it('排序后点名仍指向同一张牌（id 制）', () => {
    boss.rollCalledOut()
    const calledCardId = game.calledOutId
    cards.sortByRank()
    // id 没变
    expect(game.calledOutId).toBe(calledCardId)
    // 牌还在手牌里
    expect(game.hand.some(c => c.id === calledCardId)).toBe(true)
  })
})

describe('BossSystem - 各 Boss 效果', () => {
  let game, boss

  beforeEach(() => {
    game = makeGame()
    boss = createBossSystem(game, bus)
  })

  it('shackles 手牌上限减为7', () => {
    game.bossDebuff = { id: 'shackles' }
    boss.applyEffects()
    expect(game.handSize).toBe(7)
  })

  it('no_discard 弃牌次数为0', () => {
    game.bossDebuff = { id: 'no_discard' }
    boss.applyEffects()
    expect(game.discardsLeft).toBe(0)
  })

  it('pinhole 出牌次数为1', () => {
    game.bossDebuff = { id: 'pinhole' }
    boss.applyEffects()
    expect(game.handsLeft).toBe(1)
  })

  it('high_wall 目标分乘1.5（scaleTarget=true 时）', () => {
    const original = game.targetScore
    game.bossDebuff = { id: 'high_wall' }
    boss.applyEffects({ scaleTarget: true })
    expect(game.targetScore).toBe(Math.floor(original * 1.5))
  })

  it('high_wall 复活时不重复乘目标分', () => {
    const original = game.targetScore
    game.bossDebuff = { id: 'high_wall' }
    boss.applyEffects({ scaleTarget: true })
    const afterFirst = game.targetScore
    // 模拟复活重应用
    boss.reapplyForRevive()
    expect(game.targetScore).toBe(afterFirst) // 没变
    expect(game.targetScore).toBe(Math.floor(original * 1.5)) // 还是只乘了一次
  })

  it('only_one 限制只能打一种牌型', () => {
    game.bossDebuff = { id: 'only_one' }
    boss.applyEffects()
    // 第一次打一对
    const r1 = boss.validatePlay('一对')
    expect(r1).toBe(false)
    boss.recordPlayed('一对')
    // 再打顺子被阻止
    const r2 = boss.validatePlay('顺子')
    expect(typeof r2).toBe('string')
  })

  it('no_repeat 不允许重复牌型', () => {
    game.bossDebuff = { id: 'no_repeat' }
    boss.applyEffects()
    boss.recordPlayed('一对')
    const blocked = boss.validatePlay('一对')
    expect(typeof blocked).toBe('string')
  })

  it('lockdown 禁用指定牌型', () => {
    game.bossDebuff = { id: 'lockdown', disabledHand: '顺子' }
    const blocked = boss.validatePlay('顺子')
    expect(typeof blocked).toBe('string')
    const ok = boss.validatePlay('一对')
    expect(ok).toBe(false)
  })

  it('ocd 必须打5张', () => {
    game.bossDebuff = { id: 'ocd' }
    game.selected = [1, 2, 3] // 只有3张
    const blocked = boss.validatePlay('高牌')
    expect(typeof blocked).toBe('string')
  })
})

describe('LevelSystem - 关卡推进', () => {
  let game, level

  beforeEach(() => {
    game = makeGame()
    level = createLevelSystem(game, bus)
  })

  it('startRun 初始化正确', () => {
    level.startRun('hard', 'default')
    expect(game.mode).toBe('hard')
    expect(game.level).toBe(1)
    expect(game.handsLeft).toBe(4)
    expect(game.discardsLeft).toBe(4)
    expect(game.cleared).toBe(false)
  })

  it('简单模式有1条命', () => {
    level.startRun('simple', 'default')
    expect(game.lives).toBe(1)
  })

  it('困难模式没有复活', () => {
    level.startRun('hard', 'default')
    expect(game.lives).toBe(0)
  })

  it('recordScore 累加分数', () => {
    level.recordScore({ total: 100, type: '一对', chips: 10, mult: 2, scoringCards: [], breakdown: [] })
    expect(game.levelScore).toBe(100)
    expect(game.totalScore).toBe(100)
    expect(game.handsLeft).toBe(3)
  })

  it('达到目标分 afterPlayCheck 返回 win', () => {
    game.targetScore = 100
    game.levelScore = 150
    const result = level.afterPlayCheck()
    expect(result).toBe('win')
  })

  it('没出牌次数了 afterPlayCheck 返回 lose', () => {
    game.handsLeft = 0
    game.levelScore = 0
    game.targetScore = 100
    const result = level.afterPlayCheck()
    expect(result).toBe('lose')
  })

  it('还有次数且没达标 → continue', () => {
    game.handsLeft = 2
    game.levelScore = 50
    game.targetScore = 100
    const result = level.afterPlayCheck()
    expect(result).toBe('continue')
  })

  it('loseLevel 有生命时复活', () => {
    game.lives = 1
    const revived = level.loseLevel()
    expect(revived).toBe(true)
    expect(game.lives).toBe(0)
  })

  it('loseLevel 没生命时游戏结束', () => {
    game.lives = 0
    const revived = level.loseLevel()
    expect(revived).toBe(false)
  })

  it('通关判定：非无尽模式 level >= 9 时 nextLevel 触发 gameClear', () => {
    game.mode = 'hard'
    game.level = 9
    const continued = level.nextLevel()
    expect(continued).toBe(false)
    expect(game.cleared).toBe(true)
  })
})

describe('JokerSystem', () => {
  let game, jokers

  beforeEach(() => {
    game = makeGame()
    jokers = createJokerSystem(game, bus)
  })

  it('addJoker 添加小丑', () => {
    const ok = jokers.addJoker('joker')
    expect(ok).toBe(true)
    expect(game.jokers.length).toBe(1)
    expect(game.jokers[0].id).toBe('joker')
  })

  it('最多6张小丑', () => {
    for (let i = 0; i < 6; i++) jokers.addJoker('joker')
    const ok = jokers.addJoker('joker')
    expect(ok).toBe(false)
    expect(game.jokers.length).toBe(6)
  })

  it('sellJoker 卖出并返还半价', () => {
    jokers.addJoker('joker')
    const before = game.money
    const price = jokers.sellJoker(0)
    expect(price).toBeGreaterThan(0)
    expect(game.money).toBe(before + price)
    expect(game.jokers.length).toBe(0)
  })

  it('locked 的小丑不能卖', () => {
    jokers.addJoker('joker', { locked: true })
    const price = jokers.sellJoker(0)
    expect(price).toBe(false)
    expect(game.jokers.length).toBe(1)
  })
})
