<template>
  <div
    class="consumable-card"
    :class="[
      type,
      size,
      { 'is-sold': sold, 'is-confirm': confirmMode }
    ]"
    @click="$emit('click', $event)"
    @mouseenter="$emit('hover', $event, def)"
    @mouseleave="$emit('leave')"
  >
    <span class="cc-icon">{{ def.icon }}</span>
    <span class="cc-name">{{ def.name }}</span>
    <span v-if="showType" class="cc-type">{{ typeLabel }}</span>
    <span v-if="showPrice" class="cc-price">${{ priceLabel }}</span>
    <div v-if="confirmMode" class="cc-confirm-overlay">
      <span>确认卖出?</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  def: { type: Object, required: true },
  type: { type: String, required: true }, // 'tarot' | 'planet'
  size: { type: String, default: 'md' }, // sm | md
  sold: { type: Boolean, default: false },
  showType: { type: Boolean, default: true },
  showPrice: { type: Boolean, default: false },
  priceLabel: { type: [Number, String], default: '' },
  confirmMode: { type: Boolean, default: false },
})

defineEmits(['click', 'hover', 'leave'])

const typeLabel = computed(() => props.type === 'tarot' ? '塔罗牌' : '星球牌')
</script>

<style scoped>
.consumable-card {
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
.consumable-card:hover:not(.is-sold) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
.consumable-card.sm {
  width: 72px;
  height: 94px;
  gap: 3px;
}
.consumable-card.sm .cc-icon { font-size: 22px; }
.consumable-card.sm .cc-name { font-size: 10px; }
.consumable-card.sm .cc-type { font-size: 9px; }

.cc-icon { font-size: 32px; }
.cc-name { font-size: 12px; font-weight: 600; text-align: center; line-height: 1.2; padding: 0 4px; }
.cc-type { font-size: 10px; opacity: 0.8; }
.cc-price { font-size: 12px; font-weight: bold; color: var(--gold); }

.consumable-card.is-sold { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.8); }

.cc-confirm-overlay {
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

/* 类型配色 */
.consumable-card.tarot {
  background: linear-gradient(135deg, #2a1a4a, #4a2a7c);
  border-color: #8a5adc;
  color: #e8d0ff;
}
.consumable-card.planet {
  background: linear-gradient(135deg, #1a3a4a, #2a6a8c);
  border-color: #5ab0d0;
  color: #c0e8ff;
}
</style>
