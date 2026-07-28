import type { AgentRuntimeEvent, AgentToolCallPart } from '@cline/shared'
import type { Session } from 'koishi'
import type { Config, ProcessLevel } from './config'

const LEVELS: Record<ProcessLevel, number> = {
  none: 0,
  tools: 1,
  verbose: 2,
  debug: 3,
}

function summarizeInput(input: unknown, maxLength = 200): string {
  let text: string
  try {
    text = JSON.stringify(input)
  } catch {
    text = String(input)
  }
  if (!text || text === '{}') return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
}

function summarizeOutput(output: unknown, maxLength = 300): string {
  const text = typeof output === 'string' ? output : JSON.stringify(output)
  if (!text) return ''
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
}

export interface EventBridge {
  listener: (event: AgentRuntimeEvent) => void
  /** 最后一次转播给用户的 assistant 文本(用于避免最终结果重复发送) */
  getLastAssistantText: () => string
}

/**
 * 把 AgentRuntimeEvent 翻译成聊天消息,按配置的过程反馈等级转播 Agent 的工作过程:
 * - none:不转播,仅由宿主发送最终结果
 * - tools:工具调用与工具错误
 * - verbose:思考内容 + 工具调用
 * - debug:全部过程,含工具输出与推理内容
 *
 * 注意:不订阅 assistant-text-delta(逐 token 会刷屏),
 * 改为在 assistant-message(每轮完整消息)时输出文本。
 */
export function createEventBridge(config: Config, session: Session): EventBridge {
  const level = LEVELS[config.processLevel]
  let lastAssistantText = ''

  const listener = (event: AgentRuntimeEvent) => {
    switch (event.type) {
      case 'assistant-message': {
        if (level < LEVELS.verbose) break
        const text = event.message.content
          .filter((part) => part.type === 'text')
          .map((part) => (part as { type: 'text'; text: string }).text)
          .join('\n')
          .trim()
        if (text) {
          lastAssistantText = text
          session.send(`💭 ${text}`).catch(() => {})
        }
        if (level >= LEVELS.debug) {
          const reasoning = event.message.content
            .filter((part) => part.type === 'reasoning')
            .map((part) => (part as { type: 'reasoning'; text: string }).text)
            .join('\n')
            .trim()
          if (reasoning) {
            session.send(`🧠 推理过程\n${summarizeOutput(reasoning, 1000)}`).catch(() => {})
          }
        }
        break
      }
      case 'tool-started': {
        if (level < LEVELS.tools) break
        const toolCall: AgentToolCallPart = event.toolCall
        const input = summarizeInput(toolCall.input)
        session.send(`🔧 调用工具 ${toolCall.toolName}${input ? `\n${input}` : ''}`).catch(() => {})
        break
      }
      case 'tool-finished': {
        if (level < LEVELS.tools) break
        const result = event.message.content.find((part) => part.type === 'tool-result')
        if (!result || result.type !== 'tool-result') break
        if (result.isError) {
          session.send(`❌ 工具 ${result.toolName} 执行失败\n${summarizeOutput(result.output)}`).catch(() => {})
        } else if (level >= LEVELS.debug) {
          const output = summarizeOutput(result.output)
          if (output) {
            session.send(`📄 工具 ${result.toolName} 输出\n${output}`).catch(() => {})
          }
        }
        break
      }
    }
  }

  return { listener, getLastAssistantText: () => lastAssistantText }
}
