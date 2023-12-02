import Settings from './settings.vue'
import Usage from './usage.vue'
import {} from '@koishijs/plugin-market'
import {} from 'koishi-plugin-gocqhttp-dev'
import { Card, defineExtension } from '@koishijs/client'

declare module '@koishijs/plugin-console' {
  interface Events {
    'gocqhttp-dev/usage'(): Promise<string>
  }
}

export default defineExtension((ctx) => {
  ctx.slot({
    type: 'plugin-details',
    component: Settings,
    order: -800,
  })

  // for backward compatibility
  ctx.slot({
    type: 'market-settings',
    component: Settings,
    order: -2000,
  })

  ctx.slot({
    type: 'plugin-details',
    component: Usage,
    order: -900,
  })
})
