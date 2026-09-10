<template>
  <div
    class="consumable-card"
    :class="[
      type,
      sizeClass,
      { 'is-sold': sold, 'is-confirm': confirmMode, 'no-hover': !interactive }
    ]"
    @click="handleClick"
    @mouseenter="$emit('hover', $event, def)"
    @mouseleave="$emit('leave')"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <span class="c-icon">{{ def.icon }}</span>
    <span class="c-name">{{ def.name }}</span>
    <span v-if="showType" class="c-type">{{ typeLabel }}</span>

    <slot />

    <div v-if="confirmMode" class="c-confirm-overlay">
      <span>确认卖出?</span>
      <button class="confirm-cancel" @click.stop="$emit('cancel')">✕ 取消</button>
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
  confirmMode: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['click', 'hover', 'leave', 'contextmenu', 'cancel'])

const sizeClass = computed(() => `size-${props.size}`)
const typeLabel = computed(() => props.type === 'tarot' ? '塔罗牌' : props.type === 'planet' ? '星球牌' : '礼券牌')

function handleClick(e) {
  if (!props.sold) emit('click', e)
}
</script>

<style scoped>
.consumable-card {
  position: relative;
  width: 78px;
  height: 110px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 4px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid;
  user-select: none;
  box-sizing: border-box;
}
.consumable-card:not(.no-hover):not(.is-sold):hover {
  transform: scale(1.08);
}

/* 尺寸（与小丑牌一致） */
.consumable-card.size-sm { width: 72px; height: 94px; gap: 3px; padding: 4px 2px; }
.consumable-card.size-sm .c-icon { font-size: 20px; }
.consumable-card.size-sm .c-name { font-size: 9px; }
.consumable-card.size-sm .c-type { font-size: 8px; }

.consumable-card.size-md { width: 78px; height: 110px; }

.c-icon { font-size: 26px; line-height: 1; }
.c-name { font-size: 11px; font-weight: 700; text-align: center; line-height: 1.1; }
.c-type { font-size: 9px; opacity: 0.8; }

.consumable-card.is-sold { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.8); }

.c-confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 30, 30, 0.85);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: white;
  font-size: 11px;
  font-weight: bold;
  z-index: 5;
}
.confirm-cancel {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: #fff;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 9px;
  cursor: pointer;
  line-height: 1.2;
}
.confirm-cancel:hover { background: rgba(255, 255, 255, 0.3); }

/* 类型配色（匹配原版渐变风格） */
.consumable-card.tarot {
  background: linear-gradient(145deg, rgba(80, 30, 120, 0.8), rgba(50, 20, 80, 0.9));
  border-color: var(--purple, #9c27b0);
  color: #e8d0ff;
}
.consumable-card.planet {
  background: linear-gradient(145deg, rgba(20, 60, 120, 0.8), rgba(10, 40, 80, 0.9));
  border-color: var(--blue, #2196f3);
  color: #c0e8ff;
}
.consumable-card.voucher {
  background: linear-gradient(145deg, rgba(120, 90, 20, 0.8), rgba(80, 60, 10, 0.9));
  border-color: var(--gold, #ffcc22);
  color: #ffe8a0;
}
</style>
