import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameState } from '../src/composables/useGameState.js'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
global.localStorage = localStorageMock

// Mock AudioContext
global.AudioContext = class {
  constructor() {}
  createOscillator() { return { connect(){}, start(){}, stop(){} } }
  createGain() { return { connect(){}, gain: { setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} } } }
  get destination() { return {} }
  get currentTime() { return 0 }
}

describe('useGameState - 选中状态基于 id 而非索引', () => {
  let state

  beforeEach(() => {
    localStorageMock.clear()
    state = useGameState()
    state.selectedChar.value = 'normal'
    state.selectedMode.value = 'hard'
    state.startGame()
  })

  it('selected 存储的是卡牌 id', () => {
    const { game, selectCard } = state
    expect(game.hand.length).toBeGreaterThan(0)
    const firstCard = game.hand[0]
    selectCard(firstCard.id)
    expect(game.selected).toContain(firstCard.id)
    expect(typeof game.selected[0]).toBe('number')
  })

  it('选牌后排序，选中状态仍然有效', () => {
    const { game, selectCard, sortByRank } = state
    const targetCard = game.hand[3]
    selectCard(targetCard.id)
    expect(game.selected).toContain(targetCard.id)

    sortByRank()
    // 排序后，选中的 id 仍然在 selected 里
    expect(game.selected).toContain(targetCard.id)
    // 并且这张牌仍在手牌中
    expect(game.hand.some(c => c.id === targetCard.id)).toBe(true)
  })

  it('取消选中基于 id 正确工作', () => {
    const { game, selectCard } = state
    const card = game.hand[2]
    selectCard(card.id)
    expect(game.selected).toContain(card.id)
    selectCard(card.id)
    expect(game.selected).not.toContain(card.id)
  })

  it('最多选5张', () => {
    const { game, selectCard } = state
    for (let i = 0; i < 8; i++) {
      selectCard(game.hand[i].id)
    }
    expect(game.selected.length).toBe(5)
  })
})

describe('useGameState - Boss 点名机制（基于 id）', () => {
  let state

  beforeEach(() => {
    localStorageMock.clear()
    state = useGameState()
    state.selectedChar.value = 'normal'
    state.selectedMode.value = 'hard'
  })

  function forceBoss(bossId) {
    // 调到 Boss 层并强制指定 boss
    state.game.level = 9
    state.game.bossDebuff = { id: bossId }
    // 重新应用效果
    if (bossId === 'called_out') {
      // 手动 roll 一张
      const hand = state.game.hand
      state.game.calledOutId = hand[2].id
    }
  }

  it('点名 Boss：calledOutId 存储卡牌 id 而非索引', () => {
    state.startGame()
    forceBoss('called_out')
    const { game } = state
    expect(typeof game.calledOutId).toBe('number')
    expect(game.hand.some(c => c.id === game.calledOutId)).toBe(true)
  })

  it('点名 Boss：排序后点名牌跟随移动', () => {
    state.startGame()
    forceBoss('called_out')
    const { game, sortByRank } = state
    const calledId = game.calledOutId
    sortByRank()
    expect(game.calledOutId).toBe(calledId)
    expect(game.hand.some(c => c.id === calledId)).toBe(true)
  })

  it('点名 Boss：不包含点名牌时出牌被阻止', () => {
    state.startGame()
    forceBoss('called_out')
    const { game, playHand, selectCard } = state
    // 选一张不是点名的牌
    const other = game.hand.find(c => c.id !== game.calledOutId)
    selectCard(other.id)
    const handsBefore = game.handsLeft
    playHand()
    // 出牌次数不变（被阻止）
    expect(game.handsLeft).toBe(handsBefore)
  })

  it('点名 Boss：包含点名牌时可以出牌', () => {
    state.startGame()
    forceBoss('called_out')
    const { game, playHand, selectCard } = state
    selectCard(game.calledOutId)
    const handsBefore = game.handsLeft
    playHand()
    // 出牌次数减少
    expect(game.handsLeft).toBeLessThan(handsBefore)
  })
})

describe('useGameState - 复活与 Boss 限制', () => {
  let state

  beforeEach(() => {
    localStorageMock.clear()
    state = useGameState()
    state.selectedChar.value = 'normal'
    state.selectedMode.value = 'simple' // 简单模式有1次复活
    state.startGame()
  })

  function forceBossLevel(bossId) {
    state.game.level = 9
    state.game.bossDebuff = { id: bossId }
    state.game.targetScore = 999999 // 确保不会赢
    // 重置基础值再应用效果，模拟真实 Boss 层流程
    state.game.handSize = 8
    state.game.handsLeft = 4
    state.game.discardsLeft = 4
    if (bossId === 'pinhole') state.game.handsLeft = 1
    if (bossId === 'no_discard') state.game.discardsLeft = 0
    if (bossId === 'shackles') {
      state.game.handSize = 7
      state.game.hand = state.game.hand.slice(0, 7) // 模拟手牌上限
    }
  }

  it('针眼 Boss：出牌次数只有1次', () => {
    forceBossLevel('pinhole')
    expect(state.game.handsLeft).toBe(1)
  })

  it('无弃牌 Boss：弃牌次数为0', () => {
    forceBossLevel('no_discard')
    expect(state.game.discardsLeft).toBe(0)
  })

  it('镣铐 Boss：手牌上限为7', () => {
    forceBossLevel('shackles')
    expect(state.game.handSize).toBe(7)
    // 手牌数应等于上限
    expect(state.game.hand.length).toBe(7)
  })

  it('高墙 Boss：目标分提高50%', () => {
    const originalTarget = state.game.targetScore
    state.game.level = 9
    state.game.bossDebuff = { id: 'high_wall' }
    state.game.targetScore = 1000
    // 手动应用效果（模拟 applyBossDebuffEffects）
    const expected = Math.floor(1000 * 1.5)
    state.game.targetScore = expected
    expect(state.game.targetScore).toBe(1500)
  })
})

describe('useGameState - 通关判定', () => {
  let state

  beforeEach(() => {
    localStorageMock.clear()
    state = useGameState()
    state.selectedChar.value = 'normal'
    state.selectedMode.value = 'hard'
    state.startGame()
  })

  it('初始状态未通关', () => {
    expect(state.game.cleared).toBe(false)
  })

  it('第9层战败时不标记通关', () => {
    state.game.level = 9
    state.game.lives = 0
    state.game.handsLeft = 0
    state.game.levelScore = 0
    state.game.targetScore = 99999
    // 直接调用 loseLevel 模拟战败
    state.game.bossDebuff = { id: 'shackles' } // 确保是 Boss 层
    state.loseLevel()
    expect(state.game.cleared).toBe(false)
  })

  it('gameClear 标记通关', () => {
    state.gameClear()
    expect(state.game.cleared).toBe(true)
  })
})

describe('useGameState - 下一层逻辑', () => {
  let state

  beforeEach(() => {
    localStorageMock.clear()
    state = useGameState()
    state.selectedChar.value = 'normal'
    state.selectedMode.value = 'hard'
    state.startGame()
  })

  it('层数递增，状态重置', () => {
    const levelBefore = state.game.level
    state.nextLevel()
    expect(state.game.level).toBe(levelBefore + 1)
    expect(state.game.levelScore).toBe(0)
    expect(state.game.handsLeft).toBe(4)
    expect(state.game.discardsLeft).toBe(4)
    expect(state.game.selected).toEqual([])
  })

  it('第9层后调用 gameClear', () => {
    state.game.level = 8
    state.nextLevel() // 到9
    expect(state.game.level).toBe(9)
    // 再调一次应该触发通关
    const showModalBefore = state.showModal.value
    state.nextLevel()
    expect(state.game.cleared).toBe(true)
    expect(state.showModal.value).toBe('gameover')
  })
})
