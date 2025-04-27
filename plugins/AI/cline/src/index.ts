import { Context, Schema, Session } from 'koishi'
import { resolve } from 'path'
import { } from '@koishijs/plugin-console'
import { McpHub } from './services/mcp/McpHub'
import { Cline } from './core/Cline'
import { OpenAiCaller } from './api/providers/openai'
import { ApiHandlerOptions } from "./shared/api"
import { McpServer } from './shared/mcp'
import path from 'path'
import { getAppDataPath } from './utils/path'
declare module "koishi" {
  interface Events {
    'mcp-ready': () => void
  }
}

export const name = 'cline'

declare module '@koishijs/plugin-console' {
  interface Events {
    'get-mcp-servers'(): McpServer[]
  }
}

class ClineBot {
  mcpHub: McpHub
  api: OpenAiCaller
  constructor(ctx: Context, private config: ClineBot.Config) {

    ctx.inject(['console'], (ctx) => {
      ctx.console.addListener('get-mcp-servers', () => {
        const servers = this.mcpHub.getServers()
        return servers
      })
      ctx.console.addEntry({
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      })
    })

    this.mcpHub = new McpHub(ctx, config.mcpSettingsFilePath)
    this.api = new OpenAiCaller(ctx, config.apiHandlerOptions)

    ctx.on('mcp-ready', () => {
      const servers = this.mcpHub.getServers()
      for (const server of servers) {
        ctx.logger('cline').info(`MCP server ${server.name} is ready`)
      }
    })

    ctx.command('cline').action(async ({ session }) => {
      await ClineBot.withCline(this.mcpHub, this.api, this.config.sendThinking, async (cline) => {
        await cline.startTask(session.content.replace("cline ", ""), session)
      })
    })

    //at和私信触发对话的实现方法
    ctx.middleware(async (session, next) => {
      return this.middleware(session, next);
    });
  }

  async middleware(session: Session, next: () => void) {
    // 私信触发
    if (session.subtype === "private") {
      await ClineBot.withCline(this.mcpHub, this.api, this.config.sendThinking, async (cline) => {
        await cline.startTask(session.content, session)
      })
      return
    }
    // 艾特触发
    if (session.stripped.appel) {
      let msg: string = "";
      for (let i of session.elements.slice(1)) {
        if (i.type === "text") msg += i?.attrs?.content;
      }
      await ClineBot.withCline(this.mcpHub, this.api, this.config.sendThinking, async (cline) => {
        await cline.startTask(msg, session)
      })
      return;
    }
    return next()
  }
}

namespace ClineBot {
  export interface Config {
    apiHandlerOptions: ApiHandlerOptions
    mcpSettingsFilePath: string
    sendThinking: boolean
  }

  const appDataPath = getAppDataPath()
  const mcpSettingsFilePath = path.join(appDataPath, "Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json")


  export const apiHandlerOptions: Schema<ApiHandlerOptions> = Schema.object({
    openAiApiKey: Schema.string().default('sk-').description("API key"),
    openAiBaseUrl: Schema.string().default("https://api.deepseek.com").description("base URL"),
    apiModelId: Schema.string().default("deepseek-chat").description("模型名称"),
  }).description("Options for the API handler")

  export const Config: Schema<Config> = Schema.object({
    apiHandlerOptions: apiHandlerOptions,
    mcpSettingsFilePath: Schema.string().default(mcpSettingsFilePath).description("Mcp settings file path"),
    // 发送思考过程内容
    sendThinking: Schema.boolean().default(false).description("是否发送思考过程内容"),
  })

  export async function withCline<T>(mcpHub: McpHub, api: OpenAiCaller, sendThinking: boolean,
    fn: (cline: Cline) => Promise<T>): Promise<T> {
    const cline = new Cline(mcpHub, api, sendThinking)
    try {
      return await fn(cline)
    } finally {
      cline.dispose()
    }
  }
}

export default ClineBot
