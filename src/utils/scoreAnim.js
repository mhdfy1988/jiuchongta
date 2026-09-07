/**
 * 计分动画时间轴
 * ScoreAnimation.vue 与 useGameState.playHand 共用，保证视觉与状态解锁同步
 */
export const SA_TIMING = {
  TYPE: 380,       // 牌型名砸入
  FIRST: 220,      // 第一项(牌型基础)落地延迟
  STEP_SLOW: 180,  // 常规每条叠加间隔
  STEP_FAST: 110,  // 条目多(>8)时加速
  PRE_FINAL: 320,  // 最后一条到结算的停顿
  COUNT: 650,      // 总分数字滚动时长
  HOLD: 750,       // 结算展示停留
  FADE: 300,       // 淡出缓冲
}

/** 跳过动画时剩余需要的收尾时长(快速结算 + 停留 + 淡出) */
export const SA_SKIP_REMAIN = 250 + SA_TIMING.HOLD + SA_TIMING.FADE

export function scoreAnimDuration(result) {
  const len = result?.breakdown?.length || 1
  const n = Math.max(0, len - 1)
  const step = len > 8 ? SA_TIMING.STEP_FAST : SA_TIMING.STEP_SLOW
  return SA_TIMING.TYPE + SA_TIMING.FIRST + n * step +
    SA_TIMING.PRE_FINAL + SA_TIMING.COUNT + SA_TIMING.HOLD + SA_TIMING.FADE
}
