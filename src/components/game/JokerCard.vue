<template>
  <div
    class="joker-card"
    :class="[
      `rarity-${def.rarity}`,
      sizeClass,
      {
        'is-sold': sold,
        'is-locked': locked,
        'is-confirm': confirmMode,
        'is-temporary': temporary,
        'no-hover': !interactive,
      }
    ]"
    @click="handleClick"
    @mouseenter="$emit('hover', $event, def)"
    @mouseleave="$emit('leave')"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <span class="j-icon">{{ def.icon }}</span>
    <span class="j-name">{{ def.name }}</span>

    <!-- 叠加层数 -->
    <div v-if="stacks > 0" class="j-stacks">{{ stacks }}</div>

    <!-- 指定花色角标（城堡等） -->
    <div
      v-if="suit"
      class="j-suit-badge"
      :class="{ 'suit-red': suit === '♥' || suit === '♦' }"
    >{{ suit }}</div>

    <!-- 删除按钮 -->
    <div v-if="showDelete && !locked" class="j-delete" @click.stop="$emit('delete')">$</div>

    <!-- 飘字动画 -->
    <div
      v-for="popup in bonusPopups"
      :key="popup.id || popup.text"
      class="joker-bonus-popup"
      :style="{ color: popup.color }"
    >{{ popup.text }}</div>

    <slot />

    <div v-if="confirmMode" class="j-confirm-overlay">
      <span>确认卖出?</span>
      <button class="confirm-cancel" @click.stop="$emit('cancel')">✕ 取消</button>
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
  temporary: { type: Boolean, default: false },
  confirmMode: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
  stacks: { type: Number, default: 0 },
  suit: { type: String, default: '' },
  showDelete: { type: Boolean, default: false },
  bonusPopups: { type: Array, default: () => [] },
})

const emit = defineEmits(['click', 'hover', 'leave', 'contextmenu', 'delete', 'cancel'])

const sizeClass = computed(() => `size-${props.size}`)

function handleClick(e) {
  if (!props.sold) emit('click', e)
}
</script>

<style scoped>
.joker-card {
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
.joker-card:not(.no-hover):not(.is-sold):hover {
  transform: translateY(-4px) scale(1.05);
}

/* 尺寸 */
.joker-card.size-sm { width: 72px; height: 94px; gap: 3px; padding: 4px 2px; }
.joker-card.size-sm .j-icon { font-size: 20px; }
.joker-card.size-sm .j-name { font-size: 9px; }

.joker-card.size-md { width: 78px; height: 110px; }
.joker-card.size-lg { width: 100px; height: 130px; }

.j-icon { font-size: 26px; line-height: 1; }
.j-name { font-size: 11px; font-weight: 800; text-align: center; line-height: 1.1; }

/* 状态 */
.joker-card.is-sold { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.8); }
.joker-card.is-locked { cursor: default; }
.joker-card.is-locked::after {
  content: '🔒';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 11px;
}

/* 叠加层数 */
.j-stacks {
  position: absolute;
  top: -2px;
  left: -2px;
  background: var(--accent, #ff3366);
  color: #fff;
  font-size: 9px;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 4px 0 4px 0;
  z-index: 2;
}

/* 指定花色角标（城堡等），放左下避免和左上叠加层数角标冲突 */
.j-suit-badge {
  position: absolute;
  bottom: 4px;
  left: 6px;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  z-index: 2;
  color: #9db4d0;
  text-shadow: 0 0 6px currentColor;
  pointer-events: none;
}
.j-suit-badge.suit-red { color: #ff6b81; }

/* 删除按钮 */
.j-delete {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--red, #ff3366);
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid var(--bg, #0a0a1e);
  transition: transform 0.15s;
}
.j-delete:hover { transform: scale(1.2); }

/* 飘字动画 */
.joker-bonus-popup {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
  text-shadow: 0 0 8px currentColor;
  animation: bonusFloat 1s ease-out forwards;
  z-index: 3;
  pointer-events: none;
}
@keyframes bonusFloat {
  0% { transform: translateX(-50%) translateY(0); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
}

.j-confirm-overlay {
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

/* 稀有度渐变（匹配原版风格） */
.rarity-common {
  background: linear-gradient(145deg, #1a1a3e, #2d2d4e);
  border-color: var(--rarity-common, #5a6a7c);
  color: var(--text, #e0e0e0);
}
.rarity-rare {
  background: linear-gradient(145deg, #0a1a3e, #1a2d5e);
  border-color: var(--rarity-rare, #4a8abc);
  color: #cfe8ff;
}
.rarity-epic {
  background: linear-gradient(145deg, #2a0a3e, #3a1a5e);
  border-color: var(--rarity-epic, #9a4adc);
  color: #e8cfff;
}
.rarity-legend {
  background: linear-gradient(145deg, #3a2a0a, #5e4a1a);
  border-color: var(--rarity-legend, #e0a020);
  color: #fff0c0;
}

.is-temporary {
  opacity: 0.7;
  border-style: dashed;
}
</style>
