export const BOSS_DEBUFFS = {
  weak: [
    { id: 'seal_king', name: '封王', desc: '人头牌无效(J/Q/K不计分,不触发人头小丑)' },
    { id: 'shackles', name: '镣铐', desc: '手牌上限-1' },
    { id: 'ocd', name: '强迫症', desc: '必须打出5张才计分' },
    { id: 'color_cut', name: '断色', desc: '随机一种花色不计分' },
  ],
  medium: [
    { id: 'only_one', name: '唯一', desc: '第一次计分的牌型被锁定,之后只有该牌型正常计分' },
    { id: 'no_repeat', name: '不许重复', desc: '每种牌型只能计分1次' },
    { id: 'silence', name: '沉默', desc: '随机1张永久小丑本层失效' },
    { id: 'called_out', name: '点名', desc: '每次出牌前随机指定1张手牌,必须打出或弃掉' },
  ],
  strong: [
    { id: 'high_wall', name: '高墙', desc: '目标分提高50%' },
    { id: 'pinhole', name: '针眼', desc: '只能出牌1次' },
    { id: 'no_discard', name: '无弃牌', desc: '换牌次数变为0' },
    { id: 'lockdown', name: '封锁', desc: '随机禁用一种牌型' },
  ],
}
