import { reactive, ref } from 'vue'
import { bus, EVENTS } from '../utils/eventBus.js'
import { SAVE_KEY } from '../data/constants.js'
import { CHARACTERS, MODES } from '../data/characters.js'
import { useAudio } from './useAudio.js'
import { scoreAnimDuration } from '../utils/scoreAnim.js'

// 系统
import { createCardSystem } from '../systems/cardSystem.js'
import { createScoringSystem } from '../systems/scoringSystem.js'
import { createBossSystem } from '../systems/bossSystem.js'
import { createLevelSystem } from '../systems/levelSystem.js'
import { createJokerSystem } from '../systems/jokerSystem.js'
import { createShopSystem } from '../systems/shopSystem.js'
import { createConsumableSystem } from '../systems/consumableSystem.js'
import { createSaveSystem } from '../systems/saveSystem.js'
import { createAchievementSystem } from '../systems/achievementSystem.js'

const { SFX, initAudio } = useAudio()

/**
 * 游戏状态聚合层
 * 自身不包含业务逻辑，只组装各系统并协调它们的调用顺序
 * 对外提供统一的 API 给组件使用
 */
export function useGameState() {
  // ========== 共享状态 ==========
  const game = reactive({
    mode: null, character: null, level: 1,
    deck: [], hand: [], selected: [], jokers: [],
    money: 5, handsLeft: 4, discardsLeft: 4, handSize: 8,
    levelScore: 0, targetScore: 0,
    bossDebuff: null, silencedJoker: null,
    handTypeCounts: {}, cardEnhancements: {},
    lockedHandType: null, playedHandTypes: [],
    rerollCount: 0, levelStartMoney: 5, lives: 0,
    totalScore: 0, maxSingleScore: 0,
    animating: false, consumables: [], handUpgrades: {},
    pendingConsumable: null, pendingSuit: null, lastPlayedHand: null,
    calledOutId: null, cleared: false,
  })

  const stats = ref({})
  const selectedChar = ref(null)
  const selectedMode = ref(null)
  const screen = ref('start') // 'start' | 'game'
  const showModal = ref(null)
  const lastScoreResult = ref(null)
  const toasts = ref([])
  const jokerBonusPopups = ref([])
  let scoreTimer = null
  let pendingScoreResult = null
  // 本局开始时已有的成就快照,用于结算时计算"本局新解锁"
  const startAchievements = ref({})
  const newAchievements = ref([]) // 本局过程中新解锁的成就列表

  // ========== 系统实例 ==========
  const cards = createCardSystem(game, bus)
  const scoring = createScoringSystem()
  const boss = createBossSystem(game, bus)
  const level = createLevelSystem(game, bus)
  const jokers = createJokerSystem(game, bus)
  const shop = createShopSystem(game, bus)
  const consumables = createConsumableSystem(game, bus, cards)
  const saveSys = createSaveSystem(game, bus)
  const achievements = createAchievementSystem(stats, (s) => saveSys.saveStats(s), bus)

  // ========== UI 辅助 ==========

  function showToast(msg, isAchievement = false) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, msg, isAchievement })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
  }

  // ========== 事件监听（系统间协调） ==========

  const busHandlers = []

  function onBus(event, handler) {
    bus.on(event, handler)
    busHandlers.push([event, handler])
  }

  onBus(EVENTS.LEVEL_WON, () => {
    showModal.value = 'levelcomplete'
    SFX.levelComplete()
    saveSys.saveGameNow()
  })

  onBus(EVENTS.GAME_OVER, () => {
    achievements.recordMax('maxScore', game.totalScore)
    showModal.value = 'gameover'
    saveSys.clearSave()
  })

  onBus(EVENTS.GAME_CLEAR, () => {
    if (game.mode === 'hard') {
      const s = stats.value
      s.hardClears = (s.hardClears || 0) + 1
      if (!s.unlockedChars?.includes('straight')) {
        s.unlockedChars = [...(s.unlockedChars || []), 'straight']
        showToast('解锁角色: 顺子牌手!', true)
      }
    }
    achievements.recordMax('maxScore', game.totalScore)
    if (!stats.value.unlockedEndless) {
      stats.value.unlockedEndless = true
      showToast('解锁无尽模式!', true)
    }
    saveSys.clearSave()
    showModal.value = 'gameover'
  })

  onBus(EVENTS.REVIVED, ({ lives }) => {
    showToast(`复活! 剩余复活次数: ${lives}`)
    boss.reapplyForRevive()
    cards.initDeck()
    cards.draw(game.handSize)
    boss.ensureCalledOut()
    saveSys.saveGame()
  })

  onBus(EVENTS.ITEM_BOUGHT, ({ type }) => {
    if (type === 'joker') {
      if (!stats.value.firstBuy) { stats.value.firstBuy = true; achievements.checkAll() }
    }
    saveSys.saveGame()
  })

  onBus(EVENTS.ACHIEVEMENT_UNLOCKED, ({ achievement }) => {
    showToast(`🏆 成就解锁: ${achievement.name}!`, true)
    if (!newAchievements.value.find(a => a.id === achievement.id)) {
      newAchievements.value.push(achievement)
    }
  })

  // ========== 游戏流程 API ==========

  function startGame() {
    const charDef = CHARACTERS.find(c => c.id === selectedChar.value)

    // 记录本局开始时的成就快照
    startAchievements.value = { ...stats.value }
    newAchievements.value = []

    // 重置状态
    game.money = 5
    game.handTypeCounts = {}
    game.cardEnhancements = {}
    game.handUpgrades = {}
    game.rerollCount = 0
    game.consumables = []
    game.pendingConsumable = null
    game.pendingSuit = null
    if (scoreTimer) { clearTimeout(scoreTimer); scoreTimer = null }
    pendingScoreResult = null
    lastScoreResult.value = null

    level.startRun(selectedMode.value, selectedChar.value)
    boss.resetForNewLevel()

    // 初始小丑
    game.jokers = []
    if (charDef?.startJoker) {
      jokers.addJoker(charDef.startJoker, { locked: true })
    }

    cards.initDeck()
    boss.pickBoss()
    cards.draw(game.handSize)
    boss.ensureCalledOut() // 点名 Boss:抽完手牌后立刻点名

    screen.value = 'game'
    SFX.gameStart()
    const modeName = game.mode === 'simple' ? '简单' : game.mode === 'hard' ? '困难' : '无尽'
    showToast(`第1层 ${modeName}模式`)
    saveSys.saveGame()
  }

  function selectCard(cardId) {
    initAudio()
    if (consumables.isPending()) {
      const def = consumables.getPendingDef()
      const maxSel = def ? def.selectCount : 1
      const ok = cards.selectCard(cardId, { maxSelect: maxSel })
      if (!ok && game.selected.length >= maxSel) {
        showToast(`最多选择 ${maxSel} 张`)
      }
      if (def && def.id === 'the_world' && game.selected.length >= def.selectCount) {
        game.pendingSuit = null
      }
      return
    }
    cards.selectCard(cardId, { maxSelect: 5 })
  }

  function playHand() {
    if (game.animating) return
    if (consumables.isPending()) { showToast('请先完成消耗品使用'); return }
    if (game.selected.length === 0) { showToast('请选择至少1张牌'); return }
    if (game.handsLeft <= 0) { showToast('没有出牌次数了!'); return }

    const selectedCards = cards.getSelectedCards()
    const result = scoring.calculateScore(selectedCards, game)

    // Boss 校验
    const blockedMsg = boss.validatePlay(result.type)
    if (blockedMsg) { showToast(blockedMsg); return }

    // 计分延迟到动画结束后(见 finishScoreAnim),让左侧当前分在特效播完后再上涨
    pendingScoreResult = result
    boss.recordPlayed(result.type)

    // 成就检测
    if (result.type === '同花顺' && !stats.value.flushStraight) { stats.value.flushStraight = true; achievements.checkAll() }
    if (result.type === '皇家同花顺' && !stats.value.royalFlush) { stats.value.royalFlush = true; achievements.checkAll() }
    if (result.type === '五条' && !stats.value.fiveKind) { stats.value.fiveKind = true; achievements.checkAll() }
    achievements.recordMax('maxSingleScore', result.total)

    game.animating = true
    lastScoreResult.value = result

    // 小丑 onPlay 触发
    jokers.triggerOnPlay(result.type)

    // 小丑触发飘字动画
    if (result.triggerLog && result.triggerLog.length > 0) {
      result.triggerLog.forEach((log, i) => {
        if (log.jokerIdx !== undefined) {
          setTimeout(() => {
            jokerBonusPopups.value.push({
              jokerIdx: log.jokerIdx,
              text: (log.chips > 0 ? `+${log.chips}` : '') + (log.mult > 0 ? ` +${log.mult}倍` : ''),
              color: log.chips > 0 ? 'var(--green)' : 'var(--accent2)',
            })
            setTimeout(() => {
              jokerBonusPopups.value = jokerBonusPopups.value.filter(p =>
                !(p.jokerIdx === log.jokerIdx && p.text === ((log.chips > 0 ? `+${log.chips}` : '') + (log.mult > 0 ? ` +${log.mult}倍` : '')))
              )
            }, 1000)
          }, 700 + i * 200)
        }
      })
    }

    // 清理消耗型小丑
    jokers.consumeTempJokers()

    // 移除已出牌，补牌
    cards.removeSelected()
    cards.draw(selectedCards.length)

    // 点名 Boss：下一张
    if (game.bossDebuff?.id === 'called_out') boss.rollCalledOut()

    scoreTimer = setTimeout(finishScoreAnim, scoreAnimDuration(result))

    saveSys.saveGame()
  }

  // 计分动画收尾:计分入帐 → 解锁操作 → 胜负检查
  function finishScoreAnim() {
    scoreTimer = null
    game.animating = false
    lastScoreResult.value = null
    if (pendingScoreResult) {
      level.recordScore(pendingScoreResult)
      pendingScoreResult = null
      saveSys.saveGame()
    }
    level.afterPlayCheck()
  }

  // 点击跳过动画:立即跳到结算,缩短收尾等待
  function skipScoreAnim(remaining = 1300) {
    if (!lastScoreResult.value) return
    if (scoreTimer) clearTimeout(scoreTimer)
    scoreTimer = setTimeout(finishScoreAnim, remaining)
  }

  function discardCards() {
    if (consumables.isPending()) { showToast('请先完成消耗品使用'); return }
    if (game.selected.length === 0) { showToast('请选择要弃的牌'); return }
    if (game.discardsLeft <= 0) { showToast('没有换牌次数了!'); return }

    // 点名校验
    const calledMsg = boss.checkCalledOut()
    if (calledMsg) { showToast(calledMsg); return }

    const discarded = cards.getSelectedCards()
    cards.removeSelected()
    game.discardsLeft--
    cards.draw(discarded.length)
    SFX.discard()

    if (game.bossDebuff?.id === 'called_out') boss.rollCalledOut()

    const discardEval = scoring.evaluateHand(discarded, game)
    jokers.triggerOnDiscard(discarded, discardEval.type)

    saveSys.saveGame()
  }

  function goToShop() {
    showModal.value = null
    shop.generate(!!game.bossDebuff)
    showModal.value = 'shop'
    SFX.shopOpen()
    saveSys.saveGame()
  }

  function nextLevel() {
    showModal.value = null
    const continued = level.nextLevel()
    if (!continued) return // 已经通关了

    boss.resetForNewLevel()
    cards.initDeck()
    boss.pickBoss()
    cards.draw(game.handSize)
    boss.ensureCalledOut() // 点名 Boss:抽完手牌后立刻点名

    if (game.mode === 'endless') {
      stats.value.maxEndless = Math.max(stats.value.maxEndless || 0, game.level)
      saveSys.saveStats()
    }
    saveSys.saveGame()
    const blindName = boss.isBoss() ? 'Boss层' : '普通层'
    showToast(`第${game.level}层 - ${blindName}`)
  }

  function loseLevel() {
    level.loseLevel()
  }

  function exitToMenu() {
    saveSys.saveGameNow()
    showModal.value = null
    screen.value = 'start'
  }

  function continueGame() {
    stats.value = saveSys.loadStats()
    if (saveSys.loadGame()) {
      screen.value = 'game'
      return true
    }
    return false
  }

  // ========== 商店 API（兼容旧调用） ==========

  const shopItems = shop.items
  const shopConsumables = shop.consumables

  function generateShopItems() { shop.generate(!!game.bossDebuff) }
  function buyShopItem(idx) {
    const ok = shop.buyJoker(idx)
    if (ok) {
      const item = shop.items.value[idx]
      if (item?.def?.rarity === 'legend' && !stats.value.legendBuy) {
        stats.value.legendBuy = true
        achievements.checkAll()
      }
      saveSys.saveStats()
    }
  }
  function sellJoker(idx) {
    const price = jokers.sellJoker(idx)
    if (price) saveSys.saveGame()
  }
  function deleteJoker(idx) { sellJoker(idx) }
  function rerollShop() { shop.reroll() }
  function buyConsumable(idx) { shop.buyConsumable(idx) }

  // ========== 消耗品 API（兼容旧调用） ==========

  function useConsumable(idx) { consumables.startUse(idx) }
  function sellConsumable(idx) { consumables.sellConsumable(idx); saveSys.saveGame() }
  function pickSuit(suit) { consumables.pickSuit(suit) }
  function confirmConsumable() {
    const result = consumables.confirmUse()
    if (result?.error) showToast(result.error)
    else if (result?.success) { showToast(`使用了 ${result.name}`); saveSys.saveGame() }
  }
  function cancelConsumable() { consumables.cancelUse() }

  // ========== 排序 ==========

  function sortByRank() { cards.sortByRank() }
  function sortBySuit() { cards.sortBySuit() }

  // ========== 成就 ==========

  function checkAchievements() { achievements.checkAll() }

  // ========== 初始化 ==========

  stats.value = saveSys.loadStats()

  return {
    // 状态
    game, stats, startAchievements, newAchievements, selectedChar, selectedMode,
    shopItems, shopConsumables,
    screen, showModal, lastScoreResult, toasts, jokerBonusPopups,
    // 系统引用（方便组件直接用）
    cards, scoring, boss, level, jokers, shop, consumables,
    // 游戏流程
    startGame, selectCard, playHand, discardCards, skipScoreAnim,
    goToShop, nextLevel, loseLevel,
    exitToMenu, continueGame,
    // 商店
    generateShopItems, buyShopItem, sellJoker, deleteJoker, rerollShop, buyConsumable,
    // 消耗品
    useConsumable, sellConsumable, pickSuit, confirmConsumable, cancelConsumable,
    // 其他
    checkAchievements,
    saveGame: () => saveSys.saveGame(),
    saveGameNow: () => saveSys.saveGameNow(),
    loadGame: () => saveSys.loadGame(),
    hasSave: () => saveSys.hasSave(),
    clearSave: () => saveSys.clearSave(),
    sortByRank, sortBySuit,
    showToast, SFX, initAudio,
    // 计分
    evaluateHand: scoring.evaluateHand,
    calculateScore: scoring.calculateScore,
    // 清理
    cleanup: () => { busHandlers.forEach(([e, h]) => bus.off(e, h)) },
  }
}
