<template>
  <div
    class="joker-card"
    :class="[
      `rarity-${def.rarity}`,
      size,
      { 'is-sold': sold, 'is-locked': locked, 'is-confirm': confirmMode }
    ]"
    @click="$emit('click', $event)"
    @mouseenter="$emit('hover', $event, def)"
    @mouseleave="$emit('leave')"
  >
    <span class="jc-icon">{{ def.icon }}</span>
    <span class="jc-name">{{ def.name }}</span>
    <span v-if="showRarity" class="jc-rarity">{{ rarityLabel }}</span>
    <span v-if="showPrice" class="jc-price">${{ priceLabel }}</span>
    <div v-if="confirmMode" class="jc-confirm-overlay">
      <span>确认卖出?</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  def: { type: Object, required: true },
  size: { type: String, default: 'md' }, // sm | md | lg
  sold: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  showRarity: { type: Boolean, default: true },
  showPrice: { type: Boolean, default: false },
  priceLabel: { type: [Number, String], default: '' },
  confirmMode: { type: Boolean, default: false },
})

defineEmits(['click', 'hover', 'leave'])

const rarityMap = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legend: '传说',
}

const rarityLabel = computed(() => rarityMap[props.def.rarity] || props.def.rarity)
</script>

<style scoped>
.joker-card {
  position: relative;
  width: 100px;
  height: 130px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  border: 2px solid;
  user-select: none;
}
.joker-card:hover:not(.is-sold) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
.joker-card.sm {
  width: 72px;
  height: 94px;
  gap: 3px;
}
.joker-card.sm .jc-icon { font-size: 22px; }
.joker-card.sm .jc-name { font-size: 10px; }
.joker-card.sm .jc-rarity { font-size: 9px; }

.jc-icon { font-size: 32px; }
.jc-name { font-size: 12px; font-weight: 600; text-align: center; line-height: 1.2; padding: 0 4px; }
.jc-rarity { font-size: 10px; opacity: 0.8; }
.jc-price { font-size: 12px; font-weight: bold; color: var(--gold); }

.joker-card.is-sold { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.8); }
.joker-card.is-locked { cursor: default; }
.joker-card.is-locked::after {
  content: '🔒';
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
}

.jc-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 30, 30, 0.85);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: bold;
}

/* 稀有度配色 */
.rarity-common { background: #3a4a5c; border-color: #5a6a7c; color: #ddd; }
.rarity-rare { background: #2a5a7c; border-color: #4a8abc; color: #cfe8ff; }
.rarity-epic { background: #5a2a7c; border-color: #9a4adc; color: #e8cfff; }
.rarity-legend { background: #7c5a1a; border-color: #e0a020; color: #fff0c0; }
</style>
