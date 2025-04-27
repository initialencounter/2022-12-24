import { Context, Bot, Logger, Schema } from "koishi";
import McpAdapter from "./adapter";
import * as excutor from "./excutor";
import { McpMessenger } from "./message";
import MCPRouter from "./MCPRouter";

export const name = "mcp-bot";
class McpBot<C extends Context> extends Bot<C> {
  static MessageEncoder = McpMessenger
  constructor(ctx: C, config: McpBot.Config) {
    super(ctx, config);
    this.logger = new Logger(name)
    this.platform = 'mcp-server'
    this.selfId = config.selfId
    ctx.plugin(McpAdapter, this)
    ctx.plugin(MCPRouter, config)
    ctx.plugin(excutor)
  }
}

namespace McpBot {
  export interface CommandAdditionDescription {
    name: string
    description: string
  }
  export const CommandAdditionDescription: Schema<CommandAdditionDescription> = Schema.object({
    name: Schema.string().description('命令名称').required(),
    description: Schema.string().description('命令的描述').required(),
  }).description('命令的覆盖描述')
  export interface Config {
    selfId: string
    commandAdditionDescription: CommandAdditionDescription[]
  }
  export const Config: Schema<Config> = Schema.object({
    selfId: Schema.string().default('0').description('机器人的唯一标识'),
    commandAdditionDescription: Schema.array(CommandAdditionDescription).default(
      [
        {
          name: 'status',
          description: '查看 Koishi 当前的运行状态，可以查看CPU和内存使用情况'
        },
        {
          name: 'help',
          description: '查看 Koishi 的帮助信息, 可以查看所有的命令和命令的描述'
        },
      ]
    ).description('命令的覆盖描述会覆盖掉默认的描述'),
  });
}

export default McpBot;
