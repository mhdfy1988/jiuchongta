<template>
  <div class="modal-overlay" @click.self="state.nextLevel()">
    <div class="modal shop-modal">
      <h2>🛒 小丑商店</h2>
      <div class="shop-info">💰 {{ game.money }} 金币 | 小丑位 {{ game.jokers.length }}/6</div>

      <div class="shop-layout">
        <div class="shop-left">
          <div class="shop-section">
            <div class="section-label">🃏 小丑牌</div>
            <div class="shop-grid">
              <div v-for="(item, idx) in state.shopItems.value" :key="idx" class="shop-item" :class="{ sold: item.sold }">
                <div class="si-card" :class="`rarity-${item.def.rarity}`" @mouseenter="showTooltip($event, item.def)" @mouseleave="hideTooltip">
                  <span class="si-icon">{{ item.def.icon }}</span>
                  <span class="si-name">{{ item.def.name }}</span>
                  <span class="si-rarity">{{ rarityName(item.def.rarity) }}</span>
                </div>
                <div class="si-price">${{ item.def.cost }}</div>
                <button class="buy-btn" :disabled="item.sold || game.money < item.def.cost || game.jokers.length >= 6" @click="state.buyShopItem(idx)">{{ item.sold ? '已售' : '购买' }}</button>
              </div>
            </div>
          </div>

          <div class="shop-section">
            <div class="section-label">🔮 消耗品</div>
            <div class="shop-grid-cons">
              <div v-for="(item, idx) in state.shopConsumables.value" :key="idx" class="shop-item" :class="{ sold: item.sold }">
                <div class="si-card cons" :class="item.type" @mouseenter="showConsTooltip($event, item)" @mouseleave="hideTooltip">
                  <span class="si-icon">{{ item.def.icon }}</span>
                  <span class="si-name">{{ item.def.name }}</span>
                  <span class="si-rarity">{{ item.type === 'tarot' ? '塔罗牌' : '星球牌' }}</span>
                </div>
                <div class="si-price">${{ item.def.cost }}</div>
                <button class="buy-btn" :disabled="item.sold || game.money < item.def.cost || game.consumables.length >= 2" @click="state.buyConsumable(idx)">{{ item.sold ? '已售' : '购买' }}</button>
              </div>
            </div>
          </div>

          <div class="shop-actions">
            <button class="btn btn-sort" @click="state.rerollShop()">🔄 刷新 (${{ 1 + game.rerollCount }})</button>
            <button class="btn btn-play" @click="state.nextLevel()">▶ 下一层</button>
          </div>
        </div>

        <div class="shop-right">
          <div class="owned-section">
            <div class="owned-label">当前小丑牌 (点击卖出)</div>
            <div class="owned-grid">
              <div v-for="(joker, idx) in game.jokers" :key="idx" class="mini-joker-wrap">
                <div
                  class="mini-joker"
                  :class="[`rarity-${getJokerDef(joker)?.rarity}`, { confirm: confirmingSell === 'joker-' + idx }]"
                  @mouseenter="showOwnedJokerTooltip($event, joker)"
                  @mouseleave="hideTooltip"
                  @click="handleSellJoker(idx)"
                >
                  <span class="mj-icon">{{ getJokerDef(joker)?.icon }}</span>
                  <span class="mj-name">{{ getJokerDef(joker)?.name }}</span>
                  <span class="mj-sell">${{ Math.max(1, Math.floor(getJokerDef(joker)?.cost / 2)) }}</span>
                </div>
                <div v-if="confirmingSell === 'joker-' + idx" class="confirm-sell">
                  <button class="confirm-btn" @click.stop="confirmSellJoker(idx)">确认卖出</button>
                  <button class="cancel-btn" @click.stop="cancelConfirm">取消</button>
                </div>
              </div>
              <div v-if="game.jokers.length === 0" class="empty-text">暂无</div>
            </div>
          </div>
          <div class="owned-section">
            <div class="owned-label">当前消耗品 (点击卖出)</div>
            <div class="owned-grid">
              <div v-for="(cons, idx) in game.consumables" :key="idx" class="mini-cons-wrap">
                <div
                  class="mini-cons"
                  :class="[cons.type, { confirm: confirmingSell === 'cons-' + idx }]"
                  @mouseenter="showOwnedConsTooltip($event, cons)"
                  @mouseleave="hideTooltip"
                  @click="handleSellConsumable(idx)"
                >
                  <span class="mj-icon">{{ getConsDef(cons)?.icon }}</span>
                  <span class="mj-name">{{ getConsDef(cons)?.name }}</span>
                  <span class="mj-sell">${{ Math.max(1, Math.floor((getConsDef(cons)?.cost || 3) / 2)) }}</span>
                </div>
                <div v-if="confirmingSell === 'cons-' + idx" class="confirm-sell">
                  <button class="confirm-btn" @click.stop="confirmSellConsumable(idx)">确认卖出</button>
                  <button class="cancel-btn" @click.stop="cancelConfirm">取消</button>
                </div>
              </div>
              <div v-if="game.consumables.length === 0" class="empty-text">暂无</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="tooltipContent" class="joker-tooltip" :style="tooltipStyle" v-html="tooltipContent"></div>
</template>

<script setup>
import { ref } from 'vue'
import { JOKERS } from '../data/jokers.js'
import { getConsumableDef } from '../data/consumables.js'
import { RARITY_NAMES } from '../data/constants.js'

const props = defineProps({ state: Object })
const game = props.state.game
const tooltipContent = ref('')
const tooltipStyle = ref({})
const confirmingSell = ref(null)

function rarityName(r) { return RARITY_NAMES[r] }
function getJokerDef(joker) { return JOKERS.find(j => j.id === joker.id) }
function getConsDef(cons) { return getConsumableDef(cons) }

function showTooltip(e, def) {
  tooltipContent.value = `
    <div style="font-size:22px;">${def.icon}</div>
    <div style="font-size:14px; font-weight:800; color:var(--gold); margin:4px 0;">${def.name}</div>
    <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">${RARITY_NAMES[def.rarity]} · $${def.cost}</div>
    <div style="font-size:11px; color:var(--text); line-height:1.5; max-width:180px;">${def.desc}</div>
  `
  tooltipStyle.value = { left: e.clientX + 15 + 'px', top: e.clientY - 10 + 'px' }
}

function showConsTooltip(e, item) {
  tooltipContent.value = `
    <div style="font-size:22px;">${item.def.icon}</div>
    <div style="font-size:14px; font-weight:800; color:var(--gold); margin:4px 0;">${item.def.name}</div>
    <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">${item.type === 'tarot' ? '塔罗牌' : '星球牌'} · $${item.def.cost}</div>
    <div style="font-size:11px; color:var(--text); line-height:1.5; max-width:180px;">${item.def.desc}</div>
  `
  tooltipStyle.value = { left: e.clientX + 15 + 'px', top: e.clientY - 10 + 'px' }
}

function showOwnedJokerTooltip(e, joker) {
  const def = getJokerDef(joker)
  if (!def) return
  const sellPrice = Math.max(1, Math.floor(def.cost / 2))
  const locked = joker.data?.locked
  tooltipContent.value = `
    <div style="font-size:22px;">${def.icon}</div>
    <div style="font-size:14px; font-weight:800; color:var(--gold); margin:4px 0;">${def.name}</div>
    <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">${RARITY_NAMES[def.rarity]} · 卖出价 $${sellPrice}</div>
    ${locked ? '<div style="font-size:11px; color:var(--red); margin-bottom:4px;">🔒 锁定，不可卖出</div>' : ''}
    <div style="font-size:11px; color:var(--text); line-height:1.5; max-width:180px;">${def.desc}</div>
  `
  tooltipStyle.value = { left: e.clientX + 15 + 'px', top: e.clientY - 10 + 'px' }
}

function showOwnedConsTooltip(e, cons) {
  const def = getConsDef(cons)
  if (!def) return
  tooltipContent.value = `
    <div style="font-size:22px;">${def.icon}</div>
    <div style="font-size:14px; font-weight:800; color:var(--gold); margin:4px 0;">${def.name}</div>
    <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">${cons.type === 'tarot' ? '塔罗牌' : '星球牌'}</div>
    <div style="font-size:11px; color:var(--text); line-height:1.5; max-width:180px;">${def.desc}</div>
  `
  tooltipStyle.value = { left: e.clientX + 15 + 'px', top: e.clientY - 10 + 'px' }
}

function hideTooltip() { tooltipContent.value = '' }

function handleSellJoker(idx) {
  const joker = game.jokers[idx]
  if (joker?.data?.locked) {
    props.state.showToast('锁定的小丑不能卖出!')
    return
  }
  if (confirmingSell.value === 'joker-' + idx) {
    props.state.sellJoker(idx)
    confirmingSell.value = null
  } else {
    confirmingSell.value = 'joker-' + idx
  }
}

function confirmSellJoker(idx) {
  props.state.sellJoker(idx)
  confirmingSell.value = null
}

function handleSellConsumable(idx) {
  if (confirmingSell.value === 'cons-' + idx) {
    props.state.sellConsumable(idx)
    confirmingSell.value = null
  } else {
    confirmingSell.value = 'cons-' + idx
  }
}

function confirmSellConsumable(idx) {
  props.state.sellConsumable(idx)
  confirmingSell.value = null
}

function cancelConfirm() {
  confirmingSell.value = null
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: linear-gradient(145deg, rgba(20,15,40,0.98), rgba(15,10,30,0.98)); border: 1px solid rgba(255,204,34,0.3); border-radius: 16px; padding: 20px; max-width: 720px; width: 92%; max-height: 90vh; overflow-y: auto; box-shadow: 0 0 40px rgba(255,204,34,0.15); }
h2 { font-size: 20px; color: var(--gold); margin-bottom: 8px; text-align: center; }
.shop-info { text-align: center; font-size: 12px; color: var(--muted); margin-bottom: 12px; }
.shop-layout { display: flex; gap: 16px; }
.shop-left { flex: 1; }
.shop-right { width: 170px; flex-shrink: 0; }
.shop-section { margin-bottom: 12px; }
.section-label { font-size: 13px; font-weight: 700; color: var(--accent2); margin-bottom: 8px; }
.shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
.shop-grid-cons { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
.shop-item { text-align: center; }
.si-card {
  width: 78px; height: 110px; border-radius: 10px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  padding: 6px 4px; cursor: pointer; transition: transform 0.2s;
}
.si-card.rarity-common { background: linear-gradient(145deg, #1a1a3e, #2d2d4e); border: 2px solid var(--rarity-common); }
.si-card.rarity-rare { background: linear-gradient(145deg, #0a1a3e, #1a2d5e); border: 2px solid var(--rarity-rare); }
.si-card.rarity-epic { background: linear-gradient(145deg, #2a0a3e, #3a1a5e); border: 2px solid var(--rarity-epic); }
.si-card.rarity-legend { background: linear-gradient(145deg, #3a2a0a, #5e4a1a); border: 2px solid var(--rarity-legend); }
.si-card.cons.tarot { background: linear-gradient(145deg, rgba(80,30,120,0.8), rgba(50,20,80,0.9)); border: 2px solid var(--purple); }
.si-card.cons.planet { background: linear-gradient(145deg, rgba(20,60,120,0.8), rgba(10,40,80,0.9)); border: 2px solid var(--blue); }
.si-card:hover { transform: translateY(-4px) scale(1.05); }
.si-icon { font-size: 26px; line-height: 1; }
.si-name { font-size: 9px; font-weight: 800; text-align: center; line-height: 1.1; color: var(--text); }
.si-rarity { font-size: 8px; color: var(--muted); }
.si-price { font-size: 13px; color: var(--gold); font-weight: 700; margin: 2px 0; }
.buy-btn {
  background: linear-gradient(135deg, var(--green), #00aa5e); color: #fff; border: none;
  border-radius: 6px; padding: 4px 14px; font-size: 11px; font-weight: 700; cursor: pointer;
}
.buy-btn:disabled { opacity: 0.4; cursor: not-allowed; background: var(--muted); }
.shop-actions { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
.owned-section { margin-bottom: 12px; }
.owned-label { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
.owned-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.mini-joker-wrap, .mini-cons-wrap { position: relative; }
.mini-joker, .mini-cons {
  width: 52px; height: 76px; border-radius: 6px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px; padding: 4px 2px; cursor: pointer;
  position: relative; transition: transform 0.2s, box-shadow 0.2s;
}
.mini-joker:hover, .mini-cons:hover { transform: scale(1.08); }
.mini-joker.confirm, .mini-cons.confirm { border-color: var(--red) !important; box-shadow: 0 0 12px rgba(255,51,102,0.4); animation: pulse 0.8s infinite; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 8px rgba(255,51,102,0.3); } 50% { box-shadow: 0 0 16px rgba(255,51,102,0.6); } }
.mini-joker.rarity-common { background: linear-gradient(145deg, #1a1a3e, #2d2d4e); border: 2px solid var(--rarity-common); }
.mini-joker.rarity-rare { background: linear-gradient(145deg, #0a1a3e, #1a2d5e); border: 2px solid var(--rarity-rare); }
.mini-joker.rarity-epic { background: linear-gradient(145deg, #2a0a3e, #3a1a5e); border: 2px solid var(--rarity-epic); }
.mini-joker.rarity-legend { background: linear-gradient(145deg, #3a2a0a, #5e4a1a); border: 2px solid var(--rarity-legend); }
.mini-cons.tarot { background: linear-gradient(145deg, rgba(80,30,120,0.8), rgba(50,20,80,0.9)); border: 2px solid var(--purple); }
.mini-cons.planet { background: linear-gradient(145deg, rgba(20,60,120,0.8), rgba(10,40,80,0.9)); border: 2px solid var(--blue); }
.mj-icon { font-size: 18px; }
.mj-name { font-size: 7px; font-weight: 700; text-align: center; line-height: 1.1; color: var(--text); }
.mj-sell { font-size: 8px; color: var(--gold); }
.empty-text { color: var(--muted); font-size: 10px; padding: 8px; }

.confirm-sell {
  position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 2px; z-index: 10; margin-top: 4px;
}
.confirm-sell .confirm-btn {
  background: var(--red); color: #fff; border: none; border-radius: 4px;
  padding: 3px 8px; font-size: 9px; font-weight: 700; cursor: pointer; white-space: nowrap;
}
.confirm-sell .confirm-btn:hover { filter: brightness(1.2); }
.confirm-sell .cancel-btn {
  background: rgba(255,255,255,0.1); color: var(--text); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px; padding: 3px 8px; font-size: 9px; cursor: pointer; white-space: nowrap;
}
.confirm-sell .cancel-btn:hover { background: rgba(255,255,255,0.15); }

.joker-tooltip { position: fixed; z-index: 500; pointer-events: none; background: rgba(10,10,30,0.97); border: 1px solid rgba(255,204,34,0.3); border-radius: 10px; padding: 10px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.6); max-width: 220px; }
</style>
