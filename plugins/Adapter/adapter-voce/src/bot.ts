import { Bot, Context, Logger, Quester, Schema } from 'koishi'
import VoceAdapter, { Internal } from './adapter'
import { VoceMessenger } from './message'
import { resolve } from 'path'
import { readFileSync } from 'fs'

export const name = 'Voce'



class VoceBot<C extends Context> extends Bot<C> {
  static MessageEncoder = VoceMessenger
  declare logger: Logger
  declare http: Quester
  internal: Internal
  constructor(ctx: C, config: VoceBot.Config) {
    super(ctx, config)
    this.logger = new Logger(name)
    this.platform = 'voce'
    this.selfId = config.selfId
    this.http = this.ctx.http.extend({
      endpoint: this.ctx.config.endpoint,
      headers: { 'x-api-key': this.ctx.config.apikey },
    })
    this.internal = new Internal(this.http)
    ctx.plugin(VoceAdapter, this)
  }
}
namespace VoceBot {
  export const usage = `${(readFileSync(resolve(__dirname, '../readme.md'))).toString("utf-8").split("# 更新日志")[0]}`
  export interface Config {
    endpoint: string
    path: string
    apikey: string
    selfId: string
  }

  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().default('http://localhost:3000').description("Voce 服务器地址"),
    path: Schema.string().default('/vocechat/webhook').description("webhook 路径"),
    apikey: Schema.string().role('secret👀👀').required().description("机器人的 apikey"),
    selfId: Schema.string().description(`随便填🤗🤗`).required(),
  })
}

export default VoceBot