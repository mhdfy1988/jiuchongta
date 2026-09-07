import { describe, it, expect, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { bus } from '../src/utils/eventBus.js'
import { createJokerSystem } from '../src/systems/jokerSystem.js'
import { getJoker, JOKERS_BY_RARITY } from '../src/utils/gameData.js'

function makeGame() {
  return reactive({
    jokers: [],
    money: 10,
  })
}

// 找一个有 onPlay 的小丑
function findJokerWithOnPlay() {
  for (const j of JOKERS_BY_RARITY.common) if (j.onPlay) return j.id
  for (const j of JOKERS_BY_RARITY.rare) if (j.onPlay) return j.id
  for (const j of JOKERS_BY_RARITY.epic) if (j.onPlay) return j.id
  return 'joker'
}

// 找一个有 onDiscard 的小丑
function findJokerWithOnDiscard() {
  for (const j of JOKERS_BY_RARITY.common) if (j.onDiscard) return j.id
  for (const j of JOKERS_BY_RARITY.rare) if (j.onDiscard) return j.id
  return 'joker'
}

// 找一个 consumeOnUse 的小丑
function findTempJoker() {
  for (const rarity of ['common', 'rare', 'epic', 'legend']) {
    for (const j of JOKERS_BY_RARITY[rarity] || []) {
      if (j.consumeOnUse) return j.id
    }
  }
  return null
}

describe('JokerSystem', () => {
  let game, jokers

  beforeEach(() => {
    game = makeGame()
    jokers = createJokerSystem(game, bus)
  })

  it('addJoker 成功添加小丑', () => {
    const result = jokers.addJoker('joker')
    expect(result).toBe(true)
    expect(game.jokers.length).toBe(1)
    expect(game.jokers[0].id).toBe('joker')
    expect(game.jokers[0].data.stacks).toBe(0)
  })

  it('addJoker 最多 6 个', () => {
    for (let i = 0; i < 6; i++) jokers.addJoker('joker')
    expect(game.jokers.length).toBe(6)
    const result = jokers.addJoker('blue_joker')
    expect(result).toBe(false)
    expect(game.jokers.length).toBe(6)
  })

  it('addJoker 无效 id 返回 false', () => {
    const result = jokers.addJoker('nonexistent_id_xyz')
    expect(result).toBe(false)
    expect(game.jokers.length).toBe(0)
  })

  it('addJoker 可以锁定', () => {
    jokers.addJoker('joker', { locked: true })
    expect(game.jokers[0].data.locked).toBe(true)
  })

  it('removeJoker 移除指定位置', () => {
    jokers.addJoker('joker')
    jokers.addJoker('blue_joker')
    expect(game.jokers.length).toBe(2)
    const removed = jokers.removeJoker(0)
    expect(removed.id).toBe('joker')
    expect(game.jokers.length).toBe(1)
    expect(game.jokers[0].id).toBe('blue_joker')
  })

  it('removeJoker 越界返回 null', () => {
    expect(jokers.removeJoker(-1)).toBeNull()
    expect(jokers.removeJoker(0)).toBeNull()
  })

  it('sellJoker 卖出获得一半价格（向下取整，至少1）', () => {
    jokers.addJoker('joker') // cost 3
    const price = jokers.sellJoker(0)
    expect(price).toBe(1) // floor(3/2) = 1
    expect(game.money).toBe(11)
    expect(game.jokers.length).toBe(0)
  })

  it('sellJoker 锁定的不能卖', () => {
    jokers.addJoker('joker', { locked: true })
    const result = jokers.sellJoker(0)
    expect(result).toBe(false)
    expect(game.jokers.length).toBe(1)
  })

  it('sellJoker 越界返回 false', () => {
    expect(jokers.sellJoker(0)).toBe(false)
  })

  it('getDef 返回定义', () => {
    jokers.addJoker('joker')
    const def = jokers.getDef(game.jokers[0])
    expect(def.id).toBe('joker')
    expect(def.name).toBeTruthy()
  })

  it('consumeTempJokers 清理消耗型小丑', () => {
    const tempId = findTempJoker()
    if (!tempId) return // 没有临时小丑就跳过
    jokers.addJoker('joker') // 永久
    jokers.addJoker(tempId) // 临时
    expect(game.jokers.length).toBe(2)
    jokers.consumeTempJokers()
    expect(game.jokers.length).toBe(1)
    expect(game.jokers[0].id).toBe('joker')
  })

  it('triggerOnPlay 不报错', () => {
    jokers.addJoker('joker')
    const onPlayId = findJokerWithOnPlay()
    if (onPlayId && onPlayId !== 'joker') jokers.addJoker(onPlayId)
    expect(() => jokers.triggerOnPlay('一对')).not.toThrow()
  })

  it('triggerOnDiscard 不报错', () => {
    jokers.addJoker('joker')
    const onDiscardId = findJokerWithOnDiscard()
    if (onDiscardId) jokers.addJoker(onDiscardId)
    expect(() => jokers.triggerOnDiscard([{ rank: 'A', suit: '♠' }], '高牌')).not.toThrow()
  })
})
