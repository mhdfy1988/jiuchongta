import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive } from 'vue'
import { bus } from '../src/utils/eventBus.js'
import { createLevelSystem } from '../src/systems/levelSystem.js'

function makeGame() {
  return reactive({
    mode: 'simple',
    level: 1,
    levelScore: 0,
    targetScore: 300,
    handsLeft: 4,
    discardsLeft: 4,
    handSize: 8,
    lives: 0,
    money: 5,
    totalScore: 0,
    maxSingleScore: 0,
    lastPlayedHand: null,
    cleared: false,
    animating: false,
    levelStartMoney: 5,
    bossDebuff: null,
  })
}

describe('LevelSystem', () => {
  let game, level

  beforeEach(() => {
    game = makeGame()
    level = createLevelSystem(game, bus)
  })

  it('startRun 初始化简单模式', () => {
    level.startRun('simple', null)
    expect(game.mode).toBe('simple')
    expect(game.level).toBe(1)
    expect(game.levelScore).toBe(0)
    expect(game.targetScore).toBe(200)
    expect(game.handsLeft).toBe(4)
    expect(game.discardsLeft).toBe(4)
    expect(game.handSize).toBe(8)
    expect(game.lives).toBe(1) // simple 模式 1 条命
    expect(game.cleared).toBe(false)
  })

  it('startRun 困难模式没有额外生命', () => {
    level.startRun('hard', null)
    expect(game.lives).toBe(0)
  })

  it('recordScore 记录分数', () => {
    level.startRun('simple', null)
    const result = {
      total: 150,
      type: '一对',
      chips: 20,
      mult: 5,
      scoringCards: [{ rank: 'A', suit: '♠' }, { rank: 'A', suit: '♥' }],
      breakdown: [],
    }
    level.recordScore(result)
    expect(game.handsLeft).toBe(3)
    expect(game.levelScore).toBe(150)
    expect(game.totalScore).toBe(150)
    expect(game.maxSingleScore).toBe(150)
    expect(game.lastPlayedHand.type).toBe('一对')
  })

  it('maxSingleScore 记录最高单次得分', () => {
    level.startRun('simple', null)
    level.recordScore({ total: 100, type:'一对', chips:10, mult:5, scoringCards:[], breakdown:[] })
    level.recordScore({ total: 300, type:'两对', chips:30, mult:5, scoringCards:[], breakdown:[] })
    level.recordScore({ total: 200, type:'三条', chips:20, mult:5, scoringCards:[], breakdown:[] })
    expect(game.maxSingleScore).toBe(300)
  })

  it('afterPlayCheck 达标返回 win', () => {
    game.levelScore = 350
    game.targetScore = 300
    expect(level.afterPlayCheck()).toBe('win')
  })

  it('afterPlayCheck 没牌出了返回 lose', () => {
    game.levelScore = 100
    game.targetScore = 300
    game.handsLeft = 0
    expect(level.afterPlayCheck()).toBe('lose')
  })

  it('afterPlayCheck 继续', () => {
    game.levelScore = 100
    game.targetScore = 300
    game.handsLeft = 3
    expect(level.afterPlayCheck()).toBe('continue')
  })

  it('winLevel 普通层给钱奖励', () => {
    level.startRun('simple', null)
    game.levelScore = 600 // 超过 2 倍 = 5元
    game.handsLeft = 2
    game.levelStartMoney = 10
    const moneyBefore = game.money
    level.winLevel()
    // 奖励 = 5(超倍) + 2(剩余出牌) + 2(利息 10*0.2) = 9
    expect(game.money).toBe(moneyBefore + 9)
  })

  it('nextLevel 推进到下一层', () => {
    level.startRun('simple', null)
    const result = level.nextLevel()
    expect(result).toBe(true)
    expect(game.level).toBe(2)
    expect(game.levelScore).toBe(0)
    expect(game.handsLeft).toBe(4)
    expect(game.discardsLeft).toBe(4)
  })

  it('nextLevel 第 9 层后普通模式通关', () => {
    game.level = 9
    game.mode = 'simple'
    const result = level.nextLevel()
    expect(result).toBe(false)
    expect(game.cleared).toBe(true)
  })

  it('nextLevel 无尽模式不会通关', () => {
    game.level = 9
    game.mode = 'endless'
    const result = level.nextLevel()
    expect(result).toBe(true)
    expect(game.level).toBe(10)
    expect(game.cleared).toBe(false)
  })

  it('loseLevel 有命就复活', () => {
    game.lives = 1
    game.levelScore = 200
    const result = level.loseLevel()
    expect(result).toBe(true)
    expect(game.lives).toBe(0)
    expect(game.levelScore).toBe(0)
    expect(game.handsLeft).toBe(4)
    expect(game.discardsLeft).toBe(4)
  })

  it('loseLevel 没命就 game over', () => {
    game.lives = 0
    const result = level.loseLevel()
    expect(result).toBe(false)
  })

  it('gameClear 设置 cleared 标志', () => {
    level.gameClear()
    expect(game.cleared).toBe(true)
  })

  it('getEffectiveLevel 普通模式直接返回', () => {
    game.level = 5
    expect(level.getEffectiveLevel()).toBe(5)
  })

  it('getEffectiveLevel 无尽模式取模', () => {
    game.mode = 'endless'
    game.level = 10
    expect(level.getEffectiveLevel()).toBe(1)
    game.level = 12
    expect(level.getEffectiveLevel()).toBe(3)
    game.level = 18
    expect(level.getEffectiveLevel()).toBe(9)
  })

  it('isBossLevelNow 判断当前是否 Boss 层', () => {
    game.level = 1
    expect(level.isBossLevelNow()).toBe(false)
    game.level = 3
    expect(level.isBossLevelNow()).toBe(true)
    game.level = 6
    expect(level.isBossLevelNow()).toBe(true)
    game.level = 9
    expect(level.isBossLevelNow()).toBe(true)
  })
})
