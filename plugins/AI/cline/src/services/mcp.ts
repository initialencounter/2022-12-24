import { Context, Service } from 'koishi'
import type { InMemoryMcpManager, McpServerSnapshot } from '@cline/core'
import type { AgentTool } from '@cline/shared'
import { resolve } from 'path'
import type { Config } from '../config'
import { loadCore } from '../sdk'

declare module 'koishi' {
  interface Context {
    clineMcp: McpService
  }
}

export class McpService extends Service {
  static inject = []

  private manager?: InMemoryMcpManager
  readonly settingsPath: string
  private options: Config

  constructor(ctx: Context, config: Config) {
    super(ctx, 'clineMcp', true)
    this.options = config
    const cwd = config.cwd || process.cwd()
    this.settingsPath = config.mcp.settingsPath
      ? resolve(cwd, config.mcp.settingsPath)
      : resolve(cwd, '.mcp.json')

    ctx.on('ready', () => this.initialize())
    ctx.on('dispose', async () => {
      await this.manager?.dispose()
      this.manager = undefined
    })
  }

  private async createManager(): Promise<InMemoryMcpManager> {
    const { InMemoryMcpManager, createDefaultMcpServerClientFactory } = await loadCore()
    return new InMemoryMcpManager({
      clientFactory: createDefaultMcpServerClientFactory(),
    })
  }

  async initialize() {
    if (!this.options.mcp.enabled) return
    const core = await loadCore()
    if (!core.hasMcpSettingsFile({ filePath: this.settingsPath })) {
      this.ctx.logger('cline/mcp').debug(`未找到 MCP 配置文件 ${this.settingsPath},跳过`)
      return
    }
    try {
      this.manager ??= await this.createManager()
      const registrations = await core.registerMcpServersFromSettingsFile(this.manager, {
        filePath: this.settingsPath,
      })
      for (const server of this.manager.listServers()) {
        if (server.status === 'connected') {
          this.ctx.logger('cline/mcp').info(`MCP 服务器 ${server.name} 已连接(${server.toolCount} 个工具)`)
        } else if (server.lastError) {
          this.ctx.logger('cline/mcp').warn(`MCP 服务器 ${server.name} 连接失败:${server.lastError}`)
        }
      }
      if (registrations.length === 0) {
        this.ctx.logger('cline/mcp').debug('MCP 配置文件中没有服务器')
      }
    } catch (error) {
      this.ctx.logger('cline/mcp').warn(`加载 MCP 配置失败:${error}`)
    }
  }

  /** 重新连接所有 MCP 服务器(配置文件变更后调用) */
  async reload() {
    await this.manager?.dispose()
    this.manager = await this.createManager()
    await this.initialize()
  }

  async listServers(): Promise<readonly McpServerSnapshot[]> {
    return this.manager?.listServers() ?? []
  }

  /** 将所有已连接的 MCP 服务器工具展开为 AgentTool */
  async getTools(): Promise<AgentTool[]> {
    if (!this.options.mcp.enabled || !this.manager) return []
    const { createMcpTools } = await loadCore()
    const servers = this.manager
      .listServers()
      .filter((server) => server.status === 'connected' && !server.disabled)
    const tools = await Promise.all(
      servers.map((server) =>
        createMcpTools({ serverName: server.name, provider: this.manager! }).catch((error) => {
          this.ctx.logger('cline/mcp').warn(`获取 MCP 服务器 ${server.name} 的工具失败:${error}`)
          return [] as AgentTool[]
        }),
      ),
    )
    return tools.flat()
  }
}

export default McpService
