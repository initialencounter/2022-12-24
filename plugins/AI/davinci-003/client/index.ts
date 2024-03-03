import { defineExtension } from '@koishijs/client'
import Page from './page.vue'
import 'uno.css'

// 将 koishi-plugin-client 改为你的插件全称
import { } from '../lib/index'

declare module '@koishijs/plugin-console' {
  interface Events {
    'davinci-003/getproxy'(): string
  }
}

export default defineExtension((ctx) => {
  // 注入组件的方法
  ctx.slot({
    type: 'plugin-details',
    component: Page,
    order: -200,
  })
})