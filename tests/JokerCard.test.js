import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import JokerCard from '../src/components/game/JokerCard.vue'

const mockDef = {
  id: 'joker',
  name: '小丑',
  icon: '🃏',
  rarity: 'common',
  cost: 3,
  desc: '测试小丑',
}

describe('JokerCard', () => {
  it('渲染基本内容', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef },
    })
    expect(wrapper.text()).toContain('小丑')
    expect(wrapper.text()).toContain('🃏')
    expect(wrapper.classes()).toContain('rarity-common')
  })

  it('稀有度样式正确', () => {
    const wrapper = mount(JokerCard, {
      props: { def: { ...mockDef, rarity: 'legend' } },
    })
    expect(wrapper.classes()).toContain('rarity-legend')
  })

  it('size prop 生效', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, size: 'sm' },
    })
    expect(wrapper.classes()).toContain('size-sm')
  })

  it('sold 状态样式', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, sold: true },
    })
    expect(wrapper.classes()).toContain('is-sold')
  })

  it('locked 状态样式', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, locked: true },
    })
    expect(wrapper.classes()).toContain('is-locked')
  })

  it('temporary 临时样式', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, temporary: true },
    })
    expect(wrapper.classes()).toContain('is-temporary')
  })

  it('confirmMode 显示确认遮罩', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, confirmMode: true },
    })
    expect(wrapper.classes()).toContain('is-confirm')
    expect(wrapper.text()).toContain('确认卖出?')
  })

  it('点击触发 click 事件', async () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click').length).toBe(1)
  })

  it('sold 状态下点击不触发 click', async () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, sold: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('hover 触发 hover 事件', async () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef },
    })
    await wrapper.trigger('mouseenter')
    expect(wrapper.emitted('hover')).toBeTruthy()
    expect(wrapper.emitted('hover')[0][1]).toEqual(mockDef)
  })

  it('mouseleave 触发 leave 事件', async () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef },
    })
    await wrapper.trigger('mouseleave')
    expect(wrapper.emitted('leave')).toBeTruthy()
  })

  it('右键触发 contextmenu 事件', async () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef },
    })
    await wrapper.trigger('contextmenu')
    expect(wrapper.emitted('contextmenu')).toBeTruthy()
  })

  it('stacks > 0 显示层数', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, stacks: 5 },
    })
    expect(wrapper.find('.j-stacks').exists()).toBe(true)
    expect(wrapper.find('.j-stacks').text()).toBe('5')
  })

  it('stacks = 0 不显示层数', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, stacks: 0 },
    })
    expect(wrapper.find('.j-stacks').exists()).toBe(false)
  })

  it('showDelete 显示删除按钮', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, showDelete: true },
    })
    expect(wrapper.find('.j-delete').exists()).toBe(true)
  })

  it('locked 时 showDelete 不显示删除按钮', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, showDelete: true, locked: true },
    })
    expect(wrapper.find('.j-delete').exists()).toBe(false)
  })

  it('点击删除按钮触发 delete 事件', async () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, showDelete: true },
    })
    await wrapper.find('.j-delete').trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('删除按钮 click 不冒泡到卡片 click', async () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, showDelete: true },
    })
    await wrapper.find('.j-delete').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('bonusPopups 渲染飘字', () => {
    const wrapper = mount(JokerCard, {
      props: {
        def: mockDef,
        bonusPopups: [{ id: 1, text: '+10', color: '#ff0' }],
      },
    })
    expect(wrapper.findAll('.joker-bonus-popup').length).toBe(1)
    expect(wrapper.find('.joker-bonus-popup').text()).toBe('+10')
  })

  it('interactive=false 没有 hover 效果', () => {
    const wrapper = mount(JokerCard, {
      props: { def: mockDef, interactive: false },
    })
    expect(wrapper.classes()).toContain('no-hover')
  })
})
