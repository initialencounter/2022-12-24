import { Context } from '@koishijs/client'
import Page from './page.vue'
import './icon'

import 'virtual:uno.css'

export default (ctx: Context) => {
  ctx.page({
    name: 'COPY HUB',
    path: '/copyhub',
    component: Page,
    icon: 'CopyHub',
    authority: 4,
  })
}
