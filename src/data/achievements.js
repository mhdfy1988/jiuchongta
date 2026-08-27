export const ACHIEVEMENTS = [
  { id: 'first_clear', name: '首次登顶', icon: '👑', desc: '首次通关困难九层塔', cond: (s) => s.hardClears >= 1 },
  { id: 'ten_clears', name: '十次登顶', icon: '🏰', desc: '通关困难九层塔10次', cond: (s) => s.hardClears >= 10 },
  { id: 'first_flush', name: '第一副同花顺', icon: '🎴', desc: '首次打出同花顺', cond: (s) => s.flushStraight },
  { id: 'royal', name: '皇家时刻', icon: '💎', desc: '首次打出皇家同花顺', cond: (s) => s.royalFlush },
  { id: 'five_kind', name: '不可能之牌', icon: '🌟', desc: '首次打出五条', cond: (s) => s.fiveKind },
  { id: 'fifty_k', name: '五万分', icon: '💰', desc: '困难模式单局50000分', cond: (s) => s.maxScore >= 50000 },
  { id: 'big_hand', name: '单手爆发', icon: '💥', desc: '单次出牌达到10000分', cond: (s) => s.maxSingleScore >= 10000 },
  { id: 'first_buy', name: '第一次购买', icon: '🛒', desc: '首次购买小丑', cond: (s) => s.firstBuy },
  { id: 'legend_buy', name: '传说登场', icon: '🔮', desc: '首次购买传说小丑', cond: (s) => s.legendBuy },
  { id: 'endless_10', name: '十层无尽', icon: '♾️', desc: '无尽达到第10层', cond: (s) => s.maxEndless >= 10 },
]
