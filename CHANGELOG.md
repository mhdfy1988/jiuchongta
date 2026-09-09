# 更新日志

## [1.2.0] - 2026-09-09

### 优化

- 代码审查修复：高优4项 + 中优8项 + 低优6项
  - CSS 命名统一（rarity-legend 全局一致）
  - Joker ID 缓存失效修复（去掉模块级缓存，每次构建新 Set）
  - ScoreAnimation 空步骤保护
  - GameScreen watch RAF 在 onUnmounted 取消
  - 数据查找统一（RunStatsModal/ConsumableOverlay 用 gameData Map）
  - Tooltip 逻辑抽公共 useTooltip composable
  - Boss 层判断抽公共 isBossLevelForGame
  - ShopModal 卖出逻辑合并为 handleSell
  - cardUtils 排序常量提取为模块级
  - useGameState bus 监听统一清理
  - saveSystem toRaw 改为 JSON 深拷贝
- 低优重构：Boss if-else 改策略表、商店买卖抽公共流程、消耗品 pending 查找合并
- 新增 7 个音效：抽牌/Boss出场/商店/游戏开始/排序/牌堆/过关弹窗
- 性能优化：存档防抖 300ms、Joker 查找 O(1)、cardUtils 常量模块级

## [1.1.1] - 2026-09-08

### 修复

- 开始游戏进入选择界面时未清空上次的角色和模式选择
- 排序按钮默认灰色不可见，改为紫色高亮可点击样式

## [1.1.0] - 2026-09-08

### 新增

- 计分动画系统（牌型亮相 → 逐条叠加 → 爆燃结算，双击跳过）
- 卡牌图鉴新增 Boss 标签页，初级/中级/高级三组侧边切换
- 左侧 Boss debuff 栏显示动态参数（禁用牌型/花色/沉默小丑/已打牌型/点名牌）
- 游戏结束结算显示本局新解锁成就，区分累计与本局
- 10 个系统测试文件（boss/shop/joker/level/achievement 等），测试总数 197

### 修复

- 断色 Boss 实际无效果：被禁花色牌不参与牌型判定和计分
- "不许重复"Boss 改为能打但不计分（原实现直接拦截出牌）
- 点名 Boss 进层时不立即点名，需出完一手才点名
- silencedJoker 存档后对象引用失效，导致沉默效果读档后无效
- 重开游戏消耗牌残留（startGame 未重置 consumables）
- 卖出确认状态无取消方式：新增取消按钮 + ESC 快捷键
- DeckViewModal 四花色布局显示为 3 列

### 优化

- 统一小丑牌与消耗牌牌格大小（78×110）
- 左侧当前分在计分动画结束后才滚动上涨
- pendingConsumable 从数组索引改为对象引用，避免卖出后下标错位
- 删除死代码 useScoring.js
- 架构重构为 systems/ 模块化（card/scoring/boss/level/joker/shop/consumable/save/achievement）
- EventBus 事件总线解耦各系统

### 界面

- 计分动画爆燃特效：震屏、冲击波、火花粒子、金光闪
- Boss 图鉴左侧 tab 分组切换，每组 4 个 Boss
- 游戏结束弹窗新增累计成就进度显示

### 技术

- 新增 ScoreAnimation.vue 组件与 scoreAnim.js 时序工具
- 新增 .trae.md 项目规则文件与 release-deploy Skill
- Vitest 测试框架，组件与系统单测

## [1.0.0] - 2026-08-27

### 新增

- 完整的扑克肉鸽游戏核心玩法
- 11 种牌型（高牌 → 五条）
- 48 张小丑牌，4 种稀有度（普通 / 稀有 / 史诗 / 传说）
- 8 张塔罗牌 + 9 张星球牌
- 3 个可解锁角色（普通人 / 顺子牌手 / 同花牌手）
- 3 种游戏模式（简单 / 困难 / 无尽）
- 9 个 Boss 减益效果（弱/中/强三档）
- 10 个成就系统
- 商店系统（购买、卖出、刷新）
- 本地存档自动保存
- 上一手积分明细展示
- 卡牌图鉴（分页浏览所有卡牌）
- 牌型速查表（示例牌展示）
- 牌堆查看
- 本局统计
- 退出回主菜单功能

### 界面

- 三栏布局：左侧状态栏 + 中间卡牌区 + 右侧牌堆
- 响应式设计，适配桌面和移动端
- 暗色系主题，金色点缀
- 扑克牌精美设计（渐变、高光、选中光晕）
- 牌堆封面设计（斜纹纹理 + 发光效果）
- 空卡框占位（虚线边框 + "+"号）
- 所有模态框统一风格

### 技术

- 从单 HTML 文件迁移到 Vite + Vue 3 工程化项目
- Composition API 组合式函数架构（useGameState / useScoring / useAudio）
- 组件化拆分（11 个 Vue 组件）
- CSS 变量主题系统
- Web Audio API 合成音效
- localStorage 本地存档
- GitHub Pages 自动部署
