
// ============================================================
// 常量定义
// ============================================================
const SUITS = ['♠','♥','♦','♣'];
const SUIT_COLORS = {'♠':'black','♥':'red','♦':'red','♣':'black'};
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RANK_VALUES = {'A':11,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10};
const RANK_ORDER = {'A':14,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13};
const FACE_CARDS = ['J','Q','K'];

// 牌型: [基础底分, 基础倍率]
const HAND_TYPES = {
  '高牌':[5,1], '一对':[10,2], '两对':[20,2], '三条':[30,3],
  '顺子':[35,4], '同花':[40,4], '葫芦':[50,5], '四条':[70,7],
  '同花顺':[120,10], '皇家同花顺':[160,12], '五条':[220,18]
};

// 简单模式目标分
const SIMPLE_TARGETS = [200,300,450,700,1000,1500,5000,10000,16000];
// 困难模式目标分
const HARD_TARGETS = [300,450,600,1000,1500,2000,10000,20000,30000];

// 质数表(前100个)
const PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541];

function getEndlessTarget(level) {
  const primeIdx = level - 1;
  const prime = PRIMES[primeIdx] || (PRIMES[PRIMES.length-1] + (primeIdx - PRIMES.length + 1) * 10);
  let multiplier = 1;
  if (level >= 46) { multiplier = 100 * Math.pow(2, Math.floor((level - 46) / 9)); }
  else if (level >= 37) multiplier = 50;
  else if (level >= 28) multiplier = 20;
  else if (level >= 19) multiplier = 8;
  else if (level >= 10) multiplier = 3;
  return prime * 100 * multiplier;
}

// ============================================================
// 小丑牌定义 (48张)
// ============================================================
const JOKERS = [
  // --- 底分小丑 (8) ---
  { id:'banner', name:'旗帜', icon:'🚩', rarity:'common', cost:3, type:'chips', temp:false,
    desc:'每剩1次换牌 +40底分',
    effect: (ctx) => { ctx.chips += ctx.discardLeft * 40; } },
  { id:'blue_joker', name:'蓝色小丑', icon:'🟦', rarity:'common', cost:3, type:'chips', temp:false,
    desc:'牌堆每剩1张 +3底分',
    effect: (ctx) => { ctx.chips += ctx.deckCount * 3; } },
  { id:'square', name:'方形小丑', icon:'⬜', rarity:'common', cost:3, type:'chips', temp:false,
    desc:'正好打4张 永久+15底分',
    effect: (ctx) => { if (ctx.playedCards.length === 4) { ctx.joker.data.stacks = (ctx.joker.data.stacks||0) + 15; } ctx.chips += ctx.joker.data.stacks || 0; } },
  { id:'scary_face', name:'恐怖人头', icon:'😱', rarity:'common', cost:3, type:'chips', temp:false,
    desc:'每张计分人头牌 +35底分',
    effect: (ctx) => { ctx.chips += ctx.scoringCards.filter(c => FACE_CARDS.includes(c.rank)).length * 35; } },
  { id:'castle', name:'城堡', icon:'🏰', rarity:'rare', cost:5, type:'chips', temp:false,
    desc:'弃掉指定花色1张 永久+10底分',
    effect: (ctx) => { ctx.chips += ctx.joker.data.stacks || 0; },
    onDiscard: (cards, joker) => { const suit = joker.data.suit; if (!suit) { joker.data.suit = SUITS[Math.floor(Math.random()*4)]; } cards.forEach(c => { if (c.suit === joker.data.suit) joker.data.stacks = (joker.data.stacks||0) + 10; }); } },
  { id:'stone', name:'石头小丑', icon:'🪨', rarity:'rare', cost:5, type:'chips', temp:false,
    desc:'无人头牌时 每张+45底分',
    effect: (ctx) => { if (!ctx.scoringCards.some(c => FACE_CARDS.includes(c.rank))) ctx.chips += ctx.scoringCards.length * 45; } },
  { id:'short_ladder', name:'短梯', icon:'🪜', rarity:'rare', cost:5, type:'chips', temp:false,
    desc:'点数都≤8时 每张+40底分',
    effect: (ctx) => { if (ctx.scoringCards.every(c => RANK_VALUES[c.rank] <= 8)) ctx.chips += ctx.scoringCards.length * 40; } },
  { id:'mountaineer', name:'登山客', icon:'🧗', rarity:'epic', cost:7, type:'chips', temp:false,
    desc:'每张计分牌永久+8牌面分',
    effect: (ctx) => { ctx.scoringCards.forEach(c => { const key = c.id; ctx.game.cardEnhancements[key] = (ctx.game.cardEnhancements[key]||0) + 8; }); } },

  // --- 加倍率小丑 (15) ---
  { id:'joker', name:'小丑', icon:'🃏', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'倍率+5', effect: (ctx) => { ctx.mult += 5; } },
  { id:'misprint', name:'印错小丑', icon:'❓', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'随机+0~20倍率', effect: (ctx) => { ctx.mult += Math.floor(Math.random() * 21); } },
  { id:'abstract', name:'抽象小丑', icon:'🎨', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'每拥有1张小丑 +3倍率', effect: (ctx) => { ctx.mult += ctx.game.jokers.length * 3; } },
  { id:'half', name:'半张小丑', icon:'🌗', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'打出≤3张 +18倍率', effect: (ctx) => { if (ctx.playedCards.length <= 3) ctx.mult += 18; } },
  { id:'smiley', name:'微笑表情', icon:'😊', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'每张计分人头牌 +5倍率', effect: (ctx) => { ctx.mult += ctx.scoringCards.filter(c => FACE_CARDS.includes(c.rank)).length * 5; } },
  { id:'spade_joker', name:'黑桃小丑', icon:'♠️', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'每张黑桃 +5倍率', effect: (ctx) => { ctx.mult += ctx.scoringCards.filter(c => c.suit === '♠').length * 5; } },
  { id:'heart_joker', name:'红桃小丑', icon:'♥️', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'每张红桃 +5倍率', effect: (ctx) => { ctx.mult += ctx.scoringCards.filter(c => c.suit === '♥').length * 5; } },
  { id:'club_joker', name:'梅花小丑', icon:'♣️', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'每张梅花 +5倍率', effect: (ctx) => { ctx.mult += ctx.scoringCards.filter(c => c.suit === '♣').length * 5; } },
  { id:'diamond_joker', name:'方片小丑', icon:'♦️', rarity:'common', cost:3, type:'mult', temp:false,
    desc:'每张方片 +5倍率', effect: (ctx) => { ctx.mult += ctx.scoringCards.filter(c => c.suit === '♦').length * 5; } },
  { id:'even', name:'偶数小丑', icon:'✌️', rarity:'rare', cost:5, type:'mult', temp:false,
    desc:'2/4/6/8/10每张+5倍率', effect: (ctx) => { ctx.scoringCards.forEach(c => { if (['2','4','6','8','10'].includes(c.rank)) ctx.mult += 5; }); } },
  { id:'green', name:'绿色小丑', icon:'💚', rarity:'rare', cost:5, type:'mult', temp:false,
    desc:'出牌+3倍率 弃牌-3倍率',
    effect: (ctx) => { ctx.mult += ctx.joker.data.stacks || 0; },
    onPlay: (joker) => { joker.data.stacks = (joker.data.stacks||0) + 3; },
    onDiscard: (cards, joker) => { joker.data.stacks = Math.max(0, (joker.data.stacks||0) - 3); } },
  { id:'spare_trousers', name:'备用裤子', icon:'👖', rarity:'rare', cost:5, type:'mult', temp:false,
    desc:'打出两对 永久+3倍率',
    effect: (ctx) => { ctx.mult += ctx.joker.data.stacks || 0; },
    onPlay: (joker, handType) => { if (handType === '两对') joker.data.stacks = (joker.data.stacks||0) + 3; } },
  { id:'supernova', name:'超新星', icon:'🌟', rarity:'epic', cost:7, type:'mult', temp:false,
    desc:'同牌型打越多 倍率+记录×3',
    effect: (ctx) => { const count = ctx.game.handTypeCounts[ctx.handType] || 0; ctx.mult += count * 3; } },
  { id:'fibonacci', name:'斐波那契', icon:'🌀', rarity:'epic', cost:7, type:'mult', temp:false,
    desc:'A/2/3/5/8每张+8倍率', effect: (ctx) => { ctx.scoringCards.forEach(c => { if (['A','2','3','5','8'].includes(c.rank)) ctx.mult += 8; }); } },
  { id:'burnt', name:'烧焦小丑', icon:'🔥', rarity:'epic', cost:7, type:'mult', temp:false,
    desc:'首次换牌弃牌组牌型 该牌型永久+3倍率',
    effect: (ctx) => { ctx.mult += ctx.joker.data.bonusMult?.[ctx.handType] || 0; },
    onDiscard: (cards, joker, handType) => { if (!joker.data.firstDiscardUsed) { joker.data.firstDiscardUsed = true; if (handType && handType !== '高牌') { if (!joker.data.bonusMult) joker.data.bonusMult = {}; joker.data.bonusMult[handType] = (joker.data.bonusMult[handType]||0) + 3; } } } },

  // --- 乘倍率小丑 (9) ---
  { id:'photo', name:'照片', icon:'📸', rarity:'rare', cost:5, type:'xmult', temp:false,
    desc:'有头牌时 第一张头牌+面值底分',
    effect: (ctx) => { const first = ctx.scoringCards.find(c => FACE_CARDS.includes(c.rank)); if (first) { const val = RANK_VALUES[first.rank] + (ctx.game.cardEnhancements[first.id]||0); ctx.chips += val; } } },
  { id:'ghost', name:'重影', icon:'👻', rarity:'rare', cost:5, type:'xmult', temp:false,
    desc:'有梅花和其他花色 倍率×2',
    effect: (ctx) => { const hasClub = ctx.scoringCards.some(c => c.suit === '♣'); const hasOther = ctx.scoringCards.some(c => c.suit !== '♣'); if (hasClub && hasOther) ctx.mult *= 2; } },
  { id:'blackboard', name:'黑板', icon:'🖤', rarity:'rare', cost:5, type:'xmult', temp:false,
    desc:'无红桃方片 倍率×2.5',
    effect: (ctx) => { if (!ctx.scoringCards.some(c => c.suit === '♥' || c.suit === '♦')) ctx.mult *= 2.5; } },
  { id:'cheat', name:'老千小丑', icon:'🎲', rarity:'epic', cost:7, type:'xmult', temp:false,
    desc:'重复打出同牌型 倍率×3',
    effect: (ctx) => { if ((ctx.game.handTypeCounts[ctx.handType] || 0) >= 1) ctx.mult *= 3; } },
  { id:'flower_pot', name:'花盆', icon:'🪴', rarity:'epic', cost:7, type:'xmult', temp:false,
    desc:'含四种花色 底分+50 倍率×3',
    effect: (ctx) => { const suits = new Set(ctx.scoringCards.map(c => c.suit)); if (suits.size >= 4) { ctx.chips += 50; ctx.mult *= 3; } } },
  { id:'ancient', name:'古老小丑', icon:'🗿', rarity:'legend', cost:10, type:'xmult', temp:false,
    desc:'随机花色该花色计分×1.5',
    effect: (ctx) => { const suit = ctx.joker.data.suit; if (!suit) ctx.joker.data.suit = SUITS[Math.floor(Math.random()*4)]; if (ctx.scoringCards.some(c => c.suit === ctx.joker.data.suit)) ctx.mult *= 1.5; } },
  { id:'order', name:'秩序', icon:'📏', rarity:'legend', cost:10, type:'xmult', temp:false,
    desc:'顺子/同花顺/皇家同花顺×3',
    effect: (ctx) => { if (['顺子','同花顺','皇家同花顺'].includes(ctx.handType)) ctx.mult *= 3; } },
  { id:'baron', name:'男爵', icon:'🎩', rarity:'legend', cost:10, type:'xmult', temp:false,
    desc:'手中每张K 倍率×1.5',
    effect: (ctx) => { const kings = ctx.game.hand.filter(c => c.rank === 'K').length; ctx.mult *= Math.pow(1.5, kings); } },
  { id:'quintet', name:'五重奏', icon:'🎵', rarity:'legend', cost:10, type:'xmult', temp:false,
    desc:'五条倍率×5', effect: (ctx) => { if (ctx.handType === '五条') ctx.mult *= 5; } },

  // --- 功能小丑 (10) ---
  { id:'splash', name:'飞溅', icon:'💦', rarity:'common', cost:3, type:'utility', temp:false,
    desc:'所有打出的牌都计分', effect: (ctx) => {}, modifyScoring: (played, scoring) => [...played] },
  { id:'fuzzy', name:'模糊', icon:'🌫️', rarity:'rare', cost:5, type:'utility', temp:false,
    desc:'红桃方片同花 黑桃梅花同花', effect: (ctx) => {}, modifySuits: true },
  { id:'vision', name:'幻视', icon:'👁️', rarity:'rare', cost:5, type:'utility', temp:false,
    desc:'所有计分牌视为人头牌', effect: (ctx) => {}, modifyFaceCards: true },
  { id:'four_fingers', name:'四指', icon:'✋', rarity:'rare', cost:5, type:'utility', temp:false,
    desc:'顺子同花只需4张', effect: (ctx) => {}, minStraight: 4 },
  { id:'shortcut', name:'捷径', icon:'⚡', rarity:'rare', cost:5, type:'utility', temp:false,
    desc:'顺子允许跳1个点数', effect: (ctx) => {}, allowGap: true },
  { id:'hanger', name:'吊牌', icon:'🪝', rarity:'epic', cost:7, type:'utility', temp:false,
    desc:'第一张计分牌额外触发2次', effect: (ctx) => {}, retriggerFirst: 2 },
  { id:'joy_sorrow', name:'喜与悲', icon:'😅', rarity:'epic', cost:7, type:'utility', temp:false,
    desc:'人头牌计分效果额外触发1次', effect: (ctx) => {}, retriggerFace: 1 },
  { id:'blueprint', name:'蓝图', icon:'📐', rarity:'legend', cost:10, type:'utility', temp:false,
    desc:'复制右侧第1张小丑效果', effect: (ctx) => { const idx = ctx.game.jokers.indexOf(ctx.joker); const right = ctx.game.jokers[idx+1]; if (right) { const def = JOKERS.find(j => j.id === right.id); if (def && def.effect && def.type !== 'utility') { const tempCtx = {...ctx, joker: right}; def.effect(tempCtx); ctx.chips = tempCtx.chips; ctx.mult = tempCtx.mult; } } } },
  { id:'brainstorm', name:'头脑风暴', icon:'🧠', rarity:'legend', cost:10, type:'utility', temp:false,
    desc:'复制最左侧小丑效果', effect: (ctx) => { const leftmost = ctx.game.jokers[0]; if (leftmost && leftmost !== ctx.joker) { const def = JOKERS.find(j => j.id === leftmost.id); if (def && def.effect && def.type !== 'utility') { const tempCtx = {...ctx, joker: leftmost}; def.effect(tempCtx); ctx.chips = tempCtx.chips; ctx.mult = tempCtx.mult; } } } },
  { id:'neighbor', name:'邻座', icon:'🪑', rarity:'legend', cost:10, type:'utility', temp:false,
    desc:'四条+第5张差1 变五条', effect: (ctx) => {}, autoFive: true },

  // --- 临时小丑 (6) ---
  { id:'tip', name:'小费', icon:'💵', rarity:'common', cost:3, type:'temp', temp:true,
    desc:'本次出牌+500底分', effect: (ctx) => { ctx.chips += 500; }, consumeOnUse: true },
  { id:'applause', name:'掌声', icon:'👏', rarity:'common', cost:3, type:'temp', temp:true,
    desc:'本次出牌+10倍率', effect: (ctx) => { ctx.mult += 10; }, consumeOnUse: true },
  { id:'re_ticket', name:'补票', icon:'🎫', rarity:'rare', cost:5, type:'temp', temp:true,
    desc:'换牌+1 出牌+1', effect: (ctx) => {}, consumeOnUse: true, onPurchase: (game) => { game.handsLeft++; game.discardsLeft++; } },
  { id:'elevator', name:'升降机', icon:'🛗', rarity:'legend', cost:10, type:'temp', temp:true,
    desc:'选1张打出牌变同花色相邻点数', effect: (ctx) => {}, consumeOnUse: true },
  { id:'double_coupon', name:'加倍券', icon:'🎟️', rarity:'legend', cost:10, type:'temp', temp:true,
    desc:'本次出牌最终分数×2', effect: (ctx) => { ctx.finalMult = 2; }, consumeOnUse: true },
  { id:'disguise', name:'变装券', icon:'🎭', rarity:'legend', cost:10, type:'temp', temp:true,
    desc:'指定1张打出牌变同花色任意点数', effect: (ctx) => {}, consumeOnUse: true },
];

// ============================================================
// 消耗品定义: 塔罗牌 + 星球牌
// ============================================================
const TAROTS = [
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
];

const PLANETS = [
  { id:'mercury', name:'水星', icon:'☿', cost:3, handType:'一对', desc:'升级一对 +1倍率' },
  { id:'venus', name:'金星', icon:'♀', cost:3, handType:'两对', desc:'升级两对 +1倍率' },
  { id:'earth', name:'地球', icon:'⊕', cost:3, handType:'三条', desc:'升级三条 +2倍率' },
  { id:'mars', name:'火星', icon:'♂', cost:3, handType:'顺子', desc:'升级顺子 +3底分' },
  { id:'jupiter', name:'木星', icon:'♃', cost:3, handType:'同花', desc:'升级同花 +2倍率' },
  { id:'saturn', name:'土星', icon:'♄', cost:3, handType:'葫芦', desc:'升级葫芦 +3倍率' },
  { id:'uranus', name:'天王星', icon:'♅', cost:4, handType:'四条', desc:'升级四条 +3倍率' },
  { id:'neptune', name:'海王星', icon:'♆', cost:4, handType:'同花顺', desc:'升级同花顺 +4倍率' },
  { id:'pluto', name:'冥王星', icon:'♇', cost:4, handType:'高牌', desc:'升级高牌 +2底分+1倍率' },
];

const CONSUMABLE_SLOTS = 2;

const BOSS_DEBUFFS = {
  // 弱池 (第3层)
  weak: [
    { id:'seal_king', name:'封王', desc:'人头牌无效(J/Q/K不计分,不触发人头小丑)' },
    { id:'shackles', name:'镣铐', desc:'手牌上限-1' },
    { id:'ocd', name:'强迫症', desc:'必须打出5张才计分' },
    { id:'color_cut', name:'断色', desc:'随机一种花色不计分' },
  ],
  // 中池 (第6层)
  medium: [
    { id:'only_one', name:'唯一', desc:'第一次计分的牌型被锁定,之后只有该牌型正常计分' },
    { id:'no_repeat', name:'不许重复', desc:'每种牌型只能计分1次' },
    { id:'silence', name:'沉默', desc:'随机1张永久小丑本层失效' },
    { id:'called_out', name:'点名', desc:'每次出牌前随机指定1张手牌,必须打出或弃掉' },
  ],
  // 强池 (第9层)
  strong: [
    { id:'high_wall', name:'高墙', desc:'目标分提高50%' },
    { id:'pinhole', name:'针眼', desc:'只能出牌1次' },
    { id:'no_discard', name:'无弃牌', desc:'换牌次数变为0' },
    { id:'lockdown', name:'封锁', desc:'随机禁用一种牌型' },
  ],
};

// ============================================================
// 角色定义
// ============================================================
const CHARACTERS = [
  { id:'normal', name:'普通人', icon:'🧑', desc:'不带初始小丑,6个位置全自由', unlockCondition: null, startJoker: null },
  { id:'straight', name:'顺子牌手', icon:'🃏', desc:'初始自带"捷径"(顺子跳1点)', unlockCondition: '通关困难九层塔', startJoker: 'shortcut' },
  { id:'flush', name:'同花牌手', icon:'🌸', desc:'初始自带"模糊"(红方同花/黑梅同花)', unlockCondition: '困难模式单局50000分', startJoker: 'fuzzy' },
];

// ============================================================
// 成就定义
// ============================================================
const ACHIEVEMENTS = [
  { id:'first_clear', name:'首次登顶', desc:'首次通关困难九层塔', cond: (s) => s.hardClears >= 1 },
  { id:'ten_clears', name:'十次登顶', desc:'通关困难九层塔10次', cond: (s) => s.hardClears >= 10 },
  { id:'first_flush', name:'第一副同花顺', desc:'首次打出同花顺', cond: (s) => s.flushStraight },
  { id:'royal', name:'皇家时刻', desc:'首次打出皇家同花顺', cond: (s) => s.royalFlush },
  { id:'five_kind', name:'不可能之牌', desc:'首次打出五条', cond: (s) => s.fiveKind },
  { id:'fifty_k', name:'五万分', desc:'困难模式单局50000分', cond: (s) => s.maxScore >= 50000 },
  { id:'big_hand', name:'单手爆发', desc:'单次出牌达到10000分', cond: (s) => s.maxSingleScore >= 10000 },
  { id:'first_buy', name:'第一次购买', desc:'首次购买小丑', cond: (s) => s.firstBuy },
  { id:'legend_buy', name:'传说登场', desc:'首次购买传说小丑', cond: (s) => s.legendBuy },
  { id:'endless_10', name:'十层无尽', desc:'无尽达到第10层', cond: (s) => s.maxEndless >= 10 },
];

// ============================================================
// 游戏状态
// ============================================================
let game = {};
let stats = loadStats();
let selectedChar = null;
let selectedMode = null;
let shopItems = [];
let shopConsumables = [];
let shopRerollCount = 0;

function loadStats() {
  try { return JSON.parse(localStorage.getItem('pokerRoguelikeStats')) || {}; } catch(e) { return {}; }
}
function saveStats() { localStorage.setItem('pokerRoguelikeStats', JSON.stringify(stats)); }

function defaultStats() {
  return { hardClears:0, maxScore:0, maxSingleScore:0, maxEndless:0,
    flushStraight:false, royalFlush:false, fiveKind:false,
    firstBuy:false, legendBuy:false,
    unlockedChars: ['normal'], unlockedEndless: false };
}

function initStats() {
  const s = loadStats();
  const def = defaultStats();
  return Object.assign(def, s);
}
stats = initStats();

// ============================================================
// 工具函数
// ============================================================
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function createDeck() { const deck = []; for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit, id: `${rank}${suit}_${Math.random()}` }); return deck; }
function showToast(msg, isAchievement = false) { const c = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast' + (isAchievement ? ' achievement' : ''); t.textContent = msg; c.appendChild(t); setTimeout(() => t.remove(), 3000); }

// ============================================================
// 音效系统 (Web Audio API 合成)
// ============================================================
let audioCtx = null;
let soundEnabled = true;
function initAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} } }
function playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
  if (!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(now); osc.stop(now + duration);
}
function playNoise(duration, volume = 0.1, delay = 0) {
  if (!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime + delay;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.value = volume;
  source.connect(gain); gain.connect(audioCtx.destination);
  source.start(now);
}
const SFX = {
  select() { playTone(800, 0.05, 'square', 0.08); },
  deselect() { playTone(600, 0.05, 'square', 0.06); },
  play() { playTone(440, 0.08, 'triangle', 0.12); playTone(660, 0.12, 'triangle', 0.1, 0.05); },
  discard() { playNoise(0.15, 0.08); },
  score(chips, mult) {
    const base = 400 + Math.min(chips * 2, 600);
    playTone(base, 0.1, 'sine', 0.12);
    playTone(base * 1.5, 0.15, 'sine', 0.1, 0.08);
    playTone(base * 2, 0.2, 'sine', 0.08, 0.16);
  },
  jokerTrigger() { playTone(1000, 0.08, 'sine', 0.1); playTone(1200, 0.1, 'sine', 0.08, 0.04); },
  win() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.15, 'triangle', 0.12, i * 0.08)); },
  lose() { [400, 350, 300, 250].forEach((f, i) => playTone(f, 0.2, 'sawtooth', 0.1, i * 0.1)); },
  buy() { playTone(660, 0.08, 'square', 0.1); playTone(880, 0.1, 'square', 0.08, 0.05); },
  sell() { playTone(440, 0.08, 'square', 0.08); playTone(330, 0.1, 'square', 0.06, 0.05); },
  reroll() { playNoise(0.1, 0.06); playTone(500, 0.08, 'square', 0.08, 0.05); },
  useConsumable() { playTone(880, 0.1, 'sine', 0.1); playTone(1100, 0.12, 'sine', 0.08, 0.06); },
  achievement() { [659, 784, 988, 1319].forEach((f, i) => playTone(f, 0.2, 'triangle', 0.12, i * 0.06)); },
  levelUp() { [523, 659, 784].forEach((f, i) => playTone(f, 0.12, 'triangle', 0.12, i * 0.06)); },
  button() { playTone(700, 0.04, 'square', 0.06); },
};

// 悬浮提示
const RARITY_NAMES = { common:'普通', rare:'稀有', epic:'史诗', legend:'传说' };
const TYPE_NAMES = { chips:'底分', mult:'加倍率', xmult:'乘倍率', utility:'功能', temp:'临时' };
function showTooltip(e, def, extra = {}) {
  const tt = document.getElementById('joker-tooltip');
  const r = def.rarity || 'common';
  const stacks = extra.stacks ? `<div class="tt-stacks">叠加层数: ${extra.stacks}</div>` : '';
  const cost = extra.cost != null ? `<div class="tt-cost">💰 $${extra.cost}</div>` : '';
  const sellPrice = extra.sellPrice != null ? `<div class="tt-cost" style="color:var(--red);">卖出 +$${extra.sellPrice}</div>` : '';
  const locked = extra.locked ? '<div class="tt-stacks" style="color:var(--muted);">🔒 角色专属(不可卖)</div>' : '';
  const tempBadge = def.temp ? '<span style="color:var(--accent2);"> · 临时</span>' : '';
  tt.innerHTML = `
    <div class="tt-rarity" style="color:var(--rarity-${r});">${RARITY_NAMES[r]}${tempBadge}${def.type ? ' · ' + (TYPE_NAMES[def.type]||'') : ''}</div>
    <div class="tt-icon">${def.icon}</div>
    <div class="tt-name">${def.name}</div>
    <div class="tt-desc">${def.desc}</div>
    ${stacks}${cost}${sellPrice}${locked}
  `;
  tt.style.display = 'block';
  moveTooltip(e);
}
function showConsumableTooltip(e, def, type) {
  const tt = document.getElementById('joker-tooltip');
  const typeLabel = type === 'tarot' ? '塔罗牌' : '星球牌';
  const color = type === 'tarot' ? 'var(--purple)' : 'var(--blue)';
  tt.innerHTML = `
    <div class="tt-rarity" style="color:${color};">${typeLabel}</div>
    <div class="tt-icon">${def.icon}</div>
    <div class="tt-name">${def.name}</div>
    <div class="tt-desc">${def.desc}</div>
    <div class="tt-cost">💰 $${def.cost}</div>
  `;
  tt.style.display = 'block';
  moveTooltip(e);
}
function moveTooltip(e) {
  const tt = document.getElementById('joker-tooltip');
  if (tt.style.display === 'none') return;
  let x = e.clientX + 14;
  let y = e.clientY + 14;
  const rect = tt.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) x = e.clientX - rect.width - 14;
  if (y + rect.height > window.innerHeight) y = e.clientY - rect.height - 14;
  tt.style.left = x + 'px';
  tt.style.top = y + 'px';
}
function hideTooltip() { document.getElementById('joker-tooltip').style.display = 'none'; }

// ============================================================
// 存档系统
// ============================================================
const SAVE_KEY = 'pokerRoguelikeSave';
const SHOP_KEY = 'pokerRoguelikeShop';

function saveGame() {
  if (!game) return;
  try {
    const inShop = document.getElementById('shop-modal').classList.contains('active');
    const save = {
      game: {
        ...game,
        playedHandTypes: [...(game.playedHandTypes || [])],
      },
      shopItems: shopItems || [],
      shopConsumables: shopConsumables || [],
      inShop: inShop,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) { console.error('存档失败:', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (!save.game) return null;
    save.game.playedHandTypes = new Set(save.game.playedHandTypes || []);
    return save;
  } catch (e) { console.error('读档失败:', e); return null; }
}

function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

function continueGame() {
  const save = loadGame();
  if (!save) { showToast('没有存档'); return; }
  game = save.game;
  shopItems = save.shopItems || [];
  shopConsumables = save.shopConsumables || [];
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  if (save.inShop) {
    document.getElementById('shop-modal').classList.add('active');
    renderShop();
  } else {
    render();
  }
  const modeName = game.mode === 'simple' ? '简单' : game.mode === 'hard' ? '困难' : '无尽';
  showToast(`继续游戏 · 第${game.level}层 · ${modeName}模式`);
}

function isBossLevel(level) { return level === 3 || level === 6 || level === 9; }
function getTargetScore(level, mode) {
  if (mode === 'simple') return SIMPLE_TARGETS[level - 1];
  if (mode === 'hard') return HARD_TARGETS[level - 1];
  return getEndlessTarget(level);
}
function getBossPool(level) {
  if (level <= 3) return 'weak';
  if (level <= 6) return 'medium';
  return 'strong';
}

// ============================================================
// 牌型判定
// ============================================================
function evaluateHand(cards, game) {
  if (cards.length === 0) return { type: '--', chips: 0, mult: 0, scoringCards: [] };

  // 功能小丑修改
  const hasFourFingers = game.jokers.some(j => j.id === 'four_fingers');
  const hasShortcut = game.jokers.some(j => j.id === 'shortcut');
  const hasFuzzy = game.jokers.some(j => j.id === 'fuzzy');

  // 处理花色(模糊小丑)
  let effectiveCards = cards.map(c => ({...c}));
  if (hasFuzzy) {
    effectiveCards.forEach(c => {
      if (c.suit === '♥') c.effSuit = '♦';
      else if (c.suit === '♠') c.effSuit = '♣';
      else c.effSuit = c.suit;
    });
  } else {
    effectiveCards.forEach(c => c.effSuit = c.suit);
  }

  const ranks = effectiveCards.map(c => c.rank);
  const values = ranks.map(r => RANK_VALUES[r]).sort((a,b) => a-b);
  const rankCount = {};
  ranks.forEach(r => rankCount[r] = (rankCount[r] || 0) + 1);
  const counts = Object.values(rankCount).sort((a,b) => b-a);

  const isFlush = effectiveCards.every(c => c.effSuit === effectiveCards[0].effSuit);
  const minStraight = hasFourFingers ? 4 : 5;
  let isStraight = false, straightCards = null;
  if (cards.length >= minStraight) {
    const result = findStraight(effectiveCards, minStraight, hasShortcut);
    if (result) { isStraight = true; straightCards = result; }
  }

  // 判定牌型(从高到低)
  let handType = '高牌';
  let scoringCards = [...cards];

  if (counts[0] >= 5) {
    handType = '五条';
    scoringCards = effectiveCards.filter(c => rankCount[c.rank] >= 5).map(c => cards[effectiveCards.indexOf(c)]);
  } else if (isStraight && isFlush && straightCards) {
    // 检查皇家同花顺 10-J-Q-K-A
    const straightRanks = straightCards.map(c => c.rank).sort((a,b) => RANK_VALUES[a] - RANK_VALUES[b]);
    if (straightRanks.includes('10') && straightRanks.includes('J') && straightRanks.includes('Q') && straightRanks.includes('K') && straightRanks.includes('A')) {
      handType = '皇家同花顺';
    } else {
      handType = '同花顺';
    }
    scoringCards = straightCards.map(c => cards[effectiveCards.indexOf(c)]);
  } else if (counts[0] === 4) {
    handType = '四条';
    scoringCards = cards.filter(c => rankCount[c.rank] === 4);
  } else if (counts[0] === 3 && counts[1] === 2) {
    handType = '葫芦';
    scoringCards = cards.filter(c => rankCount[c.rank] >= 2);
  } else if (isFlush && cards.length >= 5) {
    handType = '同花';
    scoringCards = cards.slice().sort((a,b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]).slice(0, 5);
  } else if (isStraight && straightCards) {
    handType = '顺子';
    scoringCards = straightCards.map(c => cards[effectiveCards.indexOf(c)]);
  } else if (counts[0] === 3) {
    handType = '三条';
    scoringCards = cards.filter(c => rankCount[c.rank] === 3);
  } else if (counts[0] === 2 && counts[1] === 2) {
    handType = '两对';
    scoringCards = cards.filter(c => rankCount[c.rank] === 2);
  } else if (counts[0] === 2) {
    handType = '一对';
    scoringCards = cards.filter(c => rankCount[c.rank] === 2);
  } else {
    handType = '高牌';
    scoringCards = [cards.reduce((max, c) => RANK_VALUES[c.rank] > RANK_VALUES[max.rank] ? c : max)];
  }

  // 邻座小丑: 四条+第5张差1 → 五条
  if (handType === '四条' && game.jokers.some(j => j.id === 'neighbor')) {
    const fourRank = Object.keys(rankCount).find(r => rankCount[r] === 4);
    const fifthCard = cards.find(c => c.rank !== fourRank);
    if (fifthCard) {
      const diff = Math.abs(RANK_VALUES[fourRank] - RANK_VALUES[fifthCard.rank]);
      if (diff === 1) {
        handType = '五条';
        scoringCards = [...cards];
      }
    }
  }

  const base = HAND_TYPES[handType] || [5, 1];
  return { type: handType, chips: base[0], mult: base[1], scoringCards };
}

function findStraight(cards, minLen, allowGap) {
  const sorted = [...cards].sort((a,b) => RANK_VALUES[a.rank] - RANK_VALUES[b.rank]);
  const unique = [];
  const seen = new Set();
  sorted.forEach(c => { if (!seen.has(c.rank)) { unique.push(c); seen.add(c.rank); } });

  // 检查连续
  for (let i = 0; i <= unique.length - minLen; i++) {
    let ok = true, gaps = 0;
    for (let j = 0; j < minLen - 1; j++) {
      const diff = RANK_VALUES[unique[i+j+1].rank] - RANK_VALUES[unique[i+j].rank];
      if (diff === 0) continue;
      if (diff === 1) continue;
      if (allowGap && diff === 2 && gaps < 1) { gaps++; continue; }
      ok = false; break;
    }
    if (ok) return unique.slice(i, i + minLen);
  }
  // A-2-3-4-5 特殊
  const ace = unique.find(c => c.rank === 'A');
  const low = unique.filter(c => ['2','3','4','5'].includes(c.rank));
  if (ace && low.length >= (minLen - 1)) {
    const needed = minLen - 1;
    return [low.slice(0, needed), ace].flat();
  }
  return null;
}

// ============================================================
// 计分系统
// ============================================================
function calculateScore(cards, game) {
  const evalResult = evaluateHand(cards, game);
  let chips = evalResult.chips;
  let mult = evalResult.mult;
  let scoringCards = evalResult.scoringCards;
  const triggerLog = [];

  // 飞溅小丑: 所有牌都计分
  const splash = game.jokers.find(j => j.id === 'splash');
  if (splash) scoringCards = [...cards];

  // 计分牌面分
  scoringCards.forEach(card => {
    chips += RANK_VALUES[card.rank] + (game.cardEnhancements[card.id] || 0);
  });

  // 重触发
  const hanger = game.jokers.find(j => j.id === 'hanger');
  const joySorrow = game.jokers.find(j => j.id === 'joy_sorrow');
  let extraTriggers = {};
  if (hanger && scoringCards.length > 0) extraTriggers[0] = (extraTriggers[0] || 0) + 2;
  if (joySorrow) scoringCards.forEach((c, i) => { if (FACE_CARDS.includes(c.rank)) extraTriggers[i] = (extraTriggers[i] || 0) + 1; });
  for (const idx in extraTriggers) {
    const card = scoringCards[idx];
    for (let t = 0; t < extraTriggers[idx]; t++) {
      chips += RANK_VALUES[card.rank] + (game.cardEnhancements[card.id] || 0);
    }
  }

  // Boss Debuff: 封王 - 人头牌不计分
  if (game.bossDebuff?.id === 'seal_king') {
    scoringCards = scoringCards.filter(c => !FACE_CARDS.includes(c.rank));
  }
  // Boss Debuff: 断色
  if (game.bossDebuff?.id === 'color_cut' && game.bossDebuff.disabledSuit) {
    scoringCards = scoringCards.filter(c => c.suit !== game.bossDebuff.disabledSuit);
  }

  // 牌型升级(星球牌)
  const upgrade = game.handUpgrades[evalResult.type];
  if (upgrade) {
    if (upgrade.chips) { chips += upgrade.chips; triggerLog.push({ name: '牌型升级', chips: upgrade.chips, mult: 0 }); }
    if (upgrade.mult) { mult += upgrade.mult; triggerLog.push({ name: '牌型升级', chips: 0, mult: upgrade.mult }); }
  }

  // 小丑牌效果(从左到右结算)
  const ctx = {
    chips, mult, scoringCards, playedCards: cards, handType: evalResult.type,
    handLeft: game.handsLeft, discardLeft: game.discardsLeft, deckCount: game.deck.length,
    game, joker: null, finalMult: 1,
  };

  for (const joker of game.jokers) {
    // Boss Debuff: 沉默
    if (game.bossDebuff?.id === 'silence' && game.silencedJoker === joker) continue;
    const def = JOKERS.find(j => j.id === joker.id);
    if (!def) continue;
    ctx.joker = joker;
    const beforeChips = ctx.chips;
    const beforeMult = ctx.mult;
    if (def.effect) def.effect(ctx);
    const dChips = ctx.chips - beforeChips;
    const dMult = ctx.mult - beforeMult;
    if (dChips > 0 || dMult > 0) {
      triggerLog.push({ name: def.name, chips: dChips, mult: dMult, jokerIdx: game.jokers.indexOf(joker) });
    }
  }

  chips = ctx.chips;
  mult = ctx.mult;
  let total = Math.floor(chips * mult * ctx.finalMult);

  return { type: evalResult.type, chips, mult, total, scoringCards: evalResult.scoringCards, triggerLog };
}

// ============================================================
// 游戏初始化
// ============================================================
function startGame() {
  const charDef = CHARACTERS.find(c => c.id === selectedChar);
  const startJokers = [];
  if (charDef.startJoker) {
    const jokerDef = JOKERS.find(j => j.id === charDef.startJoker);
    startJokers.push({ id: jokerDef.id, data: { stacks: 0, locked: true } });
  }

  game = {
    mode: selectedMode,
    character: selectedChar,
    level: 1,
    deck: shuffle(createDeck()),
    hand: [],
    selected: [],
    jokers: startJokers,
    money: 5,
    handsLeft: 4,
    discardsLeft: 4,
    handSize: 8,
    levelScore: 0,
    targetScore: getTargetScore(1, selectedMode),
    bossDebuff: null,
    silencedJoker: null,
    handTypeCounts: {},
    cardEnhancements: {},
    lockedHandType: null,
    playedHandTypes: new Set(),
    rerollCount: 0,
    levelStartMoney: 5,
    lives: selectedMode === 'simple' ? 1 : 0,
    totalScore: 0,
    maxSingleScore: 0,
    animating: false,
    consumables: [],
    handUpgrades: {},
    pendingConsumable: null,
    calledOutIndex: null,
  };

  applyBossDebuff();
  drawCards(game.handSize);
  if (game.bossDebuff?.id === 'called_out' && game.hand.length > 0) {
    game.calledOutIndex = Math.floor(Math.random() * game.hand.length);
  }
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  render();
  showToast(`第1层 ${selectedMode === 'simple' ? '简单' : selectedMode === 'hard' ? '困难' : '无尽'}模式`);
}

function applyBossDebuff() {
  if (!isBossLevel(game.level) && game.mode !== 'endless') { game.bossDebuff = null; return; }
  if (game.mode === 'endless' && !isBossLevel(((game.level - 1) % 9) + 1)) { game.bossDebuff = null; return; }

  const poolName = game.mode === 'endless' ? getBossPool(((game.level - 1) % 9) + 1) : getBossPool(game.level);
  const pool = BOSS_DEBUFFS[poolName];
  game.bossDebuff = { ...pool[Math.floor(Math.random() * pool.length)] };

  // 应用效果
  if (game.bossDebuff.id === 'shackles') game.handSize = 7;
  if (game.bossDebuff.id === 'no_discard') game.discardsLeft = 0;
  if (game.bossDebuff.id === 'pinhole') game.handsLeft = 1;
  if (game.bossDebuff.id === 'high_wall') game.targetScore = Math.floor(game.targetScore * 1.5);
  if (game.bossDebuff.id === 'color_cut') game.bossDebuff.disabledSuit = SUITS[Math.floor(Math.random() * 4)];
  if (game.bossDebuff.id === 'lockdown') {
    const types = ['同花顺','同花','顺子','葫芦','四条','一对'];
    game.bossDebuff.disabledHand = types[Math.floor(Math.random() * types.length)];
  }
  if (game.bossDebuff.id === 'silence' && game.jokers.length > 0) {
    const permanent = game.jokers.filter(j => !j.data?.locked);
    if (permanent.length > 0) game.silencedJoker = permanent[Math.floor(Math.random() * permanent.length)];
  }
}

function drawCards(n) { for (let i = 0; i < n && game.deck.length > 0; i++) game.hand.push(game.deck.pop()); }

function selectCard(index) {
  initAudio();
  // 消耗品选牌模式
  if (game.pendingConsumable !== null && game.pendingConsumable !== undefined) {
    const cons = game.consumables[game.pendingConsumable];
    const def = cons ? TAROTS.find(t => t.id === cons.id) : null;
    const maxSel = def ? def.selectCount : 1;
    const idx = game.selected.indexOf(index);
    if (idx >= 0) { game.selected.splice(idx, 1); SFX.deselect(); }
    else if (game.selected.length < maxSel) { game.selected.push(index); SFX.select(); }
    else { showToast(`最多选择 ${maxSel} 张`); return; }
    updateConsumableHint();
    // 选中足够数量后,如果是"世界"牌,显示花色选择
    if (def && def.id === 'the_world' && game.selected.length >= def.selectCount) {
      document.getElementById('suit-picker').style.display = 'flex';
      document.getElementById('consumable-use-hint').textContent = '请选择要变成的花色';
    }
    render();
    return;
  }
  const idx = game.selected.indexOf(index);
  if (idx >= 0) { game.selected.splice(idx, 1); SFX.deselect(); }
  else if (game.selected.length < 5) { game.selected.push(index); SFX.select(); }
  render();
}

function playHand() {
  if (game.animating) return;
  if (game.pendingConsumable !== null && game.pendingConsumable !== undefined) { showToast('请先完成消耗品使用'); return; }
  if (game.selected.length === 0) { showToast('请选择至少1张牌'); return; }
  if (game.handsLeft <= 0) { showToast('没有出牌次数了!'); return; }

  // Boss Debuff: 强迫症 - 必须打5张
  if (game.bossDebuff?.id === 'ocd' && game.selected.length < 5) { showToast('强迫症: 必须打出5张!'); return; }

  // Boss Debuff: 点名 - 必须打出或弃掉指定牌
  if (game.bossDebuff?.id === 'called_out' && game.calledOutIndex !== null && game.calledOutIndex !== undefined) {
    if (game.calledOutIndex >= game.hand.length) {
      game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null;
    }
    if (game.calledOutIndex !== null && !game.selected.includes(game.calledOutIndex)) { showToast('点名: 必须打出或弃掉指定的牌!'); return; }
  }

  const selectedCards = game.selected.map(i => game.hand[i]);
  const result = calculateScore(selectedCards, game);

  // Boss Debuff: 唯一 - 锁定牌型
  if (game.bossDebuff?.id === 'only_one') {
    if (!game.lockedHandType) game.lockedHandType = result.type;
    else if (result.type !== game.lockedHandType) { showToast(`唯一: 只能打${game.lockedHandType}!`); return; }
  }

  // Boss Debuff: 不许重复
  if (game.bossDebuff?.id === 'no_repeat' && game.playedHandTypes.has(result.type)) {
    showToast(`不许重复: ${result.type}已打过!`); return;
  }

  // Boss Debuff: 封锁
  if (game.bossDebuff?.id === 'lockdown' && game.bossDebuff.disabledHand) {
    const dh = game.bossDebuff.disabledHand;
    if (result.type === dh || (dh === '一对' && result.type === '两对') || (dh === '同花顺' && result.type === '皇家同花顺')) {
      showToast(`封锁: ${dh}被禁用!`); return;
    }
  }

  game.handsLeft--;
  game.levelScore += result.total;
  game.totalScore += result.total;
  game.maxSingleScore = Math.max(game.maxSingleScore, result.total);
  SFX.play();

  // 记录牌型
  game.handTypeCounts[result.type] = (game.handTypeCounts[result.type] || 0) + 1;
  game.playedHandTypes.add(result.type);

  // 成就检查
  if (result.type === '同花顺' && !stats.flushStraight) { stats.flushStraight = true; checkAchievements(); }
  if (result.type === '皇家同花顺' && !stats.royalFlush) { stats.royalFlush = true; checkAchievements(); }
  if (result.type === '五条' && !stats.fiveKind) { stats.fiveKind = true; checkAchievements(); }
  if (result.total >= 10000 && !stats.maxSingleScoreAchieve) { checkAchievements(); }
  stats.maxSingleScore = Math.max(stats.maxSingleScore || 0, result.total);
  saveStats();

  // 出牌动画: 标记计分牌和非计分牌
  game.animating = true;
  const cardEls = document.querySelectorAll('#hand-area .playing-card');
  const scoringIds = new Set(result.scoringCards.map(c => c.id));
  game.selected.forEach(idx => {
    if (cardEls[idx]) {
      const card = game.hand[idx];
      if (scoringIds.has(card.id)) {
        cardEls[idx].classList.add('scoring');
      } else {
        cardEls[idx].style.opacity = '0.3';
        cardEls[idx].style.transform = 'scale(0.85)';
        cardEls[idx].style.transition = 'all 0.4s ease';
      }
      cardEls[idx].classList.add('flying');
    }
  });

  // 0.6s 后显示计分弹窗
  setTimeout(() => {
    showScorePopup(result);
  }, 600);

  // 触发出牌回调
  game.jokers.forEach(joker => {
    const def = JOKERS.find(j => j.id === joker.id);
    if (def?.onPlay) def.onPlay(joker, result.type);
  });

  saveGame();

  // 小丑触发指示器: 逐个高亮并显示加成
  if (result.triggerLog && result.triggerLog.length > 0) {
    result.triggerLog.forEach((log, i) => {
      setTimeout(() => {
        if (log.jokerIdx !== undefined) {
          const jokerEls = document.querySelectorAll('#jokers-area .joker-card');
          if (jokerEls[log.jokerIdx]) {
            jokerEls[log.jokerIdx].classList.add('triggered');
            let bonusText = '';
            if (log.chips > 0) bonusText += `+${log.chips}`;
            if (log.mult > 0) bonusText += (bonusText ? ' ' : '') + `+${log.mult}倍`;
            if (bonusText) {
              const popup = document.createElement('div');
              popup.className = 'joker-bonus-popup';
              popup.textContent = bonusText;
              popup.style.color = log.chips > 0 ? 'var(--green)' : 'var(--accent2)';
              jokerEls[log.jokerIdx].appendChild(popup);
              setTimeout(() => popup.remove(), 1000);
            }
          }
        }
      }, 700 + i * 200);
    });
  }

  // 消耗临时小丑
  for (let i = game.jokers.length - 1; i >= 0; i--) {
    const def = JOKERS.find(j => j.id === game.jokers[i].id);
    if (def?.consumeOnUse) game.jokers.splice(i, 1);
  }

  // 移除打出的牌
  const selSet = new Set(game.selected);
  game.hand = game.hand.filter((_, i) => !selSet.has(i));
  game.selected = [];
  drawCards(selectedCards.length);

  // 点名: 出牌后重新指定
  if (game.bossDebuff?.id === 'called_out') {
    game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null;
  }

  setTimeout(() => {
    game.animating = false;
    document.querySelectorAll('.joker-card.triggered').forEach(el => el.classList.remove('triggered'));
    if (game.levelScore >= game.targetScore) winLevel();
    else if (game.handsLeft <= 0) loseLevel();
    else render();
  }, 1400);

  // 延迟渲染新手牌,让飞出动画先播完
  setTimeout(() => { render(); }, 700);
}

function discardCards() {
  if (game.pendingConsumable !== null && game.pendingConsumable !== undefined) { showToast('请先完成消耗品使用'); return; }
  if (game.selected.length === 0) { showToast('请选择要弃的牌'); return; }
  if (game.discardsLeft <= 0) { showToast('没有换牌次数了!'); return; }

  // Boss Debuff: 点名 - 弃牌也必须包含指定牌
  if (game.bossDebuff?.id === 'called_out' && game.calledOutIndex !== null && game.calledOutIndex !== undefined) {
    if (game.calledOutIndex >= game.hand.length) {
      game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null;
    }
    if (game.calledOutIndex !== null && !game.selected.includes(game.calledOutIndex)) { showToast('点名: 必须打出或弃掉指定的牌!'); return; }
  }

  const selSet = new Set(game.selected);
  const discarded = game.selected.map(i => game.hand[i]);
  game.hand = game.hand.filter((_, i) => !selSet.has(i));
  game.selected = [];
  game.discardsLeft--;
  drawCards(discarded.length);
  SFX.discard();

  // 点名: 弃牌后重新指定
  if (game.bossDebuff?.id === 'called_out') {
    game.calledOutIndex = game.hand.length > 0 ? Math.floor(Math.random() * game.hand.length) : null;
  }

  // 评估弃牌的牌型(用于烧焦小丑)
  const discardEval = evaluateHand(discarded, game);
  game.jokers.forEach(joker => {
    const def = JOKERS.find(j => j.id === joker.id);
    if (def?.onDiscard) def.onDiscard(discarded, joker, discardEval.type);
  });

  render();
  saveGame();
}

function winLevel() {
  SFX.win();
  // 计算奖励
  const isBoss = isBossLevel(game.level) || (game.mode === 'endless' && isBossLevel(((game.level - 1) % 9) + 1));
  let reward = 0;
  const exceed = game.levelScore >= game.targetScore * 2;

  if (isBoss) reward += exceed ? 5 : 4;
  else reward += exceed ? 5 : 3;

  const handBonus = game.handsLeft;
  reward += handBonus;

  const interest = Math.floor(game.levelStartMoney * 0.2);
  reward += interest;

  game.money += reward;

  // 显示过关
  document.getElementById('lc-title').textContent = `🎉 第${game.level}层过关!`;
  document.getElementById('lc-rewards').innerHTML = `
    本层得分: <span style="color:var(--green); font-weight:700;">${game.levelScore}</span><br>
    ${exceed ? '超标奖励: <span style="color:var(--gold);">+$5</span><br>' : '达标奖励: <span style="color:var(--gold);">+$' + (isBoss ? 4 : 3) + '</span><br>'}
    剩余出牌: <span style="color:var(--blue);">+$${handBonus}</span><br>
    利息(20%): <span style="color:var(--gold);">+$${interest}</span><br>
    总金币: <span style="color:var(--gold); font-weight:700;">$${game.money}</span>
  `;
  document.getElementById('levelcomplete-modal').classList.add('active');
}

function goToShop() {
  document.getElementById('levelcomplete-modal').classList.remove('active');
  game.rerollCount = 0;
  generateShopItems();
  document.getElementById('shop-modal').classList.add('active');
  renderShop();
  saveGame();
}

function nextLevel() {
  document.getElementById('shop-modal').classList.remove('active');

  // 检查通关
  if (game.mode !== 'endless' && game.level >= 9) {
    gameClear();
    return;
  }

  game.level++;
  game.levelScore = 0;
  game.handsLeft = 4;
  SFX.levelUp();
  game.discardsLeft = 4;
  game.handSize = 8;
  game.bossDebuff = null;
  game.silencedJoker = null;
  game.lockedHandType = null;
  game.playedHandTypes = new Set();
  game.calledOutIndex = null;
  game.levelStartMoney = game.money;
  game.targetScore = getTargetScore(game.level, game.mode);
  game.deck = shuffle(createDeck());
  game.hand = [];
  game.selected = [];
  applyBossDebuff();
  drawCards(game.handSize);
  if (game.bossDebuff?.id === 'called_out' && game.hand.length > 0) {
    game.calledOutIndex = Math.floor(Math.random() * game.hand.length);
  }

  if (game.mode === 'endless') {
    stats.maxEndless = Math.max(stats.maxEndless || 0, game.level);
    if (game.level === 10 && !stats.endless_10) checkAchievements();
  }
  saveStats();
  saveGame();

  render();
  const blindName = isBossLevel(((game.level - 1) % 9) + 1) ? 'Boss层' : '普通层';
  showToast(`第${game.level}层 - ${blindName}`);
}

function loseLevel() {
  SFX.lose();
  if (game.lives > 0) {
    game.lives--;
    showToast(`复活! 剩余复活次数: ${game.lives}`);
    game.handsLeft = 4;
    game.discardsLeft = 4;
    game.levelScore = 0;
    game.deck = shuffle(createDeck());
    game.hand = [];
    game.selected = [];
    game.calledOutIndex = null;
    drawCards(game.handSize);
    if (game.bossDebuff?.id === 'called_out' && game.hand.length > 0) {
      game.calledOutIndex = Math.floor(Math.random() * game.hand.length);
    }
    render();
    saveGame();
    return;
  }
  gameOver();
}

function gameOver() {
  stats.maxScore = Math.max(stats.maxScore || 0, game.totalScore);
  if (game.mode === 'hard' && game.totalScore >= 50000) stats.fifty_k = true;
  checkAchievements();
  saveStats();
  clearSave();

  document.getElementById('go-title').textContent = '💀 游戏结束';
  document.getElementById('go-stats').innerHTML = `
    到达层数: <span style="color:var(--gold);">${game.level}</span><br>
    总得分: <span style="color:var(--green);">${game.totalScore}</span><br>
    最高单手: <span style="color:var(--accent2);">${game.maxSingleScore}</span><br>
    模式: <span style="color:var(--purple);">${game.mode === 'simple' ? '简单' : game.mode === 'hard' ? '困难' : '无尽'}</span>
  `;
  document.getElementById('gameover-modal').classList.add('active');
}

function gameClear() {
  SFX.win();
  setTimeout(() => SFX.achievement(), 400);
  if (game.mode === 'hard') {
    stats.hardClears = (stats.hardClears || 0) + 1;
    if (stats.hardClears === 1 && !CHARACTERS.find(c => c.id === 'straight').unlockCondition) {
      if (!stats.unlockedChars.includes('straight')) stats.unlockedChars.push('straight');
      showToast('解锁角色: 顺子牌手!', true);
    }
  }
  stats.maxScore = Math.max(stats.maxScore || 0, game.totalScore);
  if (!stats.unlockedEndless) { stats.unlockedEndless = true; showToast('解锁无尽模式!', true); }
  checkAchievements();
  saveStats();
  clearSave();

  document.getElementById('go-title').textContent = '🏆 通关!';
  document.getElementById('go-title').style.color = 'var(--green)';
  document.getElementById('go-stats').innerHTML = `
    总得分: <span style="color:var(--green);">${game.totalScore}</span><br>
    最高单手: <span style="color:var(--accent2);">${game.maxSingleScore}</span><br>
    模式: <span style="color:var(--purple);">${game.mode === 'simple' ? '简单' : '困难'}</span><br>
    ${game.mode === 'hard' ? '困难通关次数: <span style="color:var(--gold);">' + (stats.hardClears || 0) + '</span>' : ''}
  `;
  document.getElementById('gameover-modal').classList.add('active');
}

// ============================================================
// 商店系统
// ============================================================
function generateShopItems() {
  const isBoss = isBossLevel(game.level) || (game.mode === 'endless' && isBossLevel(((game.level - 1) % 9) + 1));
  const count = isBoss ? 3 : 2;
  shopItems = [];
  for (let i = 0; i < count; i++) {
    shopItems.push(generateShopItem(isBoss, i === 0 && isBoss));
  }
  // 生成消耗品: 1-2个
  shopConsumables = [];
  const consCount = Math.random() < 0.5 ? 2 : 1;
  for (let i = 0; i < consCount; i++) {
    if (Math.random() < 0.6) {
      const t = TAROTS[Math.floor(Math.random() * TAROTS.length)];
      shopConsumables.push({ def: { ...t }, type: 'tarot', sold: false });
    } else {
      const p = PLANETS[Math.floor(Math.random() * PLANETS.length)];
      shopConsumables.push({ def: { ...p }, type: 'planet', sold: false });
    }
  }
}

function generateShopItem(isBoss, forceEpicPlus) {
  const rarityTable = isBoss
    ? [{r:'common',w:25},{r:'rare',w:35},{r:'epic',w:30},{r:'legend',w:10}]
    : [{r:'common',w:50},{r:'rare',w:30},{r:'epic',w:15},{r:'legend',w:5}];

  let rarity;
  if (forceEpicPlus) rarity = Math.random() < 0.67 ? 'epic' : 'legend';
  else {
    const total = rarityTable.reduce((s, r) => s + r.w, 0);
    let roll = Math.random() * total;
    for (const r of rarityTable) { roll -= r.w; if (roll <= 0) { rarity = r.r; break; } }
  }

  const candidates = JOKERS.filter(j => j.rarity === rarity);
  const def = candidates[Math.floor(Math.random() * candidates.length)];
  return { def: {...def}, sold: false };
}

function renderShop() {
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';

  const isBoss = isBossLevel(game.level) || (game.mode === 'endless' && isBossLevel(((game.level - 1) % 9) + 1));
  document.getElementById('shop-info').textContent = `金币: $${game.money} | 小丑位: ${game.jokers.length}/6${isBoss ? ' | Boss层商店(3张)' : ''}`;

  // 渲染当前已拥有小丑牌(迷你卡片)
  const jokersArea = document.getElementById('shop-jokers-area');
  jokersArea.innerHTML = '';
  if (game.jokers.length === 0) {
    jokersArea.innerHTML = '<div style="color:var(--muted); font-size:10px; padding:8px;">暂无小丑牌</div>';
  } else {
    game.jokers.forEach((joker, idx) => {
      const def = JOKERS.find(j => j.id === joker.id);
      if (!def) return;
      const sellPrice = Math.max(1, Math.floor(def.cost / 2));
      const r = def.rarity;
      const locked = joker.data?.locked;
      const div = document.createElement('div');
      div.className = `shop-owned-mini rarity-${r}`;
      div.style.cssText = `background: linear-gradient(145deg, rgba(0,0,0,0.6), rgba(20,10,40,0.8)); border: 2px solid var(--rarity-${r}); border-radius: 6px;`;
      let stacksHTML = joker.data?.stacks ? `<div style="position:absolute;top:-1px;left:-1px;background:var(--accent);color:#fff;font-size:7px;font-weight:900;padding:1px 4px;border-radius:4px 0 4px 0;">${joker.data.stacks}</div>` : '';
      let sellBtn = locked ? '' : `<div style="position:absolute;bottom:-3px;right:-3px;background:var(--red);color:#fff;font-size:8px;font-weight:900;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid #000;" onclick="event.stopPropagation();sellJoker(${idx})" title="卖出 +$${sellPrice}">$</div>`;
      div.innerHTML = `
        ${stacksHTML}
        <div style="font-size:18px;line-height:1;">${def.icon}</div>
        <div style="font-size:7px;font-weight:800;color:var(--rarity-${r});text-align:center;line-height:1.1;margin-top:2px;">${def.name}</div>
        <div style="font-size:6px;color:var(--gold);font-weight:700;">$${sellPrice}</div>
        ${sellBtn}
      `;
      div.onmouseenter = (e) => showTooltip(e, def, { stacks: joker.data?.stacks, sellPrice, locked: joker.data?.locked });
      div.onmousemove = moveTooltip;
      div.onmouseleave = hideTooltip;
      jokersArea.appendChild(div);
    });
  }

  // 渲染当前消耗品
  const consOwnedArea = document.getElementById('shop-cons-owned-area');
  if (consOwnedArea) {
    consOwnedArea.innerHTML = '';
    if (game.consumables.length === 0) {
      consOwnedArea.innerHTML = '<div style="color:var(--muted); font-size:10px; padding:8px;">暂无消耗品</div>';
    } else {
      game.consumables.forEach((cons, idx) => {
        const isTarot = cons.type === 'tarot';
        const def = isTarot ? TAROTS.find(t => t.id === cons.id) : PLANETS.find(p => p.id === cons.id);
        if (!def) return;
        const div = document.createElement('div');
        div.className = 'shop-owned-mini';
        div.style.cssText = isTarot
          ? 'background:linear-gradient(145deg,#2a0a3e,#4a1a6e);border:2px solid var(--purple);border-radius:6px;'
          : 'background:linear-gradient(145deg,#0a1a3e,#1a3a6e);border:2px solid var(--blue);border-radius:6px;';
        div.innerHTML = `
          <div style="font-size:18px;line-height:1;">${def.icon}</div>
          <div style="font-size:7px;font-weight:800;color:${isTarot ? '#ddbbff' : '#bbddff'};text-align:center;line-height:1.1;margin-top:2px;">${def.name}</div>
        `;
        div.onmouseenter = (e) => showConsumableTooltip(e, def, cons.type);
        div.onmousemove = moveTooltip;
        div.onmouseleave = hideTooltip;
        consOwnedArea.appendChild(div);
      });
    }
  }

  shopItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'shop-item' + (item.sold ? ' sold' : '');
    const r = item.def.rarity;
    const rNames = { common: '普通', rare: '稀有', epic: '史诗', legend: '传说' };

    div.innerHTML = `
      <div class="si-rarity rarity-${r}">${rNames[r]}</div>
      <div class="si-card rarity-${r} ${item.def.temp ? 'temporary' : ''}">
        <div class="si-icon">${item.def.icon}</div>
        <div class="si-name" style="color: var(--rarity-${r});">${item.def.name}</div>
      </div>
      <div class="si-price">$${item.def.cost}</div>
      <button class="si-buy" ${item.sold || game.money < item.def.cost || game.jokers.length >= 6 ? 'disabled' : ''} onclick="buyShopItem(${idx})">
        ${item.sold ? '已售出' : game.jokers.length >= 6 ? '位置已满' : '购买'}
      </button>
    `;
    div.onmouseenter = (e) => showTooltip(e, item.def, { cost: item.def.cost });
    div.onmousemove = moveTooltip;
    div.onmouseleave = hideTooltip;
    grid.appendChild(div);
  });

  // 渲染消耗品
  const consGrid = document.getElementById('shop-consumables-grid');
  if (consGrid) {
    consGrid.innerHTML = '';
    shopConsumables.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'shop-item' + (item.sold ? ' sold' : '');
      const isTarot = item.type === 'tarot';
      div.innerHTML = `
        <div class="si-rarity" style="color:${isTarot ? 'var(--purple)' : 'var(--blue)'};">${isTarot ? '塔罗牌' : '星球牌'}</div>
        <div class="si-card ${isTarot ? 'tarot' : 'planet'}" style="${isTarot ? 'background:linear-gradient(145deg,#2a0a3e,#4a1a6e);border:2px solid var(--purple);' : 'background:linear-gradient(145deg,#0a1a3e,#1a3a6e);border:2px solid var(--blue);'}">
          <div class="si-icon">${item.def.icon}</div>
          <div class="si-name" style="color:${isTarot ? '#ddbbff' : '#bbddff'};">${item.def.name}</div>
        </div>
        <div class="si-price">$${item.def.cost}</div>
        <button class="si-buy" ${item.sold || game.money < item.def.cost || game.consumables.length >= CONSUMABLE_SLOTS ? 'disabled' : ''} onclick="buyConsumable(${idx})">
          ${item.sold ? '已售出' : game.consumables.length >= CONSUMABLE_SLOTS ? '位置已满' : '购买'}
        </button>
      `;
      div.onmouseenter = (e) => showConsumableTooltip(e, item.def, item.type);
      div.onmousemove = moveTooltip;
      div.onmouseleave = hideTooltip;
      consGrid.appendChild(div);
    });
  }

  const rerollCost = Math.min(5, game.rerollCount + 1);
  document.getElementById('reroll-btn').textContent = `🔄 刷新 ($${rerollCost})`;
  document.getElementById('reroll-btn').disabled = game.money < rerollCost;
}

function buyShopItem(idx) {
  const item = shopItems[idx];
  if (item.sold || game.money < item.def.cost || game.jokers.length >= 6) return;

  const jokerInstance = { id: item.def.id, data: { stacks: 0 } };
  game.jokers.push(jokerInstance);
  game.money -= item.def.cost;
  item.sold = true;
  SFX.buy();

  // 补票特殊效果
  if (item.def.id === 're_ticket') { game.handsLeft++; game.discardsLeft++; }

  // 成就
  if (!stats.firstBuy) { stats.firstBuy = true; checkAchievements(); }
  if (item.def.rarity === 'legend' && !stats.legendBuy) { stats.legendBuy = true; checkAchievements(); }
  saveStats();

  showToast(`购买了 ${item.def.name}!`);
  renderShop();
  render();
  saveGame();
}

function sellJoker(idx) {
  const joker = game.jokers[idx];
  if (!joker || joker.data?.locked) { showToast('角色自带小丑不可卖出'); return; }
  const def = JOKERS.find(j => j.id === joker.id);
  if (!def) return;
  const sellPrice = Math.max(1, Math.floor(def.cost / 2));
  game.money += sellPrice;
  game.jokers.splice(idx, 1);
  SFX.sell();
  showToast(`卖出 ${def.name} +$${sellPrice}`);
  renderShop();
  render();
  saveGame();
}

function rerollShop() {
  const cost = Math.min(5, game.rerollCount + 1);
  if (game.money < cost) return;
  game.money -= cost;
  game.rerollCount++;
  SFX.reroll();
  generateShopItems();
  renderShop();
  saveGame();
}

function deleteJoker(idx) {
  const joker = game.jokers[idx];
  if (!joker || joker.data?.locked) { showToast('角色自带小丑不可卖出'); return; }
  const def = JOKERS.find(j => j.id === joker.id);
  if (!def) return;
  const sellPrice = Math.max(1, Math.floor(def.cost / 2));
  game.money += sellPrice;
  game.jokers.splice(idx, 1);
  showToast(`卖出 ${def.name} +$${sellPrice}`);
  render();
  saveGame();
}

// ============================================================
// 消耗品系统
// ============================================================
function useConsumable(idx) {
  const cons = game.consumables[idx];
  if (!cons) return;
  const def = cons.type === 'tarot' ? TAROTS.find(t => t.id === cons.id) : PLANETS.find(p => p.id === cons.id);
  if (!def) return;

  // 星球牌: 直接使用,升级牌型
  if (cons.type === 'planet') {
    const ht = def.handType;
    if (!game.handUpgrades[ht]) game.handUpgrades[ht] = { chips: 0, mult: 0 };
    if (def.id === 'mars') game.handUpgrades[ht].chips += 3;
    else if (def.id === 'pluto') { game.handUpgrades[ht].chips += 2; game.handUpgrades[ht].mult += 1; }
    else game.handUpgrades[ht].mult += (def.id === 'mercury' || def.id === 'venus') ? 1 : (def.id === 'earth' ? 2 : (def.id === 'saturn' || def.id === 'uranus') ? 3 : 4);
    showToast(`升级 ${ht}!`);
    game.consumables.splice(idx, 1);
    SFX.useConsumable();
    render();
    saveGame();
    return;
  }

  // 塔罗牌: 进入选牌模式
  game.pendingConsumable = idx;
  game.pendingSuit = null;
  game.selected = [];
  const overlay = document.getElementById('consumable-use-overlay');
  document.getElementById('consumable-use-title').textContent = `${def.icon} ${def.name}`;
  document.getElementById('consumable-use-desc').textContent = def.desc;
  document.getElementById('consumable-use-hint').textContent = `请选择 ${def.selectCount} 张手牌`;
  document.getElementById('suit-picker').style.display = 'none';
  document.getElementById('consumable-confirm-btn').style.display = '';
  overlay.classList.add('active');
  render();
}

function updateConsumableHint() {
  if (game.pendingConsumable === null || game.pendingConsumable === undefined) return;
  const cons = game.consumables[game.pendingConsumable];
  if (!cons) return;
  const def = TAROTS.find(t => t.id === cons.id);
  if (!def) return;
  const hint = document.getElementById('consumable-use-hint');
  if (game.pendingSuit !== null) {
    hint.textContent = `已选花色 ${game.pendingSuit},点击确认使用`;
  } else {
    const remaining = def.selectCount - game.selected.length;
    if (remaining > 0) hint.textContent = `还需选择 ${remaining} 张手牌 (已选 ${game.selected.length}/${def.selectCount})`;
    else hint.textContent = `已选 ${game.selected.length} 张,点击确认使用`;
  }
}

function pickSuit(suit) {
  game.pendingSuit = suit;
  updateConsumableHint();
}

function confirmConsumable() {
  if (game.pendingConsumable === null || game.pendingConsumable === undefined) return;
  const cons = game.consumables[game.pendingConsumable];
  if (!cons) return;
  const def = TAROTS.find(t => t.id === cons.id);
  if (!def) return;

  const selectedCards = game.selected.map(i => game.hand[i]);
  if (selectedCards.length < def.selectCount) { showToast(`需要选择 ${def.selectCount} 张手牌`); return; }

  const result = def.use(game, selectedCards);
  if (result === 'destroy') {
    const idx = game.selected[0];
    game.hand.splice(idx, 1);
    game.selected = [];
  } else if (result === 'choose_suit') {
    if (!game.pendingSuit) { showToast('请先选择花色'); return; }
    selectedCards[0].suit = game.pendingSuit;
    game.selected = [];
  } else if (result === false) {
    showToast('选择的手牌数量不对');
    return;
  } else {
    game.selected = [];
  }

  game.consumables.splice(game.pendingConsumable, 1);
  game.pendingConsumable = null;
  game.pendingSuit = null;
  document.getElementById('consumable-use-overlay').classList.remove('active');
  SFX.useConsumable();
  showToast(`使用了 ${def.name}`);
  render();
  saveGame();
}

function cancelConsumable() {
  game.pendingConsumable = null;
  game.pendingSuit = null;
  game.selected = [];
  document.getElementById('consumable-use-overlay').classList.remove('active');
  render();
}

function buyConsumable(idx) {
  const item = shopConsumables[idx];
  if (!item || item.sold || game.money < item.def.cost || game.consumables.length >= CONSUMABLE_SLOTS) return;
  game.money -= item.def.cost;
  game.consumables.push({ id: item.def.id, type: item.type });
  item.sold = true;
  showToast(`购买了 ${item.def.name}!`);
  renderShop();
  render();
  saveGame();
}

// ============================================================
// 成就系统
// ============================================================
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!stats['ach_' + a.id] && a.cond(stats)) {
      stats['ach_' + a.id] = true;
      showToast(`🏆 成就解锁: ${a.name}`, true);
      SFX.achievement();
    }
  });
  saveStats();
}

// ============================================================
// 渲染
// ============================================================
function createCardElement(card, index) {
  const div = document.createElement('div');
  div.className = `playing-card ${SUIT_COLORS[card.suit]}`;
  if (game.selected.includes(index)) div.classList.add('selected');
  // Boss Debuff: 断色 - 淡化被禁花色
  if (game.bossDebuff?.id === 'color_cut' && card.suit === game.bossDebuff.disabledSuit) div.classList.add('debuffed');
  // Boss Debuff: 点名 - 高亮指定牌
  if (game.bossDebuff?.id === 'called_out' && game.calledOutIndex === index) {
    div.style.boxShadow = '0 0 20px var(--accent), 0 4px 15px rgba(0,0,0,0.6)';
    div.style.borderColor = 'var(--accent)';
  }
  div.innerHTML = `
    <div class="pc-corner"><span>${card.rank}</span><span>${card.suit}</span></div>
    <div class="pc-center">${card.suit}</div>
    <div class="pc-corner br"><span>${card.rank}</span><span>${card.suit}</span></div>
  `;
  div.onclick = () => selectCard(index);
  return div;
}

function render() {
  document.getElementById('level-val').textContent = game.mode === 'endless' ? `${game.level}` : `${game.level}/9`;
  document.getElementById('money-val').textContent = game.money;
  document.getElementById('hands-val').textContent = game.handsLeft;
  document.getElementById('discards-val').textContent = game.discardsLeft;
  document.getElementById('joker-count-val').textContent = `${game.jokers.length}/6`;
  document.getElementById('target-val').textContent = game.targetScore;
  document.getElementById('round-score-val').textContent = game.levelScore;

  // 盲注信息
  const isBoss = isBossLevel(game.level) || (game.mode === 'endless' && isBossLevel(((game.level - 1) % 9) + 1));
  const label = document.getElementById('blind-label');
  label.textContent = `第 ${game.level} 层${isBoss ? ' (Boss)' : ''}`;
  label.className = isBoss ? 'boss-tag' : 'normal-tag';

  // Boss Debuff 显示
  const debuffDisplay = document.getElementById('boss-debuff-display');
  if (game.bossDebuff) {
    debuffDisplay.style.display = 'block';
    let debuffText = `⚠ ${game.bossDebuff.name}: ${game.bossDebuff.desc}`;
    if (game.bossDebuff.id === 'color_cut' && game.bossDebuff.disabledSuit) debuffText += ` (${game.bossDebuff.disabledSuit})`;
    if (game.bossDebuff.id === 'lockdown' && game.bossDebuff.disabledHand) debuffText += ` (禁用${game.bossDebuff.disabledHand})`;
    debuffDisplay.textContent = debuffText;
  } else {
    debuffDisplay.style.display = 'none';
  }

  // 进度条
  document.getElementById('score-progress-bar').style.width = Math.min(100, (game.levelScore / game.targetScore) * 100) + '%';

  // 预览
  const inConsumableMode = game.pendingConsumable !== null && game.pendingConsumable !== undefined;
  if (!inConsumableMode && game.selected.length > 0) {
    const cards = game.selected.map(i => game.hand[i]);
    const preview = calculateScore(cards, game);
    document.getElementById('hand-type-val').textContent = preview.type;
    document.getElementById('hand-mult-val').textContent = `${preview.chips}×${preview.mult}`;
  } else {
    document.getElementById('hand-type-val').textContent = '--';
    document.getElementById('hand-mult-val').textContent = '--';
  }

  document.getElementById('deck-count').textContent = game.deck.length;

  // 小丑牌
  const jokersArea = document.getElementById('jokers-area');
  jokersArea.innerHTML = '';
  game.jokers.forEach((joker, idx) => {
    const def = JOKERS.find(j => j.id === joker.id);
    if (!def) return;
    const div = document.createElement('div');
    div.className = `joker-card rarity-${def.rarity}${def.temp ? ' temporary' : ''}${joker.data?.locked ? ' locked' : ''}`;
    let stacksHTML = '';
    if (joker.data?.stacks) stacksHTML = `<div class="j-stacks">${joker.data.stacks}</div>`;
    let tempBadge = def.temp ? '<div class="j-temp-badge">临时</div>' : '';
    let deleteBtn = joker.data?.locked ? '' : `<div class="j-delete" onclick="event.stopPropagation();deleteJoker(${idx})" title="卖出">$</div>`;
    // 沉默标记
    let silenceMark = (game.silencedJoker === joker) ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;opacity:0.6;">🔇</div>' : '';
    div.innerHTML = `
      ${stacksHTML}${tempBadge}
      <div class="j-name" style="${game.silencedJoker === joker ? 'text-decoration:line-through;opacity:0.4;' : ''}">${def.name}</div>
      <div class="j-icon" style="${game.silencedJoker === joker ? 'opacity:0.3;' : ''}">${def.icon}</div>
      ${silenceMark}
      ${deleteBtn}
    `;
    const sellPrice = Math.max(1, Math.floor(def.cost / 2));
    div.onmouseenter = (e) => showTooltip(e, def, { stacks: joker.data?.stacks, sellPrice, locked: joker.data?.locked });
    div.onmousemove = moveTooltip;
    div.onmouseleave = hideTooltip;
    jokersArea.appendChild(div);
  });

  // 消耗品
  const consumablesArea = document.getElementById('consumables-area');
  consumablesArea.innerHTML = '';
  game.consumables.forEach((cons, idx) => {
    const div = document.createElement('div');
    const isTarot = cons.type === 'tarot';
    const def = isTarot ? TAROTS.find(t => t.id === cons.id) : PLANETS.find(p => p.id === cons.id);
    if (!def) return;
    div.className = `consumable-card ${isTarot ? 'tarot' : 'planet'}`;
    div.innerHTML = `
      <div class="c-icon">${def.icon}</div>
      <div class="c-name">${def.name}</div>
      <div class="c-use-badge">使用</div>
    `;
    div.onclick = () => useConsumable(idx);
    div.onmouseenter = (e) => showConsumableTooltip(e, def, cons.type);
    div.onmousemove = moveTooltip;
    div.onmouseleave = hideTooltip;
    consumablesArea.appendChild(div);
  });
  // 空位占位(缩小,仅在有消耗品或小丑牌时显示空位)
  if (game.consumables.length > 0 || game.jokers.length > 0) {
    for (let i = game.consumables.length; i < CONSUMABLE_SLOTS; i++) {
      const div = document.createElement('div');
      div.style.cssText = 'width:60px;height:88px;border:2px dashed rgba(255,255,255,0.08);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:10px;';
      div.textContent = '空';
      consumablesArea.appendChild(div);
    }
  }
  document.getElementById('consumable-count').textContent = `${game.consumables.length}/${CONSUMABLE_SLOTS}`;

  // 手牌
  const handArea = document.getElementById('hand-area');
  handArea.innerHTML = '';
  game.hand.forEach((card, idx) => handArea.appendChild(createCardElement(card, idx)));

  // 按钮
  document.getElementById('play-btn').disabled = game.selected.length === 0 || game.handsLeft <= 0;
  document.getElementById('discard-btn').disabled = game.selected.length === 0 || game.discardsLeft <= 0;
}

// ============================================================
// 计分动画
// ============================================================
function showScorePopup(result) {
  const popup = document.getElementById('score-popup');
  document.getElementById('sp-hand').textContent = result.type;
  document.getElementById('sp-calc').textContent = `${result.chips} × ${result.mult}`;
  document.getElementById('sp-total').textContent = `+${result.total}`;
  popup.style.display = 'block';
  popup.style.animation = 'none';
  popup.offsetHeight;
  popup.style.animation = 'scorePopIn 0.3s ease, scorePopOut 0.3s ease 1.1s forwards';
  SFX.score(result.chips, result.mult);
  // 小丑触发音效 (延迟)
  if (result.jokerContributions && result.jokerContributions.length > 0) {
    result.jokerContributions.forEach((_, i) => { setTimeout(() => SFX.jokerTrigger(), 300 + i * 200); });
  }
  setTimeout(() => { popup.style.display = 'none'; }, 1400);
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes scorePopIn { from { opacity:0; transform: translate(-50%,-50%) scale(0.5); } to { opacity:1; transform: translate(-50%,-50%) scale(1); } } @keyframes scorePopOut { to { opacity:0; transform: translate(-50%,-50%) scale(1.5); } }`;
document.head.appendChild(styleSheet);

// ============================================================
// 排序
// ============================================================
function sortByRank() { if (game.pendingConsumable !== null && game.pendingConsumable !== undefined) return; game.hand.sort((a,b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]); game.selected = []; render(); }
function sortBySuit() { if (game.pendingConsumable !== null && game.pendingConsumable !== undefined) return; game.hand.sort((a,b) => { if (a.suit !== b.suit) return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit); return RANK_ORDER[b.rank] - RANK_ORDER[a.rank]; }); game.selected = []; render(); }

// ============================================================
// 牌型速查
// ============================================================
function buildHandChart() {
  const chartData = [
    { name:'高牌', base:HAND_TYPES['高牌'], demo:[{r:'A',s:'♠',c:'black'},{r:'5',s:'♥',c:'red',f:1},{r:'9',s:'♣',c:'black',f:1},{r:'2',s:'♦',c:'red',f:1},{r:'K',s:'♠',c:'black',f:1}], desc:'未组成其他牌型' },
    { name:'一对', base:HAND_TYPES['一对'], demo:[{r:'7',s:'♥',c:'red'},{r:'7',s:'♣',c:'black'},{r:'K',s:'♦',c:'red',f:1},{r:'3',s:'♠',c:'black',f:1},{r:'9',s:'♥',c:'red',f:1}], desc:'2张同点数' },
    { name:'两对', base:HAND_TYPES['两对'], demo:[{r:'J',s:'♠',c:'black'},{r:'J',s:'♥',c:'red'},{r:'4',s:'♣',c:'black'},{r:'4',s:'♦',c:'red'},{r:'A',s:'♠',c:'black',f:1}], desc:'两组对子' },
    { name:'三条', base:HAND_TYPES['三条'], demo:[{r:'9',s:'♥',c:'red'},{r:'9',s:'♣',c:'black'},{r:'9',s:'♦',c:'red'},{r:'K',s:'♠',c:'black',f:1},{r:'2',s:'♥',c:'red',f:1}], desc:'3张同点数' },
    { name:'顺子', base:HAND_TYPES['顺子'], demo:[{r:'5',s:'♥',c:'red'},{r:'6',s:'♣',c:'black'},{r:'7',s:'♦',c:'red'},{r:'8',s:'♠',c:'black'},{r:'9',s:'♥',c:'red'}], desc:'5张连续点数' },
    { name:'同花', base:HAND_TYPES['同花'], demo:[{r:'2',s:'♠',c:'black'},{r:'5',s:'♠',c:'black'},{r:'9',s:'♠',c:'black'},{r:'J',s:'♠',c:'black'},{r:'K',s:'♠',c:'black'}], desc:'5张同花色' },
    { name:'葫芦', base:HAND_TYPES['葫芦'], demo:[{r:'Q',s:'♥',c:'red'},{r:'Q',s:'♣',c:'black'},{r:'Q',s:'♦',c:'red'},{r:'7',s:'♠',c:'black'},{r:'7',s:'♥',c:'red'}], desc:'三条+一对' },
    { name:'四条', base:HAND_TYPES['四条'], demo:[{r:'A',s:'♠',c:'black'},{r:'A',s:'♥',c:'red'},{r:'A',s:'♦',c:'red'},{r:'A',s:'♣',c:'black'},{r:'3',s:'♠',c:'black',f:1}], desc:'4张同点数' },
    { name:'同花顺', base:HAND_TYPES['同花顺'], demo:[{r:'4',s:'♥',c:'red'},{r:'5',s:'♥',c:'red'},{r:'6',s:'♥',c:'red'},{r:'7',s:'♥',c:'red'},{r:'8',s:'♥',c:'red'}], desc:'同花色连续5张' },
    { name:'皇家同花顺', base:HAND_TYPES['皇家同花顺'], demo:[{r:'10',s:'♠',c:'black'},{r:'J',s:'♠',c:'black'},{r:'Q',s:'♠',c:'black'},{r:'K',s:'♠',c:'black'},{r:'A',s:'♠',c:'black'}], desc:'10-J-Q-K-A同花' },
    { name:'五条', base:HAND_TYPES['五条'], demo:[{r:'K',s:'♠',c:'black'},{r:'K',s:'♥',c:'red'},{r:'K',s:'♦',c:'red'},{r:'K',s:'♣',c:'black'},{r:'K',s:'♠',c:'black'}], desc:'5张同点数(需特殊手段)' },
  ];
  const container = document.getElementById('handchart-content');
  container.innerHTML = '';
  chartData.forEach(item => {
    let demoHTML = '<div class="hc-demo">';
    item.demo.forEach(c => { demoHTML += `<div class="hc-mini-card ${c.c} ${c.f?'faded':''}">${c.r}<br>${c.s}</div>`; });
    demoHTML += '</div>';
    const div = document.createElement('div');
    div.className = 'hc-card';
    div.innerHTML = `${demoHTML}<div><div class="hc-name">${item.name}</div><div class="hc-stats"><b>${item.base[0]}</b>分 × <b>${item.base[1]}</b>倍率</div><div class="hc-stats" style="font-size:10px;">${item.desc}</div></div>`;
    container.appendChild(div);
  });
}

// ============================================================
// 牌堆查看器
// ============================================================
function buildDeckView() {
  const container = document.getElementById('deckview-content');
  const suitOrder = ['♠', '♥', '♦', '♣'];
  const rankOrder = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  let html = `<div style="font-size:13px; color:var(--muted); margin-bottom:10px;">牌堆剩余 ${game.deck.length} 张</div>`;
  html += '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">';
  suitOrder.forEach(suit => {
    const isRed = (suit === '♥' || suit === '♦');
    const cardsInSuit = game.deck.filter(c => c.suit === suit);
    const sorted = cardsInSuit.sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
    html += `<div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:8px 4px;">`;
    html += `<div style="font-size:20px; margin-bottom:6px; ${isRed ? 'color:var(--red);' : 'color:var(--text);'}">${suit}</div>`;
    html += '<div style="display:flex; flex-wrap:wrap; gap:3px; justify-content:center;">';
    if (sorted.length === 0) {
      html += '<span style="font-size:10px; color:var(--muted);">无</span>';
    } else {
      sorted.forEach(c => {
        html += `<span style="display:inline-block; background:#fff; color:${isRed ? '#d44' : '#222'}; font-size:11px; font-weight:700; padding:2px 5px; border-radius:3px; border:1px solid #888;">${c.rank}</span>`;
      });
    }
    html += '</div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

// ============================================================
// 本局统计
// ============================================================
function buildRunStats() {
  const container = document.getElementById('runstats-content');
  const counts = game.handTypeCounts;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  let html = '';
  html += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">`;
  html += `<div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:10px; text-align:center;"><div style="font-size:10px;color:var(--muted);">当前层</div><div style="font-size:20px;font-weight:700;color:var(--gold);">${game.level}</div></div>`;
  html += `<div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:10px; text-align:center;"><div style="font-size:10px;color:var(--muted);">累计得分</div><div style="font-size:20px;font-weight:700;color:var(--green);">${game.totalScore}</div></div>`;
  html += `<div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:10px; text-align:center;"><div style="font-size:10px;color:var(--muted);">最高单次</div><div style="font-size:20px;font-weight:700;color:var(--accent2);">${game.maxSingleScore}</div></div>`;
  html += `<div style="background:rgba(0,0,0,0.3); border-radius:8px; padding:10px; text-align:center;"><div style="font-size:10px;color:var(--muted);">出牌次数</div><div style="font-size:20px;font-weight:700;color:var(--blue);">${total}</div></div>`;
  html += `</div>`;
  html += '<div style="font-size:13px; font-weight:700; margin-bottom:6px; color:var(--text);">牌型统计</div>';
  const ordered = ['高牌', '一对', '两对', '三条', '顺子', '同花', '葫芦', '四条', '同花顺', '皇家同花顺', '五条'];
  html += '<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:4px;">';
  ordered.forEach(ht => {
    const count = counts[ht] || 0;
    const dim = count === 0 ? 'opacity:0.4;' : '';
    html += `<div style="display:flex; justify-content:space-between; padding:4px 10px; background:rgba(0,0,0,0.2); border-radius:6px; ${dim}"><span style="font-size:12px;">${ht}</span><span style="font-size:12px; font-weight:700; color:var(--gold);">${count}</span></div>`;
  });
  html += '</div>';
  if (game.handUpgrades && Object.keys(game.handUpgrades).length > 0) {
    html += '<div style="font-size:13px; font-weight:700; margin:12px 0 6px; color:var(--text);">牌型升级</div>';
    html += '<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:4px;">';
    Object.entries(game.handUpgrades).forEach(([ht, up]) => {
      html += `<div style="display:flex; justify-content:space-between; padding:4px 10px; background:rgba(170,68,255,0.1); border-radius:6px;"><span style="font-size:12px;">${ht}</span><span style="font-size:11px; color:var(--purple);">+${up.chips||0}分 +${up.mult||0}倍</span></div>`;
    });
    html += '</div>';
  }
  container.innerHTML = html;
}

// ============================================================
// 开始界面渲染
// ============================================================
function renderStartScreen() {
  const charGrid = document.getElementById('char-grid');
  charGrid.innerHTML = '';
  CHARACTERS.forEach(char => {
    const unlocked = stats.unlockedChars?.includes(char.id);
    const div = document.createElement('div');
    div.className = 'char-card' + (unlocked ? '' : ' locked') + (selectedChar === char.id ? ' selected' : '');
    div.innerHTML = `
      <div class="char-icon">${char.icon}</div>
      <div class="char-name">${char.name}</div>
      <div class="char-desc">${unlocked ? char.desc : '🔒 ' + char.unlockCondition}</div>
    `;
    if (unlocked) div.onclick = () => { selectedChar = char.id; renderStartScreen(); updateStartBtn(); };
    charGrid.appendChild(div);
  });

  const modeGrid = document.getElementById('mode-grid');
  modeGrid.innerHTML = '';
  const modes = [
    { id: 'simple', icon: '🌱', name: '简单模式', desc: '1次复活,低目标分,不计成就', unlocked: true },
    { id: 'hard', icon: '🔥', name: '困难模式', desc: '无复活,高目标分,计入成就', unlocked: true },
    { id: 'endless', icon: '♾️', name: '无尽模式', desc: '无限层数,质数目标分', unlocked: stats.unlockedEndless },
  ];
  modes.forEach(mode => {
    const div = document.createElement('div');
    div.className = 'mode-card' + (mode.unlocked ? '' : ' locked') + (selectedMode === mode.id ? ' selected' : '');
    div.innerHTML = `<div class="mode-icon">${mode.icon}</div><div class="mode-name">${mode.name}</div><div class="mode-desc">${mode.unlocked ? mode.desc : '🔒 通关九层塔解锁'}</div>`;
    if (mode.unlocked) div.onclick = () => { selectedMode = mode.id; renderStartScreen(); updateStartBtn(); };
    modeGrid.appendChild(div);
  });

  // 显示/隐藏继续游戏按钮
  const hasSaveGame = hasSave();
  document.getElementById('continue-btn').style.display = hasSaveGame ? '' : 'none';
  document.getElementById('delete-save-btn').style.display = hasSaveGame ? '' : 'none';
}

function updateStartBtn() {
  document.getElementById('start-btn').disabled = !selectedChar || !selectedMode;
}

// ============================================================
// 事件绑定
// ============================================================
document.getElementById('start-btn').onclick = () => { clearSave(); startGame(); };
document.getElementById('continue-btn').onclick = continueGame;
document.getElementById('delete-save-btn').onclick = () => {
  clearSave();
  renderStartScreen();
  showToast('存档已删除');
};
document.getElementById('sound-toggle').onclick = () => {
  soundEnabled = !soundEnabled;
  document.getElementById('sound-toggle').textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) { initAudio(); SFX.button(); }
};
document.getElementById('play-btn').onclick = playHand;
document.getElementById('discard-btn').onclick = discardCards;
document.getElementById('sort-rank-btn').onclick = sortByRank;
document.getElementById('sort-suit-btn').onclick = sortBySuit;
document.getElementById('reroll-btn').onclick = rerollShop;
document.getElementById('next-level-btn').onclick = nextLevel;
document.getElementById('go-shop-btn').onclick = goToShop;
document.getElementById('hand-chart-btn').onclick = () => { buildHandChart(); document.getElementById('handchart-modal').classList.add('active'); };
document.getElementById('close-handchart-btn').onclick = () => document.getElementById('handchart-modal').classList.remove('active');
document.getElementById('deck-view-btn').onclick = () => { buildDeckView(); document.getElementById('deckview-modal').classList.add('active'); };
document.getElementById('close-deckview-btn').onclick = () => document.getElementById('deckview-modal').classList.remove('active');
document.getElementById('run-stats-btn').onclick = () => { buildRunStats(); document.getElementById('runstats-modal').classList.add('active'); };
document.getElementById('close-runstats-btn').onclick = () => document.getElementById('runstats-modal').classList.remove('active');
document.getElementById('consumable-confirm-btn').onclick = confirmConsumable;
document.getElementById('consumable-cancel-btn').onclick = cancelConsumable;
document.getElementById('restart-btn').onclick = () => {
  document.getElementById('gameover-modal').classList.remove('active');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  selectedChar = null; selectedMode = null;
  renderStartScreen();
  updateStartBtn();
};

// ============================================================
// 启动
// ============================================================
renderStartScreen();
