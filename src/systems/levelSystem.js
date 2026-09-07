import { bus, EVENTS } from '../utils/eventBus.js'
import { getTargetScore, isBossLevel } from '../data/constants.js'
import { useAudio } from '../composables/useAudio.js'

const { SFX } = useAudio()

/**
 * 关卡系统：管理关卡推进、胜负判定、复活
 * 负责的 state 字段：
 *   level, levelScore, targetScore, handsLeft, discardsLeft, handSize,
 *   lives, totalScore, maxSingleScore, lastPlayedHand, cleared, animating
 */
export function createLevelSystem(game, bus) {

  // ---------- 初始化 ----------

  function startRun(mode, character) {
    game.mode = mode
    game.character = character
    game.level = 1
    game.levelScore = 0
    game.targetScore = getTargetScore(1, mode)
    game.handsLeft = 4
    game.discardsLeft = 4
    game.handSize = 8
    game.lives = mode === 'simple' ? 1 : 0
    game.totalScore = 0
    game.maxSingleScore = 0
    game.cleared = false
    game.animating = false
    game.lastPlayedHand = null
    game.levelStartMoney = game.money
  }

  // ---------- 出牌结果处理 ----------

  function recordScore(result) {
    game.handsLeft--
    game.levelScore += result.total
    game.totalScore += result.total
    game.maxSingleScore = Math.max(game.maxSingleScore, result.total)
    game.lastPlayedHand = {
      type: result.type,
      chips: result.chips,
      mult: result.mult,
      total: result.total,
      cards: result.scoringCards.map(c => ({ rank: c.rank, suit: c.suit })),
      breakdown: result.breakdown,
    }
    SFX.play()
    bus.emit(EVENTS.SCORE_CALCULATED, { result })
  }

  // 出牌动画结束后判断胜负
  function afterPlayCheck() {
    if (game.levelScore >= game.targetScore) {
      winLevel()
      return 'win'
    }
    if (game.handsLeft <= 0) {
      loseLevel()
      return 'lose'
    }
    return 'continue'
  }

  // ---------- 胜利 ----------

  function winLevel() {
    SFX.win()
    const boss = isBossLevel(getEffectiveLevel())
    const exceed = game.levelScore >= game.targetScore * 2
    let reward = 0
    if (boss) reward += exceed ? 5 : 4
    else reward += exceed ? 5 : 3
    reward += game.handsLeft
    const interest = Math.floor(game.levelStartMoney * 0.2)
    reward += interest
    game.money += reward
    bus.emit(EVENTS.LEVEL_WON, { reward, boss, exceed })
  }

  // ---------- 下一层 ----------

  function nextLevel() {
    if (game.mode !== 'endless' && game.level >= 9) {
      gameClear()
      return false
    }

    game.level++
    game.levelScore = 0
    game.handsLeft = 4
    game.discardsLeft = 4
    game.handSize = 8
    game.levelStartMoney = game.money
    game.targetScore = getTargetScore(game.level, game.mode)
    SFX.levelUp()

    bus.emit(EVENTS.LEVEL_START, { level: game.level })

    if (game.mode === 'endless') {
      // 无尽模式最高层记录
    }
    return true
  }

  // ---------- 失败/复活 ----------

  function loseLevel() {
    SFX.lose()
    if (game.lives > 0) {
      game.lives--
      game.levelScore = 0
      game.handSize = 8
      game.handsLeft = 4
      game.discardsLeft = 4
      bus.emit(EVENTS.REVIVED, { lives: game.lives })
      return true // 复活了
    }
    gameOver()
    return false // 真死了
  }

  function gameOver() {
    bus.emit(EVENTS.GAME_OVER, {
      totalScore: game.totalScore,
      maxSingleScore: game.maxSingleScore,
      level: game.level,
    })
  }

  function gameClear() {
    SFX.win()
    setTimeout(() => SFX.achievement(), 400)
    game.cleared = true
    bus.emit(EVENTS.GAME_CLEAR, {
      totalScore: game.totalScore,
      mode: game.mode,
    })
  }

  // ---------- 辅助 ----------

  function getEffectiveLevel() {
    return game.mode === 'endless'
      ? ((game.level - 1) % 9) + 1
      : game.level
  }

  function isBossLevelNow() {
    return isBossLevel(getEffectiveLevel())
  }

  return {
    startRun,
    recordScore,
    afterPlayCheck,
    winLevel,
    nextLevel,
    loseLevel,
    gameOver,
    gameClear,
    getEffectiveLevel,
    isBossLevelNow,
  }
}
