import { Context, h } from "koishi"
import McpBot from "./mcpBot"
import { v4 as uuidv4 } from 'uuid';

export interface WebHookResponse {
  command: string
  args: string[]
  options: Record<string, any>
  taskId?: string
}

export interface TaskResult {
  channelId: string
  content: string
}

const CHANNEL_ID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
const yellow = "\x1b[33m";
const reset = "\x1b[0m";
const green = "\x1b[32m"

export async function createSession(bot: McpBot<Context>, data: WebHookResponse) {
  const { command, args, taskId, options } = data
  const session = bot.session()
  session.type = 'message'
  const optionsQuery = new URLSearchParams(options).toString()
  const content = `EhSH6624QAubdPQvZvPCW -t ${taskId} -m ${command} -o ${optionsQuery} ${args.join(' ')}`
  const name = 'mcp'
  bot.logger.info(`MCP适配器:${yellow}${bot.config.selfId}${reset} 收到消息: 发送者: ${green}${name}${reset} 内容: ${content}`)

  session.userId = 'mcp1111'
  session.channelId = CHANNEL_ID
  session.content = content
  session.elements = [h.text(content)]

  return session
}

export function generateTaskId() {
  return uuidv4(); // 输出类似：'9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
}


export function elementToText(element: any) {
  if (element.type === "text") {
    return element.attrs.content;
  } else {
    return element.type;
  }
}
