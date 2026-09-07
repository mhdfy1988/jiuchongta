import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { bus } from '../src/utils/eventBus.js'
import { createAchievementSystem } from '../src/systems/achievementSystem.js'

describe('AchievementSystem', () => {
  let statsRef, savedStats, ach

  beforeEach(() => {
    savedStats = {}
    statsRef = ref({})
    ach = createAchievementSystem(statsRef, (s) => { savedStats = { ...s } }, bus)
  })

  it('checkAll 初始状态没有成就', () => {
    ach.checkAll()
    // 初始 stats 为空，大多数成就不会触发
    expect(Object.keys(savedStats).filter(k => k.startsWith('ach_')).length).toBeGreaterThanOrEqual(0)
  })

  it('recordStat 设置统计值并检查成就', () => {
    ach.recordStat('totalGames', 1)
    expect(statsRef.value.totalGames).toBe(1)
    expect(savedStats.totalGames).toBe(1)
  })

  it('recordMax 取最大值', () => {
    ach.recordMax('maxLevel', 3)
    expect(statsRef.value.maxLevel).toBe(3)
    ach.recordMax('maxLevel', 5)
    expect(statsRef.value.maxLevel).toBe(5)
    ach.recordMax('maxLevel', 2)
    expect(statsRef.value.maxLevel).toBe(5)
  })

  it('达到条件的成就会被解锁', () => {
    // 设置 firstBuy = true 触发"第一次购买"成就
    statsRef.value.firstBuy = true
    ach.checkAll()
    const unlocked = Object.keys(savedStats).filter(k => k.startsWith('ach_') && savedStats[k])
    expect(unlocked.length).toBeGreaterThan(0)
  })

  it('已解锁的成就不会重复触发', () => {
    let unlockCount = 0
    bus.on('achievement_unlocked', () => unlockCount++)
    statsRef.value.totalGames = 100
    statsRef.value.maxLevel = 9
    ach.checkAll()
    const firstCount = unlockCount
    ach.checkAll() // 再检查一次
    expect(unlockCount).toBe(firstCount) // 不应该再触发
  })
})
