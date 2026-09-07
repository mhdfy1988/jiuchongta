import { ref } from 'vue'
import { bus, EVENTS } from '../utils/eventBus.js'
import { storage } from '../utils/storage.js'
import { SAVE_KEY, SAVE_VERSION } from '../data/constants.js'

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
    const saveData = {
      ...game,
      __version: SAVE_VERSION,
    }
    saveData.playedHandTypes = [...game.playedHandTypes]
    // silencedJoker 是对象引用，直接序列化会断裂；改存下标，读档时再还原
    const silIdx = game.jokers.indexOf(game.silencedJoker)
    saveData.silencedJoker = silIdx >= 0 ? silIdx : null
    storage.set(SAVE_KEY, saveData)
    updateFlag()
    bus.emit(EVENTS.SAVE_UPDATED)
  }

  function loadGame() {
    const data = storage.get(SAVE_KEY, null)
    if (!data) return false
    // 版本不匹配直接丢弃旧存档
    if (data.__version !== SAVE_VERSION) {
      clearSave()
      return false
    }
    Object.assign(game, data)
    game.playedHandTypes = data.playedHandTypes || []
    game.selected = [] // 读档后清空选中
    game.pendingConsumable = null // 待选状态不随存档恢复
    game.pendingSuit = null
    // 恢复 silencedJoker 对象引用（存档里存的是下标）
    if (typeof data.silencedJoker === 'number' && data.silencedJoker >= 0 && data.silencedJoker < game.jokers.length) {
      game.silencedJoker = game.jokers[data.silencedJoker]
    } else {
      game.silencedJoker = null
    }
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
