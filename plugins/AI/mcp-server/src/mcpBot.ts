import { Context, Bot, Logger, Schema } from "koishi";
import McpAdapter from "./adapter";
import * as excutor from "./excutor";
import { McpMessenger } from "./message";

export const name = "mcp-bot";
class McpBot<C extends Context> extends Bot<C> {
  static MessageEncoder = McpMessenger
  constructor(ctx: C, config: McpBot.Config) {
    super(ctx, config);
    this.logger = new Logger(name)
    this.platform = 'mcp-server'
    this.selfId = config.selfId
    ctx.plugin(McpAdapter, this)
    ctx.plugin(excutor)
  }
}

namespace McpBot {
  export interface Config {
    selfId: string
    path: string
  }
  export const Config: Schema<Config> = Schema.object({
    selfId: Schema.string().default('0').description('机器人的唯一标识'),
    path: Schema.string().default('/mcp').description('mcp 服务器的路径'),
  });
}

export default McpBot;