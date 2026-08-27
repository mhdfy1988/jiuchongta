# 九层塔 · 扑克肉鸽

一款基于扑克牌的 Roguelike 游戏，灵感来自 Balatro（小丑牌）。用一副标准扑克打出各种牌型，搭配小丑牌和消耗品，层层挑战直到登顶九层塔。

在线试玩：https://mhdfy1988.github.io/jiuchongta/

## 特性

- 11 种牌型，从高牌到五条
- 48 张小丑牌，4 种稀有度（普通 / 稀有 / 史诗 / 传说）
- 8 张塔罗牌 + 9 张星球牌
- 3 个可解锁角色，各有初始小丑
- 3 种游戏模式（简单 / 困难 / 无尽）
- 9 个 Boss 减益效果
- 10 个成就
- 本地存档自动保存
- 响应式布局，适配桌面和移动端

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 游戏玩法

每一层你有固定的出牌次数和换牌次数，从手牌中选出若干张打出，达到目标分数即可过关。

### 核心规则

- **出牌**：从手牌中选择 1-5 张打出，计分后弃掉并补充新手牌
- **换牌**：丢弃选中的牌，从牌堆抽新牌，不计分
- **计分**：牌型底分 + 计分牌点数 × 倍率 = 最终得分
- **商店**：过关后进入商店，用金币购买小丑牌、塔罗牌、星球牌
- **Boss**：每 3 层一个 Boss，带有特殊减益效果

### 牌型一览

| 牌型 | 底分 | 倍率 |
|------|------|------|
| 高牌 | 5 | 1 |
| 一对 | 10 | 2 |
| 两对 | 20 | 2 |
| 三条 | 30 | 3 |
| 顺子 | 35 | 4 |
| 同花 | 40 | 4 |
| 葫芦 | 50 | 5 |
| 四条 | 70 | 7 |
| 同花顺 | 120 | 10 |
| 皇家同花顺 | 160 | 12 |
| 五条 | 220 | 18 |

更详细的玩法说明见 [游戏玩法](docs/GAMEPLAY.md)。

## 技术栈

- **框架**：Vue 3 + Vite
- **状态管理**：Vue Composition API (reactive / ref)
- **样式**：原生 CSS + CSS 变量
- **部署**：GitHub Pages
- **存档**：localStorage

详细架构说明见 [技术架构](docs/ARCHITECTURE.md)。

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── StartScreen.vue       # 开始界面
│   ├── GameScreen.vue        # 游戏主界面
│   ├── ShopModal.vue         # 商店
│   ├── CardCollectionModal.vue  # 卡牌图鉴
│   ├── HandChartModal.vue    # 牌型速查
│   ├── DeckViewModal.vue     # 牌堆查看
│   ├── ConsumableOverlay.vue # 消耗品使用
│   ├── LevelCompleteModal.vue  # 过关弹窗
│   ├── GameOverModal.vue     # 游戏结束
│   ├── RunStatsModal.vue     # 本局统计
│   └── AchievementsModal.vue # 成就
├── composables/         # 组合式函数
│   ├── useGameState.js      # 游戏状态管理
│   ├── useScoring.js        # 计分逻辑
│   └── useAudio.js          # 音效
├── data/                # 游戏数据
│   ├── constants.js         # 常量（牌型、花色等）
│   ├── jokers.js            # 小丑牌定义
│   ├── consumables.js       # 消耗品定义
│   ├── characters.js        # 角色与模式
│   ├── bosses.js            # Boss 定义
│   └── achievements.js      # 成就定义
├── styles/              # 样式
│   ├── variables.css        # CSS 变量
│   └── base.css             # 全局样式
├── utils/               # 工具函数
│   └── cardUtils.js         # 卡牌工具
├── App.vue              # 根组件
└── main.js              # 入口文件
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT
