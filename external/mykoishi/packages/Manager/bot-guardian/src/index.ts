import { readFileSync } from 'fs';
import { Context, Dict, Logger, Schema, Universal } from 'koishi'
import { resolve } from 'path';
import { } from '@koishijs/plugin-console'

export const name = 'bot-guardian'
const logger = new Logger(name);
export const usage = `${readFileSync(resolve(__dirname, '../readme.md')).toString('utf-8')}`
declare module '@koishijs/plugin-console' {
  interface Events {
    'wechat4u/qrcode'(): Data
  }
}

export interface Config {
  rules: Rule[]
  interval: number
  webhooks: Webhook[]
  selfId: string
}
export interface Rule {
  platform: string
  channelId: string
  selfId?: string
  guildId?: string
}
export interface Webhook {
  enabled?: boolean
  endpoint: string
  token?: string
}
export const Webhook: Schema<Webhook> = Schema.object({
  enabled: Schema.boolean().default(true),
  endpoint: Schema.string(),
  token: Schema.string(),
})
export const Rule: Schema<Rule> = Schema.object({
  platform: Schema.string().description('平台名称。').required(),
  channelId: Schema.string().description('频道 ID。').required(),
  guildId: Schema.string().description('群组 ID。'),
  selfId: Schema.string().description('机器人 ID。'),
})
export const Config: Schema<Config> = Schema.object({
  selfId: Schema.string().required(true).description("随便填"),
  rules: Schema.array(Rule).description('推送规则。'),
  interval: Schema.number().default(60000).description('监听时间间隔'),
  webhooks: Schema.array(Webhook),
})

export interface Bot {
  name: string
  status: number
  avatar?: string
}

export interface Data {
  selfId: string
  bots: Bot[]
}

export const inject = { required:["console"]}
export function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh'))
  let lastBotStat: BotData = {}
  for (const bot of ctx.bots) {
    lastBotStat[bot.sid] = {
      platform: bot.platform,
      selfId: bot.selfId,
      status: bot?.status,
      user: bot?.user,
      error: bot?.error
    }
  }
  ctx.inject(['console'], (ctx) => {
    ctx.console.addEntry({
      dev: resolve(__dirname, '../client/index.ts'),
      prod: resolve(__dirname, '../dist'),
    })
  })
  ctx.console.addListener('wechat4u/qrcode', () => {
    let bots = []
    for (const bot of ctx.bots) {
      bots.push({name: bot?.user?.name??'',avatar:bot?.user?.avatar??'',status: bot.status})
    }

    return { selfId: config.selfId, bots: bots }
  })
  setInterval(async () => {
    const bots: BotData = {}
    let msg = ''
    for (const [key, values] of Object.entries(lastBotStat)) {
      if (!ctx.bots[key]) {
        msg += `\nbot丢失：${values?.user?.name || values.selfId}`
      }
    }
    for (const bot of ctx.bots) {

      const curr = lastBotStat[bot.sid]
      if (!lastBotStat[bot.sid]) {
        msg += `\n新增：${bot?.user?.name || bot.sid}, 状态：<i18n path=${"commands.bot-guardian.messages.status." + bot.status}/>`
      }
      for (var [keys, values] of Object.entries(curr ?? {})) {
        let tmp = ''
        if (bot[keys] !== values) {
          tmp += `\n${keys} ${values}=> ${bot[keys]}`
        }
        if (tmp) {
          msg += `\nbot变动: ${bot?.user?.name || bot.sid}${tmp}`
        }
      }
      bots[bot.sid] = {
        platform: bot.platform,
        selfId: bot.selfId,
        status: bot?.status,
        user: bot?.user,
        error: bot?.error
      }
    }
    lastBotStat = bots
    if (msg) {
      logger.info(msg)
      for (let { channelId, platform, selfId, guildId } of config.rules) {
        if ((!guildId) || (!platform) || (!channelId)) {
          continue
        }
        if (!selfId) {
          const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
          if (!channel || !channel.assignee) return
          selfId = channel.assignee
          guildId = channel.guildId
        }
        const bot = ctx.bots[`${platform}:${selfId}`]
        bot?.sendMessage(channelId, msg, guildId)
      }
      for (const webhook of config.webhooks) {
        if (!webhook.enabled) continue
        ctx.http.post(webhook.endpoint, { msg: msg }, {
          headers: webhook.token ? {
            Authorization: `Bearer ${webhook.token}`,
          } : {},
        }).catch(logger.warn)
      }
    }
  }, config.interval)


}

export interface BotData {
  platform?: string
  selfId?: string
  status?: number
  user?: Dict
  error?: Dict
}