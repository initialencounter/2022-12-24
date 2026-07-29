import { Context } from 'koishi'
import { resolve } from 'path'
import {} from '@koishijs/plugin-console'
import type { McpServerSnapshot } from '@cline/core'
import { Config } from './config'
import McpService from './services/mcp'
import AgentService from './services/agent'
import * as trigger from './trigger'

export const name = 'cline'
export const inject = { optional: ['console', 'markdownToImage'] }

export * from './config'
export * from './services/mcp'
export * from './services/agent'

declare module '@koishijs/plugin-console' {
  interface Events {
    'get-mcp-servers'(): Promise<readonly McpServerSnapshot[]>
  }
}

export function apply(ctx: Context, config: Config) {
  ctx.plugin(McpService, config)
  ctx.plugin(AgentService, config)
  ctx.plugin(trigger, config)

  ctx.inject(['console'], (ctx) => {
    ctx.console.addListener('get-mcp-servers', () => ctx.clineMcp.listServers())
    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  })
}
