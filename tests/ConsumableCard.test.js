import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConsumableCard from '../src/components/game/ConsumableCard.vue'

const mockDef = {
  id: 'the_fool',
  name: '愚者',
  icon: '🃏',
  cost: 3,
  desc: '测试塔罗牌',
}

describe('ConsumableCard', () => {
  it('渲染基本内容', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot' },
    })
    expect(wrapper.text()).toContain('愚者')
    expect(wrapper.text()).toContain('🃏')
    expect(wrapper.classes()).toContain('tarot')
  })

  it('planet 类型样式', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'planet' },
    })
    expect(wrapper.classes()).toContain('planet')
  })

  it('tarot 类型样式', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot' },
    })
    expect(wrapper.classes()).toContain('tarot')
  })

  it('size prop 生效', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot', size: 'sm' },
    })
    expect(wrapper.classes()).toContain('size-sm')
  })

  it('sold 状态样式', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot', sold: true },
    })
    expect(wrapper.classes()).toContain('is-sold')
  })

  it('confirmMode 显示确认遮罩', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot', confirmMode: true },
    })
    expect(wrapper.classes()).toContain('is-confirm')
    expect(wrapper.text()).toContain('确认卖出?')
  })

  it('点击触发 click 事件', async () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('sold 状态点击不触发 click', async () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot', sold: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('hover 触发 hover 事件并传入 def', async () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot' },
    })
    await wrapper.trigger('mouseenter')
    expect(wrapper.emitted('hover')).toBeTruthy()
    expect(wrapper.emitted('hover')[0][1]).toEqual(mockDef)
  })

  it('mouseleave 触发 leave 事件', async () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot' },
    })
    await wrapper.trigger('mouseleave')
    expect(wrapper.emitted('leave')).toBeTruthy()
  })

  it('右键触发 contextmenu 事件', async () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot' },
    })
    await wrapper.trigger('contextmenu')
    expect(wrapper.emitted('contextmenu')).toBeTruthy()
  })

  it('showType 显示类型标签', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot', showType: true },
    })
    expect(wrapper.find('.c-type').exists()).toBe(true)
    expect(wrapper.find('.c-type').text()).toContain('塔罗')
  })

  it('interactive=false 没有 hover 效果', () => {
    const wrapper = mount(ConsumableCard, {
      props: { def: mockDef, type: 'tarot', interactive: false },
    })
    expect(wrapper.classes()).toContain('no-hover')
  })
})
