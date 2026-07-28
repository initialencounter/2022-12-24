import type { Agent } from '@cline/agents'
import type { ToolApprovalResult } from '@cline/shared'
import { Context, Service, Session } from 'koishi'
import { createEventBridge } from '../bridge'
import type { Config } from '../config'
import { buildSystemPrompt } from '../prompt'
import { loadAgents, loadCore } from '../sdk'
import { createKoishiTools } from '../tools'

declare module 'koishi' {
  interface Context {
    clineAgent: AgentService
  }
}

interface AgentSession {
  agent: Agent
  busy: boolean
  getSubmitSummary: () => string | undefined
  getLastAssistantText: () => string
}

/** 频道会话空闲超时(毫秒),超时后自动销毁以释放上下文 */
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000
/** 非自动批准模式下,等待用户审批的超时(毫秒) */
const APPROVAL_TIMEOUT = 120 * 1000

function summarizeInput(input: unknown, maxLength = 500): string {
  let text: string
  try {
    text = JSON.stringify(input, null, 2)
  } catch {
    text = String(input)
  }
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
}

export class AgentService extends Service {
  static inject = ['clineMcp']

  private sessions = new Map<string, AgentSession>()
  private timers = new Map<string, () => void>()
  private options: Config

  constructor(ctx: Context, config: Config) {
    super(ctx, 'clineAgent', true)
    this.options = config
    ctx.on('dispose', () => {
      for (const key of [...this.sessions.keys()]) this.clear(key)
    })
  }

  private sessionKey(session: Session): string {
    return session.cid
  }

  /** 重置频道会话(cline.clear 指令) */
  clear(key: string) {
    const entry = this.sessions.get(key)
    if (entry) {
      entry.agent.abort()
      this.sessions.delete(key)
    }
    this.timers.get(key)?.()
    this.timers.delete(key)
  }

  hasSession(key: string): boolean {
    return this.sessions.has(key)
  }

  private refreshIdleTimer(key: string) {
    this.timers.get(key)?.()
    this.timers.set(
      key,
      this.ctx.setTimeout(() => this.clear(key), SESSION_IDLE_TIMEOUT),
    )
  }

  private async createAgentSession(session: Session): Promise<AgentSession> {
    const [{ Agent }, { createToolPoliciesWithPreset }, { tools, getSubmitSummary }, mcpTools, systemPrompt] =
      await Promise.all([
        loadAgents(),
        loadCore(),
        createKoishiTools(this.options),
        this.ctx.clineMcp.getTools(),
        buildSystemPrompt(this.options),
      ])

    const agent = new Agent({
      providerId: this.options.providerId,
      modelId: this.options.modelId,
      apiKey: this.options.apiKey,
      baseUrl: this.options.baseUrl,
      systemPrompt,
      maxIterations: this.options.maxIterations,
      tools: [...tools, ...mcpTools],
      toolPolicies: createToolPoliciesWithPreset(this.options.autoApprove ? 'yolo' : 'default'),
      requestToolApproval: this.options.autoApprove
        ? undefined
        : async (request): Promise<ToolApprovalResult> => {
            await session.send(
              `⚠️ Agent 请求执行工具 ${request.toolName}\n${summarizeInput(request.input)}\n` +
              `回复 y 批准,其他回复视为拒绝(${APPROVAL_TIMEOUT / 1000} 秒超时默认拒绝)`,
            )
            const answer = await session.prompt(APPROVAL_TIMEOUT)
            const approved = answer?.trim().toLowerCase() === 'y'
            return { approved, reason: approved ? undefined : '用户拒绝' }
          },
    })

    const bridge = createEventBridge(this.options, session)
    agent.subscribe(bridge.listener)
    return { agent, busy: false, getSubmitSummary, getLastAssistantText: bridge.getLastAssistantText }
  }

  /**
   * 运行一个任务:取当前频道的 Agent 会话(无则创建),内部迭代调用工具直到完成。
   * 工作过程按配置转播,最终结果直接发送给用户。
   */
  async run(session: Session, task: string): Promise<void> {
    const key = this.sessionKey(session)
    let entry = this.sessions.get(key)

    if (entry?.busy) {
      await session.send('⚙️ 当前频道有任务正在进行中,请等待完成,或发送 cline.clear 重置会话')
      return
    }

    if (!entry) {
      entry = await this.createAgentSession(session)
      this.sessions.set(key, entry)
    }
    entry.busy = true
    this.refreshIdleTimer(key)

    try {
      const result = await entry.agent.continue(task)
      const output = (entry.getSubmitSummary() ?? result.outputText)?.trim()
      if (result.error) {
        await session.send(`❌ 任务失败:${result.error.message}`)
        this.clear(key)
      } else if (output && output !== entry.getLastAssistantText()) {
        // 与已转播的最后一条 assistant 文本相同时不重复发送
        await session.send(output)
      } else if (!output) {
        await session.send('✅ 任务已完成')
      }
    } catch (error) {
      this.ctx.logger('cline/agent').warn(error)
      await session.send(`❌ 任务失败:${error instanceof Error ? error.message : error}`)
      this.clear(key)
    } finally {
      entry.busy = false
    }
  }
}

export default AgentService
