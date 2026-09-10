import { JOKERS } from '../data/jokers.js'
import { TAROTS, PLANETS, VOUCHERS } from '../data/consumables.js'
import { BOSS_DEBUFFS } from '../data/bosses.js'
import { HAND_TYPES } from '../data/constants.js'

// 小丑 id -> 定义 的索引表，O(1) 查找
export const JOKER_MAP = new Map(JOKERS.map(j => [j.id, j]))

// 按稀有度分组的小丑池，商店直接用
export const JOKERS_BY_RARITY = JOKERS.reduce((acc, j) => {
  if (!acc[j.rarity]) acc[j.rarity] = []
  acc[j.rarity].push(j)
  return acc
}, {})

// 塔罗牌 id -> 定义
export const TAROT_MAP = new Map(TAROTS.map(t => [t.id, t]))

// 星球牌 id -> 定义
export const PLANET_MAP = new Map(PLANETS.map(p => [p.id, p]))

// 礼券牌 id -> 定义
export const VOUCHER_MAP = new Map(VOUCHERS.map(v => [v.id, v]))

// 统一的消耗品查找（按 type+id）
export function getConsumableDef(type, id) {
  if (type === 'tarot') return TAROT_MAP.get(id) || null
  if (type === 'planet') return PLANET_MAP.get(id) || null
  if (type === 'voucher') return VOUCHER_MAP.get(id) || null
  return null
}

// 所有 Boss 打平成 id -> 定义 的 Map
const allBosses = []
for (const pool of Object.values(BOSS_DEBUFFS)) {
  allBosses.push(...pool)
}
export const BOSS_MAP = new Map(allBosses.map(b => [b.id, b]))

// 牌型基础分（保持原结构，但加个只读校验）
export { HAND_TYPES }

// 辅助：获取小丑定义，找不到返回 null（比 Array.find 快得多）
export function getJoker(id) {
  return JOKER_MAP.get(id) || null
}
