import { Adapter, Context } from "koishi";
import McpBot from "./mcpBot";
import { } from '@koishijs/plugin-server'
import { createSession, generateTaskId, WebHookResponse } from "./utils";


class McpAdapter<C extends Context> extends Adapter<C, McpBot<C>> {
  static inject = ['server']

  bot: McpBot<C>;
  constructor(ctx: C) {
    super(ctx);
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
    this.ctx.server.post(this.bot.config.path, async (ctx) => {
      const taskId = generateTaskId()
      const data = ctx.request.body as WebHookResponse
      data['taskId'] = taskId
      const session = await createSession(this.bot, data)
      this.bot.dispatch(session)
      ctx.body = taskId
      ctx.status = 200
    })
    this.bot.online()
  }
}

export default McpAdapter;
