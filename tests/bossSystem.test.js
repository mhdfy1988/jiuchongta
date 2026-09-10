import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive } from 'vue'
import { bus } from '../src/utils/eventBus.js'
import { createBossSystem } from '../src/systems/bossSystem.js'
import { createCardSystem } from '../src/systems/cardSystem.js'

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

describe('BossSystem', () => {
  let game, boss, cards

  beforeEach(() => {
    game = makeGame()
    cards = createCardSystem(game, bus)
    boss = createBossSystem(game, bus)
    cards.initDeck()
    cards.draw(8)
  })

  it('非 Boss 层 pickBoss 不生成 debuff', () => {
    game.level = 1
    boss.pickBoss()
    expect(game.bossDebuff).toBeNull()
  })

  it('Boss 层 pickBoss 生成 debuff', () => {
    game.level = 3
    boss.pickBoss()
    expect(game.bossDebuff).not.toBeNull()
    expect(game.bossDebuff.id).toBeTruthy()
  })

  it('shackles 减少手牌上限到 7', () => {
    game.bossDebuff = { id: 'shackles', name: '枷锁' }
    boss.applyEffects()
    expect(game.handSize).toBe(7)
  })

  it('no_discard 弃牌数归零', () => {
    game.bossDebuff = { id: 'no_discard', name: '禁止弃牌' }
    boss.applyEffects()
    expect(game.discardsLeft).toBe(0)
  })

  it('pinhole 出牌次数变 1', () => {
    game.bossDebuff = { id: 'pinhole', name: '针孔' }
    boss.applyEffects()
    expect(game.handsLeft).toBe(1)
  })

  it('high_wall 目标分 x1.5', () => {
    game.targetScore = 300
    game.bossDebuff = { id: 'high_wall', name: '高墙' }
    boss.applyEffects()
    expect(game.targetScore).toBe(450)
  })

  it('high_wall 复活时不重复乘目标分', () => {
    game.targetScore = 300
    game.bossDebuff = { id: 'high_wall', name: '高墙' }
    boss.applyEffects({ scaleTarget: false })
    expect(game.targetScore).toBe(300)
  })

  it('color_cut 随机禁用一种花色', () => {
    game.bossDebuff = { id: 'color_cut', name: '颜色切割' }
    boss.applyEffects()
    expect(['♠','♥','♦','♣']).toContain(game.bossDebuff.disabledSuit)
  })

  it('lockdown 随机禁用一种牌型', () => {
    game.bossDebuff = { id: 'lockdown', name: '封锁' }
    boss.applyEffects()
    expect(game.bossDebuff.disabledHand).toBeTruthy()
  })

  it('silence 随机沉默一个小丑', () => {
    game.jokers.push({ id: 'joker_1', data: {} })
    game.jokers.push({ id: 'joker_2', data: { locked: true } })
    game.bossDebuff = { id: 'silence', name: '沉默' }
    boss.applyEffects()
    expect(game.silencedJoker).not.toBeNull()
    expect(game.silencedJoker.data?.locked).not.toBe(true)
  })

  it('called_out 随机点一张手牌', () => {
    game.bossDebuff = { id: 'called_out', name: '点名' }
    boss.applyEffects()
    expect(game.calledOutId).not.toBeNull()
    expect(game.hand.some(c => c.id === game.calledOutId)).toBe(true)
  })

  it('点名没选点名牌会被阻止', () => {
    game.bossDebuff = { id: 'called_out', name: '点名' }
    game.calledOutId = game.hand[0].id
    cards.selectCard(game.hand[1].id) // 选了别的
    const result = boss.validatePlay('一对')
    expect(result).toContain('点名')
  })

  it('点名选了点名牌通过', () => {
    game.bossDebuff = { id: 'called_out', name: '点名' }
    game.calledOutId = game.hand[0].id
    cards.selectCard(game.hand[0].id)
    const result = boss.checkCalledOut()
    expect(result).toBe(false)
  })

  it('only_one 锁定首次牌型', () => {
    game.bossDebuff = { id: 'only_one', name: '唯一' }
    expect(boss.validatePlay('一对')).toBe(false)
    expect(game.lockedHandType).toBe('一对')
    expect(boss.validatePlay('两对')).toContain('只能打一对')
  })

  it('no_repeat 不拦截出牌,改为重复牌型不计分(在计分系统处理)', () => {
    game.bossDebuff = { id: 'no_repeat', name: '不许重复' }
    boss.recordPlayed('一对')
    // validatePlay 不再拦截
    expect(boss.validatePlay('一对')).toBe(false)
    expect(boss.validatePlay('两对')).toBe(false)
  })

  it('lockdown 禁用牌型被阻止', () => {
    game.bossDebuff = { id: 'lockdown', name: '封锁', disabledHand: '一对' }
    expect(boss.validatePlay('一对')).toContain('禁用')
    expect(boss.validatePlay('两对')).toContain('禁用') // 一对禁用=两对也禁用
  })

  it('ocd 必须打 5 张', () => {
    game.bossDebuff = { id: 'ocd', name: '强迫症' }
    game.selected = [1, 2, 3] // 3张
    expect(boss.validatePlay('一对')).toContain('5张')
    game.selected = [1, 2, 3, 4, 5]
    expect(boss.validatePlay('一对')).toBe(false)
  })

  it('recordPlayed 记录牌型', () => {
    boss.recordPlayed('一对')
    boss.recordPlayed('一对')
    expect(game.handTypeCounts['一对']).toBe(2)
    expect(game.playedHandTypes).toEqual(['一对', '一对'])
  })

  it('resetForNewLevel 清空所有 boss 状态', () => {
    game.bossDebuff = { id: 'shackles' }
    game.silencedJoker = {}
    game.lockedHandType = '一对'
    game.playedHandTypes = ['一对']
    game.calledOutId = 1
    boss.resetForNewLevel()
    expect(game.bossDebuff).toBeNull()
    expect(game.silencedJoker).toBeNull()
    expect(game.lockedHandType).toBeNull()
    expect(game.playedHandTypes).toEqual([])
    expect(game.calledOutId).toBeNull()
  })

  it('reapplyForRevive 重置状态但保留 boss', () => {
    game.bossDebuff = { id: 'called_out', name: '点名' }
    game.lockedHandType = '一对'
    game.playedHandTypes = ['一对']
    boss.reapplyForRevive()
    expect(game.bossDebuff).not.toBeNull()
    expect(game.lockedHandType).toBeNull()
    expect(game.playedHandTypes).toEqual([])
    expect(game.calledOutId).not.toBeNull()
  })

  it('isBoss 返回是否有 debuff', () => {
    expect(boss.isBoss()).toBe(false)
    game.bossDebuff = { id: 'shackles' }
    expect(boss.isBoss()).toBe(true)
  })

  it('getEffectiveLevel 普通模式直接返回 level', () => {
    game.mode = 'simple'
    game.level = 5
    expect(boss.getEffectiveLevel()).toBe(5)
  })

  it('getEffectiveLevel 无尽模式取模 9', () => {
    game.mode = 'endless'
    game.level = 10
    expect(boss.getEffectiveLevel()).toBe(1)
    game.level = 12
    expect(boss.getEffectiveLevel()).toBe(3)
  })

  it('点名牌不在手牌里会重 roll', () => {
    game.bossDebuff = { id: 'called_out', name: '点名' }
    game.calledOutId = 9999 // 不存在的 id
    boss.checkCalledOut()
    // 应该重 roll 到一个存在的 id
    expect(game.hand.some(c => c.id === game.calledOutId)).toBe(true)
  })

  it('low_wall 目标分 x1.25', () => {
    game.targetScore = 300
    game.bossDebuff = { id: 'low_wall', name: '矮墙' }
    boss.applyEffects()
    expect(game.targetScore).toBe(375)
  })

  it('low_wall 复活时不重复乘目标分', () => {
    game.targetScore = 300
    game.bossDebuff = { id: 'low_wall', name: '矮墙' }
    boss.applyEffects({ scaleTarget: false })
    expect(game.targetScore).toBe(300)
  })

  it('pillar recordPlayedCards 记录本层打出的牌（去重）', () => {
    game.bossDebuff = { id: 'pillar', name: '立柱' }
    game.playedCardsThisLevel = []
    boss.recordPlayedCards([{ rank: 'A', suit: '♠' }, { rank: 'K', suit: '♥' }])
    boss.recordPlayedCards([{ rank: 'A', suit: '♠' }, { rank: '5', suit: '♣' }])
    expect(game.playedCardsThisLevel).toEqual(['A♠', 'K♥', '5♣'])
  })

  it('pillar 非立柱 boss 不记录', () => {
    game.bossDebuff = { id: 'shackles' }
    game.playedCardsThisLevel = []
    boss.recordPlayedCards([{ rank: 'A', suit: '♠' }])
    expect(game.playedCardsThisLevel).toEqual([])
  })

  it('resetForNewLevel 清空立柱记录', () => {
    game.bossDebuff = { id: 'pillar' }
    game.playedCardsThisLevel = ['A♠']
    boss.resetForNewLevel()
    expect(game.playedCardsThisLevel).toEqual([])
  })

  it('reapplyForRevive 清空立柱记录', () => {
    game.bossDebuff = { id: 'pillar' }
    game.playedCardsThisLevel = ['A♠']
    boss.reapplyForRevive()
    expect(game.playedCardsThisLevel).toEqual([])
  })
})
