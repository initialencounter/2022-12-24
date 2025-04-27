import { Adapter, Context, Logger } from "koishi";
import McpBot from "./mcpBot";
import { } from '@koishijs/plugin-server'
import { createSession, generateTaskId, WebHookResponse } from "./utils";

declare module 'koishi' {
  interface Events {
    "mcp-result"(taskId: string, result: string): void
    "create-task"(data: WebHookResponse): Promise<string>
  }
}


class McpAdapter<C extends Context> extends Adapter<C, McpBot<C>> {
  static inject = ['server']
  logger: Logger;
  bot: McpBot<C>;
  constructor(ctx: C) {
    super(ctx);
    this.logger = new Logger('mcp-server')
  }
  async connect(bot: McpBot<C>): Promise<void> {
    this.bot = bot;
    this.initialize()
  }

  async disconnect(): Promise<void> {
    this.bot.offline()
  }

  async stop() {
    this.bot.offline()
  }

  async initialize() {
    this.ctx.on('create-task', async (data: WebHookResponse) => {
      return await this.createTask(data)
    })

    this.ctx.server.post('/executor', async (ctx) => {
      const taskId = await this.createTask(ctx.request.body as WebHookResponse)
      ctx.body = taskId
      ctx.status = 200
    })
    this.bot.online()
  }

  async createTask(data: WebHookResponse) {
    if (!data.taskId) {
      data.taskId = generateTaskId()
    }
    const session = await createSession(this.bot, data)
    this.bot.dispatch(session)
    return data.taskId
  }
}

export default McpAdapter;
