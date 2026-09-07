import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayingCard from '../src/components/game/PlayingCard.vue'

const mockCard = {
  id: 1,
  rank: 'A',
  suit: '♠',
}

describe('PlayingCard', () => {
  it('渲染点数和花色', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard },
    })
    expect(wrapper.findAll('.pc-rank').length).toBe(2) // 上下两个
    expect(wrapper.findAll('.pc-suit').length).toBe(2)
    expect(wrapper.find('.pc-center').text()).toBe('♠')
  })

  it('红色花色样式', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: { id: 2, rank: 'K', suit: '♥' } },
    })
    expect(wrapper.classes()).toContain('red')
  })

  it('黑色花色样式', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: { id: 3, rank: 'Q', suit: '♣' } },
    })
    expect(wrapper.classes()).toContain('black')
  })

  it('selected 选中样式', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard, selected: true },
    })
    expect(wrapper.classes()).toContain('selected')
  })

  it('calledOut 点名样式', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard, calledOut: true },
    })
    expect(wrapper.classes()).toContain('called-out')
  })

  it('disabled 禁用样式', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard, disabled: true },
    })
    expect(wrapper.classes()).toContain('disabled')
  })

  it('点击触发 click 事件并传入 card', async () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0][0]).toEqual(mockCard)
  })

  it('disabled 点击不触发 click', async () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard, disabled: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('enhancement 显示增强标记', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard, enhancement: '+' },
    })
    expect(wrapper.find('.pc-enhancement').exists()).toBe(true)
    expect(wrapper.find('.pc-enhancement').text()).toBe('+')
  })

  it('没有 enhancement 不显示标记', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard },
    })
    expect(wrapper.find('.pc-enhancement').exists()).toBe(false)
  })

  it('底部花色是倒过来的', () => {
    const wrapper = mount(PlayingCard, {
      props: { card: mockCard },
    })
    const botCorner = wrapper.find('.pc-corner.bot')
    expect(botCorner.exists()).toBe(true)
  })
})
