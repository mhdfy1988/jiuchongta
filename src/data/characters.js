export const CHARACTERS = [
  { id: 'normal', name: '普通人', icon: '🧑', desc: '不带初始小丑,6个位置全自由', unlockCondition: null, startJoker: null },
  { id: 'straight', name: '顺子牌手', icon: '🃏', desc: '初始自带"捷径"(顺子跳1点)', unlockCondition: '通关困难九层塔', startJoker: 'shortcut' },
  { id: 'flush', name: '同花牌手', icon: '🌸', desc: '初始自带"模糊"(红方同花/黑梅同花)', unlockCondition: '困难模式单局50000分', startJoker: 'fuzzy' },
]

export const MODES = [
  { id: 'simple', name: '简单模式', icon: '🌱', desc: '1次复活,低目标分,不计成就', unlockCondition: null },
  { id: 'hard', name: '困难模式', icon: '🔥', desc: '无复活,高目标分,计入成就', unlockCondition: null },
  { id: 'endless', name: '无尽模式', icon: '♾️', desc: '无尽的挑战', unlockCondition: '通关九层塔解锁' },
]
