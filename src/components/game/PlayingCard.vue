<template>
  <div
    class="playing-card"
    :class="[
      suitClass,
      { selected, 'called-out': calledOut, disabled }
    ]"
    @click="handleClick"
  >
    <span class="pc-corner tl">{{ rankLabel }}</span>
    <span class="pc-suit">{{ suit }}</span>
    <span class="pc-corner br">{{ rankLabel }}</span>
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
  enhancement: { type: String, default: '' }, // 钢牌/玻璃牌等标记
})

const emit = defineEmits(['click'])

const suitClass = computed(() => {
  if (props.card.suit === '♥' || props.card.suit === '♦') return 'red'
  return 'black'
})

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  user-select: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.playing-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}
.playing-card.selected {
  transform: translateY(-10px);
  border-color: var(--gold);
  box-shadow: 0 8px 24px rgba(255, 204, 34, 0.4);
}
.playing-card.called-out {
  border-color: var(--red);
  box-shadow: 0 0 16px rgba(255, 51, 102, 0.6);
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
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}
.pc-corner.tl { top: 4px; left: 6px; }
.pc-corner.br { bottom: 4px; right: 6px; transform: rotate(180deg); }

.pc-suit {
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
  background: var(--gold);
  color: #222;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}
</style>
