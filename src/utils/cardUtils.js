import { SUITS, RANKS } from '../data/constants.js'

const RANK_SORT_ORDER = { 'A':14,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13 }
const SUIT_SORT_ORDER = { '♠':0, '♥':1, '♣':2, '♦':3 }

export function createDeck() {
  const deck = []
  let id = 0
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: id++, suit, rank })
    }
  }
  return deck
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function drawCards(game, n) {
  const drawn = game.deck.splice(0, n)
  game.hand.push(...drawn)
}

export function sortByRank(hand) {
  return [...hand].sort((a, b) => RANK_SORT_ORDER[a.rank] - RANK_SORT_ORDER[b.rank])
}

export function sortBySuit(hand) {
  return [...hand].sort((a, b) => {
    if (SUIT_SORT_ORDER[a.suit] !== SUIT_SORT_ORDER[b.suit]) return SUIT_SORT_ORDER[a.suit] - SUIT_SORT_ORDER[b.suit]
    return RANK_SORT_ORDER[a.rank] - RANK_SORT_ORDER[b.rank]
  })
}
