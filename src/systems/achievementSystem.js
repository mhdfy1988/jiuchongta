import { bus, EVENTS } from '../utils/eventBus.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { useAudio } from '../composables/useAudio.js'

const { SFX } = useAudio()

/**
 * 成就系统：检测并解锁成就
 * 通过事件总线监听游戏事件，检查成就条件
 */
export function createAchievementSystem(statsRef, saveStats, bus) {

  function checkAll() {
    const stats = statsRef.value
    for (const ach of ACHIEVEMENTS) {
      const key = 'ach_' + ach.id
      if (!stats[key] && ach.cond(stats)) {
        stats[key] = true
        SFX.achievement()
        bus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, { achievement: ach })
      }
    }
    saveStats(stats)
  }

  // 统一统计更新：mode='max' 取最大值，否则直接赋值
  function updateStat(key, value, mode = 'set') {
    const stats = statsRef.value
    if (mode === 'max') stats[key] = Math.max(stats[key] || 0, value)
    else stats[key] = value
    checkAll()
  }

  return {
    checkAll,
    recordStat: (k, v) => updateStat(k, v, 'set'),
    recordMax: (k, v) => updateStat(k, v, 'max'),
    updateStat,
  }
}
