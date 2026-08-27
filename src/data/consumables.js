import { SUITS, RANKS } from './constants.js'

export const TAROTS = [
  { id:'the_fool', name:'愚者', icon:'🃏', cost:3, desc:'选1张手牌变成随机牌', selectCount:1,
    use: (game, selected) => { if (selected.length < 1) return false; const c = selected[0]; c.rank = RANKS[Math.floor(Math.random()*13)]; c.suit = SUITS[Math.floor(Math.random()*4)]; return true; } },
  { id:'the_magician', name:'魔术师', icon:'🎩', cost:3, desc:'选2张手牌变成A', selectCount:2,
    use: (game, selected) => { if (selected.length < 2) return false; selected[0].rank = 'A'; selected[1].rank = 'A'; return true; } },
  { id:'the_emperor', name:'皇帝', icon:'👑', cost:3, desc:'选2张手牌变成K', selectCount:2,
    use: (game, selected) => { if (selected.length < 2) return false; selected[0].rank = 'K'; selected[1].rank = 'K'; return true; } },
  { id:'the_priestess', name:'女祭司', icon:'🔮', cost:3, desc:'选2张手牌变成Q', selectCount:2,
    use: (game, selected) => { if (selected.length < 2) return false; selected[0].rank = 'Q'; selected[1].rank = 'Q'; return true; } },
  { id:'death', name:'死神', icon:'💀', cost:3, desc:'选2张手牌,第1张变成第2张的点数', selectCount:2,
    use: (game, selected) => { if (selected.length < 2) return false; selected[0].rank = selected[1].rank; return true; } },
  { id:'the_tower', name:'高塔', icon:'🗼', cost:3, desc:'选1张手牌销毁(牌堆变薄)', selectCount:1,
    use: (game, selected) => { if (selected.length < 1) return false; return 'destroy'; } },
  { id:'judgement', name:'审判', icon:'⚖️', cost:4, desc:'选1张手牌,随机变花色', selectCount:1,
    use: (game, selected) => { if (selected.length < 1) return false; selected[0].suit = SUITS[Math.floor(Math.random()*4)]; return true; } },
  { id:'the_world', name:'世界', icon:'🌍', cost:4, desc:'选1张手牌,自选花色', selectCount:1,
    use: (game, selected) => { if (selected.length < 1) return false; return 'choose_suit'; } },
]

export const PLANETS = [
  { id:'mercury', name:'水星', icon:'☿', cost:3, handType:'一对', desc:'升级一对 +1倍率' },
  { id:'venus', name:'金星', icon:'♀', cost:3, handType:'两对', desc:'升级两对 +1倍率' },
  { id:'earth', name:'地球', icon:'⊕', cost:3, handType:'三条', desc:'升级三条 +2倍率' },
  { id:'mars', name:'火星', icon:'♂', cost:3, handType:'顺子', desc:'升级顺子 +3底分' },
  { id:'jupiter', name:'木星', icon:'♃', cost:3, handType:'同花', desc:'升级同花 +2倍率' },
  { id:'saturn', name:'土星', icon:'♄', cost:3, handType:'葫芦', desc:'升级葫芦 +3倍率' },
  { id:'uranus', name:'天王星', icon:'♅', cost:4, handType:'四条', desc:'升级四条 +3倍率' },
  { id:'neptune', name:'海王星', icon:'♆', cost:4, handType:'同花顺', desc:'升级同花顺 +4倍率' },
  { id:'pluto', name:'冥王星', icon:'♇', cost:4, handType:'高牌', desc:'升级高牌 +2底分+1倍率' },
]

export function getConsumableDef(consumable) {
  if (consumable.type === 'tarot') return TAROTS.find(t => t.id === consumable.id)
  if (consumable.type === 'planet') return PLANETS.find(p => p.id === consumable.id)
  return null
}
