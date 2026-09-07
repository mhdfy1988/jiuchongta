// vitest 全局 setup：mock 浏览器 API
import { beforeEach } from 'vitest'
import { bus } from '../src/utils/eventBus.js'

// mock AudioContext
if (typeof window !== 'undefined' && !window.AudioContext) {
  window.AudioContext = class MockAudioContext {
    constructor() {}
    createOscillator() {
      return {
        type: '',
        frequency: { value: 0 },
        connect() {},
        start() {},
        stop() {},
      }
    }
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      }
    }
    createBuffer() {
      return { getChannelData() { return new Float32Array(100) } }
    }
    createBufferSource() {
      return { buffer: null, connect() {}, start() {}, stop() {} }
    }
    createBiquadFilter() {
      return { type: '', frequency: { value: 0 }, connect() {} }
    }
    get destination() { return {} }
    get currentTime() { return 0 }
    get sampleRate() { return 44100 }
  }
}

// mock localStorage
const memoryStore = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (k) => memoryStore[k] ?? null,
    setItem: (k, v) => { memoryStore[k] = String(v) },
    removeItem: (k) => { delete memoryStore[k] },
    clear() { Object.keys(memoryStore).forEach(k => delete memoryStore[k]) },
  },
  writable: true,
})

// 每个测试前清理全局状态
beforeEach(() => {
  bus.clear()
  window.localStorage.clear()
})
