<template>
  <div
    class="playing-card"
    :class="[
      suitClass,
      { selected, 'called-out': calledOut, disabled }
    ]"
    @click="handleClick"
  >
    <div class="pc-corner top">
      <span class="pc-rank">{{ rankLabel }}</span>
      <span class="pc-suit">{{ suit }}</span>
    </div>
    <div class="pc-center">{{ suit }}</div>
    <div class="pc-corner bot">
      <span class="pc-rank">{{ rankLabel }}</span>
      <span class="pc-suit">{{ suit }}</span>
    </div>
    <div v-if="enhancement" class="pc-enhancement">{{ enhancement }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  calledOut: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  enhancement: { type: String, default: '' },
})

const emit = defineEmits(['click'])

const suitClass = computed(() => {
  if (props.card.suit === '♥' || props.card.suit === '♦') return 'red'
  return 'black'
})

const suit = computed(() => props.card.suit)
const rankLabel = computed(() => props.card.rank)

function handleClick() {
  if (!props.disabled) emit('click', props.card)
}
</script>

<style scoped>
.playing-card {
  position: relative;
  width: 60px;
  height: 88px;
  border-radius: 8px;
  background: linear-gradient(145deg, #fafafa, #e8e8e8);
  border: 2px solid #ccc;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  flex-shrink: 0;
}
.playing-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}
.playing-card.selected {
  transform: translateY(-10px);
  border-color: var(--gold, #ffcc22);
  box-shadow: 0 8px 24px rgba(255, 204, 34, 0.4);
}
.playing-card.called-out {
  border-color: var(--accent, #ff3366);
  box-shadow: 0 0 20px rgba(255, 51, 102, 0.8);
  animation: pulseRed 1s infinite;
}
.playing-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulseRed {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 51, 102, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 51, 102, 0.8); }
}

.playing-card.red { color: #c0392b; }
.playing-card.black { color: #2c3e50; }

.pc-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  font-weight: 800;
}
.pc-corner.top {
  top: 4px;
  left: 6px;
}
.pc-corner.bot {
  bottom: 4px;
  right: 6px;
  transform: rotate(180deg);
}
.pc-rank { font-size: 13px; }
.pc-suit { font-size: 10px; margin-top: 1px; }

.pc-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  line-height: 1;
}

.pc-enhancement {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--gold, #ffcc22);
  color: #222;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  z-index: 2;
}
</style>
