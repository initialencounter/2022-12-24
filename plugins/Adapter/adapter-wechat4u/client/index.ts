import { defineExtension } from '@koishijs/client'
import Page from './page.vue'

import { } from '../lib/adapter'

export default defineExtension((ctx) => {

  // 注入组件的方法
  ctx.slot({
    type: 'plugin-details',
    component: Page,
    order: -200,
  })
})