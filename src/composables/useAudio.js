import { ref } from 'vue'

let audioCtx = null
const soundEnabled = ref(true)

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)() } catch(e) {}
  }
}

function playTone(freq, duration, type = 'sine', volume = 0.1, delay = 0) {
  if (!soundEnabled.value || !audioCtx) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    const t = audioCtx.currentTime + delay
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(volume, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration)
  } catch(e) {}
}

function playNoise(duration, volume = 0.05, delay = 0) {
  if (!soundEnabled.value || !audioCtx) return
  try {
    const bufferSize = audioCtx.sampleRate * duration
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = audioCtx.createBufferSource()
    noise.buffer = buffer
    const gain = audioCtx.createGain()
    const filter = audioCtx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2000
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(audioCtx.destination)
    const t = audioCtx.currentTime + delay
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    noise.start(t)
    noise.stop(t + duration)
  } catch(e) {}
}

export const SFX = {
  select() { playTone(800, 0.05, 'square', 0.08); },
  deselect() { playTone(600, 0.05, 'square', 0.06); },
  play() { playTone(440, 0.08, 'triangle', 0.12); playTone(660, 0.12, 'triangle', 0.1, 0.05); },
  discard() { playNoise(0.15, 0.08); playTone(300, 0.08, 'sawtooth', 0.06); },
  score() { playTone(523, 0.1, 'sine', 0.1); playTone(659, 0.1, 'sine', 0.08, 0.08); playTone(784, 0.15, 'sine', 0.08, 0.16); },
  jokerTrigger() { playTone(880, 0.06, 'square', 0.05); },
  win() { playTone(523, 0.1, 'triangle', 0.1); playTone(659, 0.1, 'triangle', 0.1, 0.1); playTone(784, 0.1, 'triangle', 0.1, 0.2); playTone(1047, 0.2, 'triangle', 0.12, 0.3); },
  lose() { playTone(300, 0.2, 'sawtooth', 0.1); playTone(200, 0.3, 'sawtooth', 0.08, 0.15); },
  buy() { playTone(660, 0.05, 'square', 0.08); playTone(880, 0.08, 'square', 0.06, 0.03); },
  sell() { playTone(440, 0.05, 'square', 0.06); playTone(330, 0.08, 'square', 0.04, 0.03); },
  reroll() { playNoise(0.1, 0.05); playTone(500, 0.05, 'square', 0.04); },
  useConsumable() { playTone(600, 0.05, 'triangle', 0.08); playTone(800, 0.08, 'triangle', 0.06, 0.04); playTone(1000, 0.1, 'triangle', 0.04, 0.08); },
  achievement() { playTone(659, 0.1, 'sine', 0.1); playTone(880, 0.1, 'sine', 0.08, 0.08); playTone(1047, 0.15, 'sine', 0.1, 0.16); playTone(1319, 0.2, 'sine', 0.08, 0.24); },
  levelUp() { playTone(440, 0.08, 'triangle', 0.1); playTone(554, 0.08, 'triangle', 0.08, 0.06); playTone(659, 0.12, 'triangle', 0.08, 0.12); },
  button() { playTone(600, 0.03, 'square', 0.04); },
}

export function useAudio() {
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
    if (soundEnabled.value) initAudio()
  }

  return { soundEnabled, toggleSound, initAudio, SFX }
}
