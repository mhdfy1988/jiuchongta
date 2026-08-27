export const SUITS = ['♠','♥','♦','♣']
export const SUIT_COLORS = { '♠':'black','♥':'red','♦':'red','♣':'black' }
export const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
export const RANK_VALUES = { 'A':11,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10 }
export const RANK_ORDER = { 'A':14,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13 }
export const FACE_CARDS = ['J','Q','K']

export const HAND_TYPES = {
  '高牌': [5,1], '一对': [10,2], '两对': [20,2], '三条': [30,3],
  '顺子': [35,4], '同花': [40,4], '葫芦': [50,5], '四条': [70,7],
  '同花顺': [120,10], '皇家同花顺': [160,12], '五条': [220,18]
}

export const SIMPLE_TARGETS = [200,300,450,700,1000,1500,5000,10000,16000]
export const HARD_TARGETS = [300,450,600,1000,1500,2000,10000,20000,30000]

export const PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541]

export const CONSUMABLE_SLOTS = 2
export const SAVE_KEY = 'pokerRoguelikeSave'

export const RARITY_NAMES = { common:'普通', rare:'稀有', epic:'史诗', legend:'传说' }
export const TYPE_NAMES = { chips:'底分', mult:'倍率', xmult:'乘倍率', utility:'功能', temp:'临时' }

export function getEndlessTarget(level) {
  const primeIdx = level - 1
  const prime = PRIMES[primeIdx] || (PRIMES[PRIMES.length - 1] + (primeIdx - PRIMES.length + 1) * 10)
  let multiplier = 1
  if (level >= 46) multiplier = 100 * Math.pow(2, Math.floor((level - 46) / 9))
  else if (level >= 37) multiplier = 50
  else if (level >= 28) multiplier = 20
  else if (level >= 19) multiplier = 8
  else if (level >= 10) multiplier = 3
  return prime * 100 * multiplier
}

export function isBossLevel(level) {
  return level === 3 || level === 6 || level === 9
}

export function getTargetScore(level, mode) {
  if (mode === 'endless') return getEndlessTarget(level)
  const targets = mode === 'simple' ? SIMPLE_TARGETS : HARD_TARGETS
  return targets[level - 1] || 99999
}

export function getBossPool(level) {
  if (level <= 3) return 'weak'
  if (level <= 6) return 'medium'
  return 'strong'
}
