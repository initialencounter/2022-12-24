import { Bot, Context, Logger, Quester, Schema } from 'koishi'
import VoceAdapter, { AdminInternal, Internal } from './adapter'
import { VoceMessenger } from './message'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { TokenRefeshConfig } from './type'

export const name = 'Voce'


class VoceBot<C extends Context> extends Bot<C> {
  static MessageEncoder = VoceMessenger
  declare logger: Logger
  http: Quester
  tokenRefeshConfig: TokenRefeshConfig
  internal: Internal
  adminInternal: AdminInternal
  constructor(ctx: C, config: VoceBot.Config) {
    super(ctx, config)
    this.logger = new Logger(name)
    this.platform = 'voce'
    this.selfId = config.selfId

    /**
     * 拓展 ctx.http
     */
    this.http = this.ctx.http.extend({
      baseURL: this.ctx.config.endpoint,
      endpoint: this.ctx.config.endpoint,
      headers: {
        'x-api-key': null,
        'accept': 'application/json; charset=utf-8',
      },
    })
    this.internal = new Internal(this.http)

    this.adminInternal = new AdminInternal(this.ctx.http.extend({
      baseURL: this.ctx.config.endpoint,
      endpoint: this.ctx.config.endpoint,
      headers: {
        'accept': 'application/json; charset=utf-8',
        'X-API-Key': null
      },
    }))
    ctx.plugin(VoceAdapter, this)

    /**
     * debug
     */

    // ctx.middleware((session,next)=>{
    //   console.log(session.content)
    //   console.log(session.event.message.elements)
    //   return next()
    // })

    // ctx.command('test').action(async ({ session }) => {
    //   const res = await session.send('撤回消息')
    //   await ctx.sleep(500)
    //   session.bot.deleteMessage(session.channelId, res[0])
    // })
  }
  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    this.adminInternal.deleteMessage(messageId, this.tokenRefeshConfig)
  }
}
namespace VoceBot {
  export const usage = `${(readFileSync(resolve(__dirname, '../readme.md'))).toString("utf-8").split("# 更新日志")[0]}`
  export interface Config {
    endpoint: string
    path: string
    botUid: number
    selfId: string
    loginMethod: 'account' | 'token'
    admin_passwd?: string
    admin_email?: string
    admin_token?: string
    admin_refresh_token?: string
  }

  export const Config: Schema<Config> = Schema.intersect([Schema.object({
    endpoint: Schema.string().default('http://localhost:3000').description("Voce 服务器地址"),
    path: Schema.string().default('/vocechat/webhook').description("webhook 路径, 请填写正确，否则无法接收消息"),
    selfId: Schema.string().description(`随便填🤗🤗`).required(),
    botUid: Schema.number().default(2).description("机器人的 UID"),
    loginMethod: Schema.union([
      Schema.const('account').description('账号登录'),
      Schema.const('token').description('令牌登录'),
    ]).default('account'),
  }),
  Schema.union([
    Schema.object({
      loginMethod: Schema.const('account'),
      admin_email: Schema.string().description("管理员的邮箱").required(true),
      admin_passwd: Schema.string().role('secret').description("管理员的密码").required(true),
    }),
    Schema.object({
      loginMethod: Schema.const('token'),
      admin_token: Schema.string().role('secret').description("管理员的 token，可以通过 F12 抓取").required(true),
      admin_refresh_token: Schema.string().role('secret').description("服务器管理员的 refresh_token").required(true),
    })
  ])

  ])

}

export default VoceBot