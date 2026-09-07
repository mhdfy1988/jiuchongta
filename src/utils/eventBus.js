// 简易事件总线：系统之间解耦，不靠直接函数调用
// 用法：
//   bus.on('hand:played', (data) => { ... })
//   bus.emit('hand:played', { score: 100 })
//   bus.off('hand:played', handler)

class EventBus {
  constructor() {
    this._listeners = new Map() // eventName -> Set<handler>
  }

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event).add(handler)
    // 返回取消订阅函数，方便 cleanup
    return () => this.off(event, handler)
  }

  off(event, handler) {
    const set = this._listeners.get(event)
    if (set) set.delete(handler)
  }

  emit(event, payload) {
    const set = this._listeners.get(event)
    if (!set) return
    // 拷贝一份，避免 handler 里 on/off 导致遍历出错
    for (const handler of [...set]) {
      try {
        handler(payload)
      } catch (e) {
        console.error(`[EventBus] handler for "${event}" threw:`, e)
      }
    }
  }

  clear() {
    this._listeners.clear()
  }
}

// 全局单例
export const bus = new EventBus()

// 事件名常量，避免魔法字符串
export const EVENTS = {
  // 卡牌系统
  CARD_SELECTED: 'card:selected',
  CARD_DESELECTED: 'card:deselected',
  HAND_DRAWN: 'hand:drawn',

  // 出牌/弃牌
  HAND_PLAYED: 'hand:played',
  HAND_DISCARDED: 'hand:discarded',

  // 计分
  SCORE_CALCULATED: 'score:calculated',

  // 关卡
  LEVEL_WON: 'level:won',
  LEVEL_LOST: 'level:lost',
  LEVEL_START: 'level:start',
  GAME_OVER: 'game:over',
  GAME_CLEAR: 'game:clear',
  REVIVED: 'game:revived',

  // 商店
  SHOP_OPENED: 'shop:opened',
  ITEM_BOUGHT: 'shop:itemBought',
  ITEM_SOLD: 'shop:itemSold',

  // 小丑
  JOKER_ADDED: 'joker:added',
  JOKER_REMOVED: 'joker:removed',

  // 消耗品
  CONSUMABLE_USED: 'consumable:used',

  // Boss
  BOSS_APPLIED: 'boss:applied',

  // 存档
  SAVE_UPDATED: 'save:updated',

  // 成就
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
}
