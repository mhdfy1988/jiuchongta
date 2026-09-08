import { reactive } from 'vue'

/**
 * 公共 Tooltip composable，GameScreen 和 ShopModal 共用
 */
export function useTooltip() {
  const tip = reactive({
    visible: false, x: 0, y: 0,
    icon: '', name: '', subtitle: '', desc: '', extra: '',
  })

  function show(e, { icon, name, subtitle, desc, extra = '' }) {
    Object.assign(tip, {
      visible: true,
      x: e.clientX + 12, y: e.clientY,
      icon, name, subtitle, desc, extra,
    })
  }

  function hide() { tip.visible = false }

  return { tip, show, hide }
}
