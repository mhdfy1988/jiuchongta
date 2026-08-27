# 技术架构

## 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 构建工具 | Vite 5 | 极速开发体验，原生 ESM |
| 框架 | Vue 3.5 | Composition API，响应式系统 |
| 样式 | 原生 CSS | CSS 变量主题系统，零依赖 |
| 状态管理 | Vue reactive/ref | 轻量级，无需额外状态库 |
| 音效 | Web Audio API | 纯前端合成，无需音频文件 |
| 存档 | localStorage | 浏览器本地持久化 |
| 部署 | GitHub Pages | 静态托管，免费 CDN |

## 架构分层

```
┌─────────────────────────────────────────┐
│             组件层 (Components)          │
│  StartScreen / GameScreen / Modals...    │
├─────────────────────────────────────────┤
│           组合式函数层 (Composables)     │
│   useGameState / useScoring / useAudio   │
├─────────────────────────────────────────┤
│               数据层 (Data)              │
│  jokers / consumables / characters / ... │
├─────────────────────────────────────────┤
│              工具层 (Utils)              │
│            cardUtils / helpers           │
└─────────────────────────────────────────┘
```

### 组件层

负责 UI 渲染和用户交互，不直接包含业务逻辑，通过组合式函数获取状态和方法。

**核心组件：**
- `App.vue` — 根组件，管理屏幕切换（start / game）和全局 toast
- `StartScreen.vue` — 开始界面，角色和模式选择
- `GameScreen.vue` — 游戏主界面，三栏布局
- `ShopModal.vue` — 商店弹窗
- `CardCollectionModal.vue` — 卡牌图鉴（小丑/塔罗/星球分页）
- `HandChartModal.vue` — 牌型速查表
- `DeckViewModal.vue` — 牌堆查看
- `ConsumableOverlay.vue` — 消耗品使用覆盖层
- `LevelCompleteModal.vue` — 过关弹窗
- `GameOverModal.vue` — 游戏结束弹窗
- `RunStatsModal.vue` — 本局统计
- `AchievementsModal.vue` — 成就系统

### 组合式函数层

封装游戏核心逻辑，提供响应式状态和操作方法。

#### useGameState.js

游戏状态管理的核心，包含：

- `game` — 游戏核心状态（reactive 对象）
- `screen` — 当前屏幕（start / game）
- `showHandChart`, `showDeck`, `showShop` 等 — 弹窗状态
- `startGame()` — 开始新游戏
- `toggleCard(card)` — 选中/取消选中一张牌
- `playHand()` — 出牌计分
- `discardCards()` — 换牌
- `drawCards(count)` — 抽牌
- `buyShopItem(index)` — 购买商店物品
- `sellJoker(index)` — 卖出小丑
- `useConsumable(index)` — 使用消耗品
- `nextLevel()` — 进入下一层
- `saveGame()`, `loadGame()`, `clearSave()` — 存档管理

游戏状态对象结构：
```js
{
  mode: 'hard',           // 游戏模式
  character: 'normal',    // 角色
  level: 1,               // 当前层数
  deck: [],               // 牌堆（剩余的牌）
  hand: [],               // 手牌
  selected: [],           // 选中的牌索引
  jokers: [],             // 小丑牌 [{ id, data }]
  consumables: [],        // 消耗品 [{ id, data }]
  money: 5,               // 金币
  handsLeft: 4,           // 剩余出牌次数
  discardsLeft: 4,        // 剩余换牌次数
  handSize: 8,            // 手牌上限
  levelScore: 0,          // 本层得分
  targetScore: 300,       // 目标分
  handUpgrades: {},       // 牌型升级记录
  bossDebuff: null,       // 当前 Boss 减益
  shopItems: [],          // 商店商品
  lastPlayed: null,       // 上一手记录
}
```

#### useScoring.js

计分逻辑，纯函数式：

- `evaluateHand(cards, game)` — 评估牌型，返回牌型名称、底分、倍率、计分牌
- `calculateScore(cards, game)` — 计算最终得分，遍历所有小丑效果
- `isStraight(ranks)` — 顺子检测
- `detectHandType(...)` — 牌型识别

计分流程：
1. 识别牌型（从高到低匹配：五条 → 皇家同花顺 → ... → 高牌）
2. 计算基础底分和基础倍率
3. 应用牌型升级加成
4. 遍历所有小丑，累加底分和倍率
5. 应用乘倍率
6. 返回最终得分和详细明细

#### useAudio.js

音效系统，使用 Web Audio API 合成音效：

- `playTone(freq, duration, type)` — 播放单音调
- `playSelect()` — 选牌音效
- `playPlay()` — 出牌音效
- `playCoin()` — 金币音效
- `playWin()` — 过关音效
- `playError()` — 错误音效

### 数据层

所有游戏配置数据以纯数组/对象形式定义：

| 文件 | 内容 |
|------|------|
| `constants.js` | 花色、点数、牌型底分/倍率、目标分数、稀有度名称等 |
| `jokers.js` | 48 张小丑牌定义（id、名称、图标、稀有度、价格、类型、效果函数） |
| `consumables.js` | 8 张塔罗牌 + 9 张星球牌定义 |
| `characters.js` | 3 个角色 + 3 种模式定义 |
| `bosses.js` | Boss 减益效果定义（弱/中/强三档） |
| `achievements.js` | 10 个成就定义及条件函数 |

小丑效果通过函数实现，接收上下文对象 `ctx`：
```js
{
  chips,        // 当前底分（可修改）
  mult,         // 当前倍率（可修改）
  xmult,        // 当前乘倍率（可修改）
  scoringCards, // 计分牌数组
  playedCards,  // 所有打出的牌
  discardLeft,  // 剩余换牌次数
  deckCount,    // 牌堆剩余张数
  game,         // 游戏状态引用
  joker,        // 当前小丑引用（可修改 data）
}
```

### 工具层

`cardUtils.js` 提供卡牌操作工具：

- `createDeck()` — 创建一副 52 张标准扑克
- `shuffle(array)` — Fisher-Yates 洗牌算法
- `drawCards(game, count)` — 从牌堆抽牌到手牌
- `cardRankValue(rank)` — 获取点数数值

## 响应式数据流

```
用户操作 → 组件事件 → useGameState 方法 → 修改 game 对象
                                                ↓
                                          Vue 响应式更新
                                                ↓
                                        组件重新渲染 UI
```

所有状态变更都通过 `useGameState` 暴露的方法进行，确保状态一致性。组件只负责展示和触发事件，不直接修改状态。

## 存档系统

存档使用 localStorage，key 为 `pokerRoguelikeSave`。

存档内容：
- 本局游戏状态（可继续游戏）
- 成就进度
- 统计数据（通关次数、最高分、最高层数等）
- 解锁的角色和模式

每次状态变更后自动保存（防抖处理），页面加载时自动读取。

## 部署流程

使用 GitHub Actions 自动部署到 GitHub Pages：

1. 推送到 `main` 分支
2. GitHub Action 运行 `npm run build`
3. 将 `dist` 目录推送到 `gh-pages` 分支
4. GitHub Pages 自动生效

也可手动部署：
```bash
npm run build
npx gh-pages -d dist -b gh-pages
```

## 性能优化

- **组件懒更新**：使用 Vue 的响应式系统，只更新变化的部分
- **卡牌复用**：手牌使用 key 绑定卡牌 id，减少 DOM 重建
- **防抖存档**：状态变更后 500ms 才写入 localStorage
- **CSS 变量**：主题色统一管理，避免重复计算
- **纯函数计分**：计分逻辑无副作用，可缓存
