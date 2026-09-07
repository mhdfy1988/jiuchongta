import { ref } from 'vue'
import { bus, EVENTS } from '../utils/eventBus.js'
import { storage } from '../utils/storage.js'
import { SAVE_KEY } from '../data/constants.js'

const STATS_KEY = 'pokerRoguelikeStats'

/**
 * 存档系统：游戏存档、统计数据、成就持久化
 * 不持有状态，只负责读写
 */
export function createSaveSystem(game, bus) {
  const hasSaveData = ref(false)

  function updateFlag() {
    hasSaveData.value = storage.has(SAVE_KEY)
  }
  updateFlag()

  // ---------- 游戏存档 ----------

  function saveGame() {
    const saveData = { ...game }
    // 数组展开（reactive 浅拷贝需要手动处理引用字段）
    saveData.playedHandTypes = [...game.playedHandTypes]
    storage.set(SAVE_KEY, saveData)
    updateFlag()
    bus.emit(EVENTS.SAVE_UPDATED)
  }

  function loadGame() {
    const data = storage.get(SAVE_KEY, null)
    if (!data) return false
    Object.assign(game, data)
    game.playedHandTypes = data.playedHandTypes || []
    // 兼容旧版：calledOutIndex 不存在或无效时，重置选中状态
    if (game.bossDebuff?.id === 'called_out') {
      if (typeof game.calledOutId !== 'number' || !game.hand.some(c => c.id === game.calledOutId)) {
        // 由 BossSystem 去 roll，这里先清掉
        game.calledOutId = game.hand.length > 0 ? game.hand[0].id : null
      }
    }
    game.selected = [] // 读档后清空选中，避免旧索引错乱
    updateFlag()
    return true
  }

  function clearSave() {
    storage.remove(SAVE_KEY)
    updateFlag()
  }

  function hasSave() {
    return hasSaveData.value
  }

  // ---------- 统计数据 ----------

  function loadStats() {
    return storage.get(STATS_KEY, {}) || {}
  }

  function saveStats(stats) {
    storage.set(STATS_KEY, stats)
  }

  return {
    hasSaveData,
    saveGame,
    loadGame,
    clearSave,
    hasSave,
    loadStats,
    saveStats,
  }
}
