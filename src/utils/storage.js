// localStorage 统一封装
// 统一错误处理、统一 JSON 序列化，以后换云存档只改这一个文件

const SAFE_KEYS = new Set([
  'pokerRoguelikeSave',
  'pokerRoguelikeStats',
])

function isAvailable() {
  try {
    const k = '__test__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch (e) {
    return false
  }
}

export const storage = {
  available: isAvailable(),

  get(key, fallback = null) {
    if (!this.available) return fallback
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch (e) {
      console.warn(`[storage] get ${key} failed:`, e)
      return fallback
    }
  },

  set(key, value) {
    if (!this.available) return false
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn(`[storage] set ${key} failed:`, e)
      return false
    }
  },

  remove(key) {
    if (!this.available) return
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`[storage] remove ${key} failed:`, e)
    }
  },

  has(key) {
    if (!this.available) return false
    try {
      return localStorage.getItem(key) !== null
    } catch (e) {
      return false
    }
  },

  // 只允许已知 key 操作，防手滑
  safeGet(key, fallback = null) {
    if (!SAFE_KEYS.has(key)) {
      console.warn(`[storage] unsafe key: ${key}`)
      return fallback
    }
    return this.get(key, fallback)
  },

  safeSet(key, value) {
    if (!SAFE_KEYS.has(key)) {
      console.warn(`[storage] unsafe key: ${key}`)
      return false
    }
    return this.set(key, value)
  },
}
