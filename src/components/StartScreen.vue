<template>
  <div class="start-screen">
    <!-- 主菜单 -->
    <template v-if="view === 'menu'">
      <h1 class="game-title">九层塔</h1>
      <p class="game-subtitle">扑克肉鸽</p>
      <div class="menu-buttons">
        <button class="menu-btn btn-start" @click="view = 'select'">▶ 开始游戏</button>
        <button v-if="state.hasSave()" class="menu-btn btn-continue" @click="continueGame">📂 继续游戏</button>
        <button class="menu-btn btn-collection" @click="state.showModal.value = 'collection'">📖 卡牌图鉴</button>
        <button class="menu-btn btn-ach" @click="state.showModal.value = 'achievements'">🏆 成就</button>
        <button v-if="state.hasSave()" class="menu-btn btn-delete" @click="deleteSave">🗑️ 删除存档</button>
      </div>
    </template>

    <!-- 角色与模式选择 -->
    <template v-if="view === 'select'">
      <button class="back-btn" @click="view = 'menu'">‹ 返回</button>
      <h2 class="select-title">选择角色</h2>
      <div class="char-grid">
        <div
          v-for="char in characters" :key="char.id"
          class="char-card"
          :class="{ selected: state.selectedChar.value === char.id, locked: isCharLocked(char) }"
          @click="selectChar(char)"
        >
          <div class="char-icon">{{ char.icon }}</div>
          <div class="char-name">{{ char.name }}</div>
          <div class="char-desc">{{ char.desc }}</div>
          <div v-if="isCharLocked(char)" class="lock-text">🔒 {{ char.unlockCondition }}</div>
        </div>
      </div>

      <h2 class="select-title">选择模式</h2>
      <div class="mode-grid">
        <div
          v-for="mode in modes" :key="mode.id"
          class="mode-card"
          :class="{ selected: state.selectedMode.value === mode.id, locked: isModeLocked(mode) }"
          @click="selectMode(mode)"
        >
          <div class="mode-icon">{{ mode.icon }}</div>
          <div class="mode-name">{{ mode.name }}</div>
          <div class="mode-desc">{{ mode.desc }}</div>
          <div v-if="isModeLocked(mode)" class="lock-text">🔒 {{ mode.unlockCondition }}</div>
        </div>
      </div>

      <button class="confirm-btn" :disabled="!canStart" @click="state.startGame()">▶ 开始挑战</button>
    </template>

    <!-- 卡牌图鉴弹窗 -->
    <CardCollectionModal v-if="state.showModal.value === 'collection'" :state="state" />
    <AchievementsModal v-if="state.showModal.value === 'achievements'" :stats="state.stats.value" @close="state.showModal.value = null" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CHARACTERS, MODES } from '../data/characters.js'
import CardCollectionModal from './CardCollectionModal.vue'
import AchievementsModal from './AchievementsModal.vue'

const props = defineProps({ state: Object })
const view = ref('menu')
const characters = CHARACTERS
const modes = MODES

const canStart = computed(() => props.state.selectedChar.value && props.state.selectedMode.value)

function isCharLocked(char) {
  if (!char.unlockCondition) return false
  const s = props.state.stats.value
  if (char.id === 'straight') return !s.unlockedChars?.includes('straight')
  if (char.id === 'flush') return !s.unlockedChars?.includes('flush')
  return true
}

function isModeLocked(mode) {
  if (!mode.unlockCondition) return false
  if (mode.id === 'endless') return !props.state.stats.value.unlockedEndless
  return true
}

function selectChar(char) {
  if (isCharLocked(char)) return
  props.state.selectedChar.value = char.id
  props.state.SFX.button()
}

function selectMode(mode) {
  if (isModeLocked(mode)) return
  props.state.selectedMode.value = mode.id
  props.state.SFX.button()
}

function continueGame() {
  props.state.continueGame()
}

function deleteSave() {
  props.state.clearSave()
  props.state.showToast('存档已删除')
}
</script>

<style scoped>
.start-screen {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 20px; position: relative;
}

/* 主菜单 */
.game-title {
  font-family: 'Bungee', sans-serif; font-size: 72px; color: var(--gold);
  text-shadow: 0 0 40px rgba(255,204,34,0.6), 0 0 80px rgba(255,204,34,0.3);
  margin-bottom: 4px; text-align: center;
  background: linear-gradient(180deg, #ffd700, #ff9500);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 30px rgba(255,204,34,0.4));
}
.game-subtitle {
  color: var(--muted); font-size: 18px; margin-bottom: 50px;
  letter-spacing: 8px; text-transform: uppercase;
}
.menu-buttons { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.menu-btn {
  min-width: 240px; padding: 14px 32px; font-size: 16px; font-weight: 700;
  border-radius: 12px; cursor: pointer; transition: all 0.2s;
  border: 2px solid; backdrop-filter: blur(8px);
}
.menu-btn:hover { transform: translateY(-3px); }
.btn-start {
  background: linear-gradient(135deg, rgba(0,217,126,0.3), rgba(0,170,94,0.2));
  border-color: var(--green); color: var(--green);
  box-shadow: 0 4px 20px rgba(0,217,126,0.2);
}
.btn-start:hover { box-shadow: 0 6px 28px rgba(0,217,126,0.4); background: linear-gradient(135deg, rgba(0,217,126,0.4), rgba(0,170,94,0.3)); }
.btn-continue {
  background: rgba(68,170,255,0.1); border-color: rgba(68,170,255,0.4); color: var(--blue);
}
.btn-continue:hover { background: rgba(68,170,255,0.15); box-shadow: 0 4px 20px rgba(68,170,255,0.2); }
.btn-collection {
  background: rgba(170,68,255,0.1); border-color: rgba(170,68,255,0.4); color: var(--purple);
}
.btn-collection:hover { background: rgba(170,68,255,0.15); box-shadow: 0 4px 20px rgba(170,68,255,0.2); }
.btn-ach {
  background: rgba(255,204,34,0.1); border-color: rgba(255,204,34,0.4); color: var(--gold);
}
.btn-ach:hover { background: rgba(255,204,34,0.15); box-shadow: 0 4px 20px rgba(255,204,34,0.2); }
.btn-delete {
  background: rgba(255,51,102,0.1); border-color: rgba(255,51,102,0.3); color: var(--red); font-size: 13px; min-width: 160px; padding: 8px 24px;
}
.btn-delete:hover { background: rgba(255,51,102,0.15); }

/* 选择界面 */
.back-btn {
  position: absolute; top: 20px; left: 20px;
  padding: 8px 16px; font-size: 14px; font-weight: 700;
  background: rgba(255,255,255,0.08); color: var(--text); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.back-btn:hover { background: rgba(255,255,255,0.12); }
.select-title {
  font-family: 'Bungee', sans-serif; font-size: 20px; color: var(--accent2);
  margin-bottom: 12px; text-align: center; text-shadow: 0 0 10px rgba(255,170,0,0.3);
}
.char-grid, .mode-grid {
  display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px;
}
.char-card, .mode-card {
  background: rgba(20,20,50,0.7); border: 2px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 20px; width: 200px; cursor: pointer; transition: all 0.25s;
  text-align: center; backdrop-filter: blur(8px);
}
.char-card:hover, .mode-card:hover {
  border-color: var(--gold); transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(255,204,34,0.2);
}
.char-card.selected, .mode-card.selected {
  border-color: var(--accent); box-shadow: 0 0 20px rgba(255,51,102,0.3);
}
.char-card.locked, .mode-card.locked { opacity: 0.4; cursor: not-allowed; }
.char-card.locked:hover, .mode-card.locked:hover { border-color: rgba(255,255,255,0.1); transform: none; }
.char-icon { font-size: 48px; margin-bottom: 8px; line-height: 1; }
.char-name { font-size: 18px; font-weight: 800; color: var(--gold); margin-bottom: 4px; }
.char-desc { font-size: 12px; color: var(--muted); line-height: 1.4; }
.mode-icon { font-size: 36px; margin-bottom: 8px; line-height: 1; }
.mode-name { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
.mode-desc { font-size: 11px; color: var(--muted); }
.lock-text { font-size: 11px; color: var(--red); margin-top: 6px; }

.confirm-btn {
  padding: 14px 48px; font-size: 18px; font-family: 'Bungee', sans-serif;
  background: linear-gradient(135deg, var(--green), #00aa5e); color: #fff; border: none;
  border-radius: 12px; cursor: pointer; letter-spacing: 2px;
  box-shadow: 0 4px 20px rgba(0,217,126,0.3); transition: all 0.2s;
}
.confirm-btn:hover { filter: brightness(1.15); transform: translateY(-2px); }
.confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
