<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal collection-modal">
      <h2>📖 卡牌图鉴</h2>
      <div class="tabs">
        <button class="tab-btn" :class="{ active: tab === 'jokers' }" @click="switchTab('jokers')">🃏 小丑牌 ({{ jokers.length }})</button>
        <button class="tab-btn" :class="{ active: tab === 'tarots' }" @click="switchTab('tarots')">🔮 塔罗牌 ({{ tarots.length }})</button>
        <button class="tab-btn" :class="{ active: tab === 'planets' }" @click="switchTab('planets')">🪐 星球牌 ({{ planets.length }})</button>
      </div>

      <div class="tab-content" ref="contentRef">
        <!-- 小丑牌 -->
        <div v-if="tab === 'jokers'" class="card-grid">
          <div v-for="joker in pagedItems" :key="joker.id" class="info-card" :class="`rarity-${joker.rarity}`">
            <div class="ic-header">
              <span class="ic-icon">{{ joker.icon }}</span>
              <span class="ic-name">{{ joker.name }}</span>
            </div>
            <div class="ic-tags">
              <span class="ic-tag" :class="`tag-${joker.rarity}`">{{ rarityName(joker.rarity) }}</span>
              <span class="ic-tag tag-type">{{ typeName(joker.type) }}</span>
              <span v-if="joker.temp" class="ic-tag tag-temp">临时</span>
            </div>
            <div class="ic-desc">{{ joker.desc }}</div>
            <div class="ic-cost">${{ joker.cost }}</div>
          </div>
        </div>

        <!-- 塔罗牌 -->
        <div v-if="tab === 'tarots'" class="card-grid">
          <div v-for="tarot in pagedItems" :key="tarot.id" class="info-card tarot-card">
            <div class="ic-header">
              <span class="ic-icon">{{ tarot.icon }}</span>
              <span class="ic-name">{{ tarot.name }}</span>
            </div>
            <div class="ic-tags">
              <span class="ic-tag tag-tarot">塔罗牌</span>
            </div>
            <div class="ic-desc">{{ tarot.desc }}</div>
            <div class="ic-cost">${{ tarot.cost }}</div>
          </div>
        </div>

        <!-- 星球牌 -->
        <div v-if="tab === 'planets'" class="card-grid">
          <div v-for="planet in pagedItems" :key="planet.id" class="info-card planet-card">
            <div class="ic-header">
              <span class="ic-icon">{{ planet.icon }}</span>
              <span class="ic-name">{{ planet.name }}</span>
            </div>
            <div class="ic-tags">
              <span class="ic-tag tag-planet">星球牌</span>
              <span class="ic-tag tag-hand">{{ planet.handType }}</span>
            </div>
            <div class="ic-desc">{{ planet.desc }}</div>
            <div class="ic-cost">${{ planet.cost }}</div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="page--">‹ 上一页</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++">下一页 ›</button>
      </div>

      <button class="btn btn-play close-btn" @click="close">关闭</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { JOKERS } from '../data/jokers.js'
import { TAROTS, PLANETS } from '../data/consumables.js'

const props = defineProps({ state: Object })
const tab = ref('jokers')
const page = ref(1)
const contentRef = ref(null)
const cols = ref(3)
const rows = ref(3)

const jokers = JOKERS
const tarots = TAROTS
const planets = PLANETS

const pageSize = computed(() => 9)

const currentList = computed(() => {
  if (tab.value === 'jokers') return jokers
  if (tab.value === 'tarots') return tarots
  return planets
})

const totalPages = computed(() => Math.max(1, Math.ceil(currentList.value.length / pageSize.value)))

const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return currentList.value.slice(start, start + pageSize.value)
})

function recalcLayout() {
  if (!contentRef.value) return
  const w = contentRef.value.clientWidth
  const h = contentRef.value.clientHeight
  const cardW = 210
  const cardH = 130
  const gap = 8
  cols.value = Math.max(1, Math.floor((w + gap) / (cardW + gap)))
  rows.value = Math.max(1, Math.floor((h + gap) / (cardH + gap)))
}

let ro = null
onMounted(() => {
  nextTick(() => {
    recalcLayout()
    if (contentRef.value) {
      ro = new ResizeObserver(() => recalcLayout())
      ro.observe(contentRef.value)
    }
  })
})

onUnmounted(() => { if (ro) ro.disconnect() })

function switchTab(t) {
  tab.value = t
  page.value = 1
}

function rarityName(r) {
  return { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' }[r] || r
}

function typeName(t) {
  return { chips: '底分', mult: '倍率', xmult: '乘倍率', utility: '功能', temp: '临时' }[t] || t
}

function close() {
  props.state.showModal.value = null
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal { background: linear-gradient(145deg, rgba(20,15,40,0.98), rgba(15,10,30,0.98)); border: 1px solid rgba(255,204,34,0.3); border-radius: 16px; padding: 20px; max-width: 720px; width: 94%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 0 40px rgba(255,204,34,0.15); }
h2 { font-size: 20px; color: var(--gold); margin-bottom: 14px; text-align: center; }

.tabs { display: flex; gap: 8px; margin-bottom: 14px; justify-content: center; flex-wrap: wrap; }
.tab-btn {
  padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.3); color: var(--muted); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.tab-btn:hover { background: rgba(0,0,0,0.5); color: var(--text); }
.tab-btn.active { background: linear-gradient(135deg, rgba(255,204,34,0.2), rgba(170,68,255,0.15)); border-color: var(--gold); color: var(--gold); }

.tab-content { flex: 1; overflow: hidden; min-height: 280px; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
.info-card {
  background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
  padding: 10px; display: flex; flex-direction: column; gap: 6px; text-align: left;
  transition: all 0.2s; min-height: 120px;
}
.info-card:hover { background: rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }

.info-card.rarity-common { border-color: rgba(180,180,180,0.2); }
.info-card.rarity-rare { border-color: rgba(68,170,255,0.3); box-shadow: 0 0 8px rgba(68,170,255,0.08); }
.info-card.rarity-epic { border-color: rgba(170,68,255,0.3); box-shadow: 0 0 8px rgba(170,68,255,0.08); }
.info-card.rarity-legendary { border-color: rgba(255,204,34,0.4); box-shadow: 0 0 12px rgba(255,204,34,0.1); }
.info-card.tarot-card { border-color: rgba(170,68,255,0.25); }
.info-card.planet-card { border-color: rgba(68,170,255,0.25); }

.ic-header { display: flex; align-items: center; gap: 8px; }
.ic-icon { font-size: 22px; }
.ic-name { font-size: 14px; font-weight: 800; color: var(--text); }
.ic-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.ic-tag { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.tag-common { background: rgba(180,180,180,0.15); color: #aaa; }
.tag-rare { background: rgba(68,170,255,0.15); color: var(--blue); }
.tag-epic { background: rgba(170,68,255,0.15); color: var(--purple); }
.tag-legendary { background: rgba(255,204,34,0.15); color: var(--gold); }
.tag-type { background: rgba(255,255,255,0.06); color: var(--muted); }
.tag-temp { background: rgba(255,100,100,0.15); color: #ff6464; }
.tag-tarot { background: rgba(170,68,255,0.15); color: var(--purple); }
.tag-planet { background: rgba(68,170,255,0.15); color: var(--blue); }
.tag-hand { background: rgba(255,204,34,0.1); color: var(--gold); }
.ic-desc { font-size: 11px; color: var(--muted); line-height: 1.5; }
.ic-cost { font-size: 13px; font-weight: 800; color: var(--gold); align-self: flex-end; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 12px 0; flex-shrink: 0; }
.page-btn {
  padding: 6px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.3); color: var(--text); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
}
.page-btn:hover:not(:disabled) { background: rgba(255,204,34,0.1); border-color: var(--gold); color: var(--gold); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--muted); font-weight: 700; min-width: 50px; }

.close-btn { padding: 10px 32px; font-size: 14px; flex-shrink: 0; }
</style>
