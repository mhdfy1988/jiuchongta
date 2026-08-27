<template>
  <div id="app">
    <StartScreen v-if="state.screen.value === 'start'" :state="state" />
    <GameScreen v-else :state="state" />

    <div class="toast-container">
      <div
        v-for="toast in state.toasts.value"
        :key="toast.id"
        class="toast"
        :class="{ achievement: toast.isAchievement }"
      >{{ toast.msg }}</div>
    </div>
  </div>
</template>

<script setup>
import { useGameState } from './composables/useGameState.js'
import StartScreen from './components/StartScreen.vue'
import GameScreen from './components/GameScreen.vue'

const state = useGameState()
</script>

<style scoped>
#app {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  background: rgba(20,20,50,0.95);
  border: 1px solid rgba(255,204,34,0.3);
  color: var(--gold);
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  animation: toast-in 0.3s ease, toast-out 0.3s ease 2.7s forwards;
}
.toast.achievement {
  border-color: var(--purple);
  color: var(--purple);
  box-shadow: 0 4px 20px rgba(170,68,255,0.3);
}
@keyframes toast-in {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes toast-out {
  to { opacity: 0; transform: translateY(-20px); }
}
</style>
