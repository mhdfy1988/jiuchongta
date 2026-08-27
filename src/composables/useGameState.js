import { reactive, ref } from 'vue'
import {
  SUITS, RANKS, RANK_VALUES, HAND_TYPES, SAVE_KEY,
  isBossLevel, getTargetScore, getBossPool
} from '../data/constants.js'
import { JOKERS } from '../data/jokers.js'
import { TAROTS, PLANETS, getConsumableDef } from '../data/consumables.js'
import { BOSS_DEBUFFS } from '../data/bosses.js'
import { CHARACTERS, MODES } from '../data/characters.js'
import { ACHIEVEMENTS } from '../data/achievements.js'
import { createDeck, shuffle, drawCards } from '../utils/cardUtils.js'
import { useScoring } from './useScoring.js'
import { useAudio } from './useAudio.js'

const { evaluateHand, calculateScore } = useScoring()
const { SFX, initAudio } = useAudio()

export function useGameState() {
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
    calledOutIndex: null,
  })

  const stats = ref(loadStats())
  const selectedChar = ref(null)
  const selectedMode = ref(null)
  const shopItems = ref([])
  const shopConsumables = ref([])
  const screen = ref('start') // 'start' | 'game'
  const showModal = ref(null) // null | 'levelcomplete' | 'shop' | 'gameover' | 'handchart' | 'deckview' | 'runstats'
  const lastScoreResult = ref(null)
  const toasts = ref([])
  const jokerBonusPopups = ref([])
  const hasSaveData = ref(false)

  function updateSaveFlag() {
    try { hasSaveData.value = !!localStorage.getItem(SAVE_KEY) } catch(e) { hasSaveData.value = false }
  }
  updateSaveFlag()

  function loadStats() {
    try { return JSON.parse(localStorage.getItem('pokerRoguelikeStats')) || {} } catch(e) { return {} }
  }
  function saveStats() { localStorage.setItem('pokerRoguelikeStats', JSON.stringify(stats.value)) }

  function showToast(msg, isAchievement = false) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, msg, isAchievement })
    setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 3000)
  }

  function startGame() {
    const charDef = CHARACTERS.find(c => c.id === selectedChar.value)
    const startJokers = []
    if (charDef.startJoker) {
      startJokers.push({ id: charDef.startJoker, data: { stacks: 0, locked: true } })
    }

    Object.assign(game, {
      mode: selectedMode.value, character: selectedChar.value, level: 1,
      deck: shuffle(createDeck()), hand: [], selected: [], jokers: startJokers,
      money: 5, handsLeft: 4, discardsLeft: 4, handSize: 8,
      levelScore: 0, targetScore: getTargetScore(1, selectedMode.value),
      bossDebuff: null, silencedJoker: null,
      handTypeCounts: {}, cardEnhancements: {},
      lockedHandType: null, playedHandTypes: [],
      rerollCount: 0, levelStartMoney: 5,
      lives: selectedMode.value === 'simple' ? 1 : 0,
      totalScore: 0, maxSingleScore: 0, animating: false,
      consumables: [], handUpgrades: {},
      pendingConsumable: null, pendingSuit: null, lastPlayedHand: null, calledOutIndex: null,
    })

    applyBossDebuff()
    drawCards(game, game.handSize)
    if (game.bossDebuff?.id === 'called_out' && game.hand.length > 0) {
      game.calledOutIndex = Math.floor(Math.random() * game.hand.length)
    }
    screen.value = 'game'
    const modeName = game.mode === 'simple' ? '简单' : game.mode === 'hard' ? '困难' : '无尽'
    showToast(`第1层 ${modeName}模式`)
    saveGame()
  }

  function applyBossDebuff() {
    if (!isBossLevel(game.level) && game.mode !== 'endless') { game.bossDebuff = null; return }
    if (game.mode === 'endless' && !isBossLevel(((game.level - 1) % 9) + 1)) { game.bossDebuff = null; return }

    const poolName = game.mode === 'endless' ? getBossPool(((game.level - 1) % 9) + 1) : getBossPool(game.level)
    const pool = BOSS_DEBUFFS[poolName]
    game.bossDebuff = { ...pool[Math.floor(Math.random() * pool.length)] }

    if (game.bossDebuff.id === 'shackles') game.handSize = 7
    if (game.bossDebuff.id === 'no_discard') game.discardsLeft = 0
    if (game.bossDebuff.id === 'pinhole') game.handsLeft = 1
    if (game.bossDebuff.id === 'high_wall') game.targetScore = Math.floor(game.targetScore * 1.5)
    if (game.bossDebuff.id === 'color_cut') game.bossDebuff.disabledSuit = SUITS[Math.floor(Math.random() * 4)]
    if (game.bossDebuff.id === 'lockdown') {
      const types = ['同花顺','同花','顺子','葫芦','四条','一对']
      game.bossDebuff.disabledHand = types[Math.floor(Math.random() * types.length)]
    }
    if (game.bossDebuff.id === 'silence' && game.jokers.length > 0) {
      const permanent = game.jokers.filter(j => !j.data?.locked)
      if (permanent.length > 0) game.silencedJoker = permanent[Math.floor(Math.random() * permanent.length)]
    }
  }

  function selectCard(index) {
    initAudio()
    if (game.pendingConsumable !== null && game.pendingConsumable !== undefined) {
      const cons = game.consumables[game.pendingConsumable]
      const def = cons ? TAROTS.find(t => t.id === cons.id) : null
      const maxSel = def ? def.selectCount : 1
      const idx = game.selected.indexOf(index)
      if (idx >= 0) { game.selected.splice(idx, 1); SFX.deselect() }
      else if (game.selected.length < maxSel) { game.selected.push(index); SFX.select() }
      else { showToast(`最多选择 ${maxSel} 张`); return }
      if (def && def.id === 'the_world' && game.selected.length >= def.selectCount) {
        game.pendingSuit = null
      }
      return
    }
    const idx = game.selected.indexOf(index)
    if (idx >= 0) { game.selected.splice(idx, 1); SFX.deselect() }
    else if (game.selected.length < 5) { game.selected.push(index); SFX.select() }
  }

  function playHand() {
    if (game.animating) return
    if (game.pendingConsumable !== null) { showToast('请先完成消耗品使用'); return }
    if (game.selected.length === 0) { showToast('请选择至少1张牌'); return }
    if (game.handsLeft <= 0) { showToast('没有出牌次数了!'); return }
    if (game.bossDebuff?.id === 'ocd' && game.selected.length < 5) { showToast('强迫症: 必须打出5张!'); return }

    if (game.bossDebuff?.id === 'called_out' && game.calledOutIndex !== null) {
      if (game.calledOutIndex >= game.hand.length) {
        game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null
      }
      if (game.calledOutIndex !== null && !game.selected.includes(game.calledOutIndex)) {
        showToast('点名: 必须打出或弃掉指定的牌!'); return
      }
    }

    const selectedCards = game.selected.map(i => game.hand[i])
    const result = calculateScore(selectedCards, game)

    if (game.bossDebuff?.id === 'only_one') {
      if (!game.lockedHandType) game.lockedHandType = result.type
      else if (result.type !== game.lockedHandType) { showToast(`唯一: 只能打${game.lockedHandType}!`); return }
    }
    if (game.bossDebuff?.id === 'no_repeat' && game.playedHandTypes.includes(result.type)) {
      showToast(`不许重复: ${result.type}已打过!`); return
    }
    if (game.bossDebuff?.id === 'lockdown' && game.bossDebuff.disabledHand) {
      const dh = game.bossDebuff.disabledHand
      if (result.type === dh || (dh === '一对' && result.type === '两对') || (dh === '同花顺' && result.type === '皇家同花顺')) {
        showToast(`封锁: ${dh}被禁用!`); return
      }
    }

    game.handsLeft--
    game.levelScore += result.total
    game.totalScore += result.total
    game.maxSingleScore = Math.max(game.maxSingleScore, result.total)
    game.lastPlayedHand = {
      type: result.type,
      chips: result.chips,
      mult: result.mult,
      total: result.total,
      cards: selectedCards.map(c => ({ rank: c.rank, suit: c.suit })),
      breakdown: result.breakdown
    }
    SFX.play()

    game.handTypeCounts[result.type] = (game.handTypeCounts[result.type] || 0) + 1
    game.playedHandTypes = [...game.playedHandTypes, result.type]

    if (result.type === '同花顺' && !stats.value.flushStraight) { stats.value.flushStraight = true; checkAchievements() }
    if (result.type === '皇家同花顺' && !stats.value.royalFlush) { stats.value.royalFlush = true; checkAchievements() }
    if (result.type === '五条' && !stats.value.fiveKind) { stats.value.fiveKind = true; checkAchievements() }
    stats.value.maxSingleScore = Math.max(stats.value.maxSingleScore || 0, result.total)
    saveStats()

    game.animating = true
    lastScoreResult.value = result

    game.jokers.forEach(joker => {
      const def = JOKERS.find(j => j.id === joker.id)
      if (def?.onPlay) def.onPlay(joker, result.type)
    })

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

    for (let i = game.jokers.length - 1; i >= 0; i--) {
      const def = JOKERS.find(j => j.id === game.jokers[i].id)
      if (def?.consumeOnUse) game.jokers.splice(i, 1)
    }

    const selSet = new Set(game.selected)
    game.hand = game.hand.filter((_, i) => !selSet.has(i))
    game.selected = []
    drawCards(game, selectedCards.length)

    if (game.bossDebuff?.id === 'called_out') {
      game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null
    }

    setTimeout(() => {
      game.animating = false
      lastScoreResult.value = null
      if (game.levelScore >= game.targetScore) winLevel()
      else if (game.handsLeft <= 0) loseLevel()
    }, 1400)

    saveGame()
  }

  function discardCards() {
    if (game.pendingConsumable !== null) { showToast('请先完成消耗品使用'); return }
    if (game.selected.length === 0) { showToast('请选择要弃的牌'); return }
    if (game.discardsLeft <= 0) { showToast('没有换牌次数了!'); return }

    if (game.bossDebuff?.id === 'called_out' && game.calledOutIndex !== null) {
      if (game.calledOutIndex >= game.hand.length) {
        game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null
      }
      if (game.calledOutIndex !== null && !game.selected.includes(game.calledOutIndex)) {
        showToast('点名: 必须打出或弃掉指定的牌!'); return
      }
    }

    const selSet = new Set(game.selected)
    const discarded = game.selected.map(i => game.hand[i])
    game.hand = game.hand.filter((_, i) => !selSet.has(i))
    game.selected = []
    game.discardsLeft--
    drawCards(game, discarded.length)
    SFX.discard()

    if (game.bossDebuff?.id === 'called_out') {
      game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null
    }

    const discardEval = evaluateHand(discarded, game)
    game.jokers.forEach(joker => {
      const def = JOKERS.find(j => j.id === joker.id)
      if (def?.onDiscard) def.onDiscard(discarded, joker, discardEval.type)
    })

    saveGame()
  }

  function winLevel() {
    SFX.win()
    const isBoss = isBossLevel(game.level) || (game.mode === 'endless' && isBossLevel(((game.level - 1) % 9) + 1))
    const exceed = game.levelScore >= game.targetScore * 2
    let reward = 0
    if (isBoss) reward += exceed ? 5 : 4
    else reward += exceed ? 5 : 3
    reward += game.handsLeft
    const interest = Math.floor(game.levelStartMoney * 0.2)
    reward += interest
    game.money += reward
    showModal.value = 'levelcomplete'
    saveGame()
  }

  function goToShop() {
    showModal.value = null
    game.rerollCount = 0
    generateShopItems()
    showModal.value = 'shop'
    saveGame()
  }

  function nextLevel() {
    showModal.value = null
    if (game.mode !== 'endless' && game.level >= 9) { gameClear(); return }

    game.level++
    game.levelScore = 0
    game.handsLeft = 4
    SFX.levelUp()
    game.discardsLeft = 4
    game.handSize = 8
    game.bossDebuff = null
    game.silencedJoker = null
    game.lockedHandType = null
    game.playedHandTypes = []
    game.calledOutIndex = null
    game.levelStartMoney = game.money
    game.targetScore = getTargetScore(game.level, game.mode)
    game.deck = shuffle(createDeck())
    game.hand = []
    game.selected = []
    applyBossDebuff()
    drawCards(game, game.handSize)
    if (game.bossDebuff?.id === 'called_out' && game.hand.length > 0) {
      game.calledOutIndex = Math.floor(Math.random() * game.hand.length)
    }

    if (game.mode === 'endless') {
      stats.value.maxEndless = Math.max(stats.value.maxEndless || 0, game.level)
    }
    saveStats()
    saveGame()
    const blindName = isBossLevel(((game.level - 1) % 9) + 1) ? 'Boss层' : '普通层'
    showToast(`第${game.level}层 - ${blindName}`)
  }

  function loseLevel() {
    SFX.lose()
    if (game.lives > 0) {
      game.lives--
      showToast(`复活! 剩余复活次数: ${game.lives}`)
      game.handsLeft = 4
      game.discardsLeft = 4
      game.levelScore = 0
      game.deck = shuffle(createDeck())
      game.hand = []
      game.selected = []
      game.calledOutIndex = null
      drawCards(game, game.handSize)
      if (game.bossDebuff?.id === 'called_out' && game.hand.length > 0) {
        game.calledOutIndex = Math.floor(Math.random() * game.hand.length)
      }
      saveGame()
      return
    }
    gameOver()
  }

  function gameOver() {
    stats.value.maxScore = Math.max(stats.value.maxScore || 0, game.totalScore)
    checkAchievements()
    saveStats()
    clearSave()
    showModal.value = 'gameover'
  }

  function gameClear() {
    SFX.win()
    setTimeout(() => SFX.achievement(), 400)
    if (game.mode === 'hard') {
      stats.value.hardClears = (stats.value.hardClears || 0) + 1
      if (!stats.value.unlockedChars?.includes('straight')) {
        stats.value.unlockedChars = [...(stats.value.unlockedChars || []), 'straight']
        showToast('解锁角色: 顺子牌手!', true)
      }
    }
    stats.value.maxScore = Math.max(stats.value.maxScore || 0, game.totalScore)
    if (!stats.value.unlockedEndless) { stats.value.unlockedEndless = true; showToast('解锁无尽模式!', true) }
    checkAchievements()
    saveStats()
    clearSave()
    showModal.value = 'gameover'
  }

  function generateShopItems() {
    const isBoss = isBossLevel(game.level) || (game.mode === 'endless' && isBossLevel(((game.level - 1) % 9) + 1))
    const count = isBoss ? 3 : 2
    shopItems.value = []
    for (let i = 0; i < count; i++) {
      shopItems.value.push(generateShopItem(isBoss, i === 0 && isBoss))
    }
    shopConsumables.value = []
    const consCount = Math.random() < 0.5 ? 2 : 1
    for (let i = 0; i < consCount; i++) {
      if (Math.random() < 0.6) {
        const t = TAROTS[Math.floor(Math.random() * TAROTS.length)]
        shopConsumables.value.push({ def: { ...t }, type: 'tarot', sold: false })
      } else {
        const p = PLANETS[Math.floor(Math.random() * PLANETS.length)]
        shopConsumables.value.push({ def: { ...p }, type: 'planet', sold: false })
      }
    }
  }

  function generateShopItem(isBoss, forceEpicPlus) {
    const rarityTable = isBoss
      ? [{r:'common',w:25},{r:'rare',w:35},{r:'epic',w:30},{r:'legend',w:10}]
      : [{r:'common',w:50},{r:'rare',w:30},{r:'epic',w:15},{r:'legend',w:5}]
    let rarity
    if (forceEpicPlus) rarity = Math.random() < 0.67 ? 'epic' : 'legend'
    else {
      const total = rarityTable.reduce((s, r) => s + r.w, 0)
      let roll = Math.random() * total
      for (const r of rarityTable) { roll -= r.w; if (roll <= 0) { rarity = r.r; break } }
    }
    const candidates = JOKERS.filter(j => j.rarity === rarity)
    const def = candidates[Math.floor(Math.random() * candidates.length)]
    return { def: { ...def }, sold: false }
  }

  function buyShopItem(idx) {
    const item = shopItems.value[idx]
    if (!item || item.sold) return
    if (game.money < item.def.cost) { showToast('金币不足!'); return }
    if (game.jokers.length >= 6) { showToast('小丑位已满!'); return }
    game.money -= item.def.cost
    game.jokers.push({ id: item.def.id, data: { stacks: 0 } })
    item.sold = true
    SFX.buy()
    if (!stats.value.firstBuy) { stats.value.firstBuy = true; checkAchievements() }
    if (item.def.rarity === 'legend' && !stats.value.legendBuy) { stats.value.legendBuy = true; checkAchievements() }
    saveStats()
    saveGame()
  }

  function sellJoker(idx) {
    if (idx < 0 || idx >= game.jokers.length) return
    const joker = game.jokers[idx]
    const def = JOKERS.find(j => j.id === joker.id)
    if (!def) return
    if (joker.data?.locked) { showToast('锁定的小丑不能卖出!'); return }
    const sellPrice = Math.max(1, Math.floor(def.cost / 2))
    game.money += sellPrice
    game.jokers.splice(idx, 1)
    SFX.sell()
    saveGame()
  }

  function deleteJoker(idx) {
    sellJoker(idx)
  }

  function sellConsumable(idx) {
    if (idx < 0 || idx >= game.consumables.length) return
    const cons = game.consumables[idx]
    const def = cons.type === 'tarot' ? TAROTS.find(t => t.id === cons.id) : PLANETS.find(p => p.id === cons.id)
    if (!def) return
    const sellPrice = Math.max(1, Math.floor((def.cost || 3) / 2))
    game.money += sellPrice
    game.consumables.splice(idx, 1)
    showToast(`卖出 ${def.name}, 获得 $${sellPrice}`)
    SFX.sell()
    saveGame()
  }

  function rerollShop() {
    const cost = 1 + game.rerollCount
    if (game.money < cost) { showToast('金币不足!'); return }
    game.money -= cost
    game.rerollCount++
    generateShopItems()
    SFX.reroll()
    saveGame()
  }

  function buyConsumable(idx) {
    const item = shopConsumables.value[idx]
    if (!item || item.sold) return
    if (game.money < item.def.cost) { showToast('金币不足!'); return }
    if (game.consumables.length >= 2) { showToast('消耗品栏已满!'); return }
    game.money -= item.def.cost
    game.consumables.push({ id: item.def.id, type: item.type })
    item.sold = true
    SFX.buy()
    saveGame()
  }

  function useConsumable(idx) {
    const cons = game.consumables[idx]
    if (!cons) return
    const def = cons.type === 'tarot' ? TAROTS.find(t => t.id === cons.id) : PLANETS.find(p => p.id === cons.id)
    if (!def) return

    if (cons.type === 'planet') {
      const ht = def.handType
      if (!game.handUpgrades[ht]) game.handUpgrades[ht] = { chips: 0, mult: 0 }
      if (def.id === 'mars') game.handUpgrades[ht].chips += 3
      else if (def.id === 'pluto') { game.handUpgrades[ht].chips += 2; game.handUpgrades[ht].mult += 1 }
      else game.handUpgrades[ht].mult += (def.id === 'mercury' || def.id === 'venus') ? 1 : (def.id === 'earth' ? 2 : (def.id === 'saturn' || def.id === 'uranus') ? 3 : 4)
      showToast(`升级 ${ht}!`)
      game.consumables.splice(idx, 1)
      SFX.useConsumable()
      saveGame()
      return
    }

    game.pendingConsumable = idx
    game.pendingSuit = null
    game.selected = []
  }

  function pickSuit(suit) {
    game.pendingSuit = suit
  }

  function confirmConsumable() {
    if (game.pendingConsumable === null) return
    const cons = game.consumables[game.pendingConsumable]
    if (!cons) return
    const def = TAROTS.find(t => t.id === cons.id)
    if (!def) return

    const selectedCards = game.selected.map(i => game.hand[i])
    if (selectedCards.length < def.selectCount) { showToast(`需要选择 ${def.selectCount} 张手牌`); return }

    const result = def.use(game, selectedCards)
    if (result === 'destroy') {
      const idx = game.selected[0]
      game.hand.splice(idx, 1)
      game.selected = []
    } else if (result === 'choose_suit') {
      if (!game.pendingSuit) { showToast('请先选择花色'); return }
      selectedCards[0].suit = game.pendingSuit
      game.selected = []
    } else if (result === false) {
      showToast('选择的手牌数量不对'); return
    } else {
      game.selected = []
    }

    game.consumables.splice(game.pendingConsumable, 1)
    game.pendingConsumable = null
    game.pendingSuit = null
    SFX.useConsumable()
    showToast(`使用了 ${def.name}`)
    saveGame()
  }

  function cancelConsumable() {
    game.pendingConsumable = null
    game.pendingSuit = null
    game.selected = []
  }

  function checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      const key = 'ach_' + ach.id
      if (!stats.value[key] && ach.cond(stats.value)) {
        stats.value[key] = true
        showToast(`🏆 成就解锁: ${ach.name}!`, true)
        SFX.achievement()
      }
    }
  }

  function saveGame() {
    try {
      const saveData = { ...game }
      saveData.playedHandTypes = [...game.playedHandTypes]
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
      updateSaveFlag()
    } catch(e) {}
  }

  function exitToMenu() {
    saveGame()
    showModal.value = null
    screen.value = 'start'
  }

  function loadGame() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY))
      if (!data) return false
      Object.assign(game, data)
      game.playedHandTypes = data.playedHandTypes || []
      return true
    } catch(e) { return false }
  }

  function hasSave() {
    return hasSaveData.value
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY) } catch(e) {}
    updateSaveFlag()
  }

  function continueGame() {
    if (loadGame()) {
      screen.value = 'game'
      return true
    }
    return false
  }

  function sortByRank() {
    const order = { 'A':14,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13 }
    game.hand.sort((a, b) => order[a.rank] - order[b.rank])
  }

  function sortBySuit() {
    const order = { '♠':0, '♥':1, '♣':2, '♦':3 }
    game.hand.sort((a, b) => {
      if (order[a.suit] !== order[b.suit]) return order[a.suit] - order[b.suit]
      const ra = { 'A':14,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13 }
      return ra[a.rank] - ra[b.rank]
    })
  }

  return {
    game, stats, selectedChar, selectedMode, shopItems, shopConsumables,
    screen, showModal, lastScoreResult, toasts, jokerBonusPopups,
    startGame, selectCard, playHand, discardCards,
    winLevel, goToShop, nextLevel, loseLevel, gameOver, gameClear,
    generateShopItems, buyShopItem, sellJoker, deleteJoker, rerollShop, buyConsumable,
    useConsumable, sellConsumable, pickSuit, confirmConsumable, cancelConsumable,
    checkAchievements, saveGame, loadGame, hasSave, clearSave, continueGame, exitToMenu,
    sortByRank, sortBySuit, showToast, SFX, initAudio,
    evaluateHand, calculateScore,
  }
}
