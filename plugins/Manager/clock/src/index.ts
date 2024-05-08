import { readFileSync } from 'fs';
import { Context, Logger, Schema, Session } from 'koishi'
import * as shutdown from "koishi-plugin-shutdown"
import { resolve } from 'path';
import { } from 'koishi-plugin-cron';
export const inject = {
  required: ['cron', 'database']
}

export const name = 'clock'
const TABLE_NAME = 'clock'
export const logger = new Logger(name)

export const usage = `${readFileSync(resolve(__dirname, '../readme.md')).toString('utf-8')}`
declare module 'koishi' {
  interface Tables {
    clock: Clock
  }
}

export interface Rule {
  platform: string
  channelId: string
  selfId?: string
  guildId?: string
}

export const Rule: Schema<Rule> = Schema.object({
  platform: Schema.string().description('平台名称。').required(),
  channelId: Schema.string().description('频道 ID。').required(),
  guildId: Schema.string().description('群组 ID。'),
  selfId: Schema.string().description('机器人 ID。'),
})
export const Config: Schema<Config> = Schema.object({
  rules: Schema.array(Rule).description('推送规则。')
})
export interface Config {
  rules: Rule[]
}
export interface Clock {
  id?: number
  time: string
  msg: string
  enable: boolean
  rule: Rule
}
export function apply(ctx: Context, config: Config) {
  ctx.model.extend(TABLE_NAME, {
    // 各字段类型
    id: 'unsigned',
    time: "text",
    msg: "text",
    enable: "boolean",
    rule: "json"
  }, {
    primary: 'id', //设置 uid 为主键
    autoInc: true
  })
  // 重新启用 闹钟
  ctx.on('ready', async () => {
    ctx.plugin(shutdown)
    const clocks = await ctx.database.get(TABLE_NAME, {})
    for (var i of clocks) {
      if (i.enable) {
        schedule_cron(ctx, config, i)
      }
    }
  })
  ctx.command('clock [time:text]', "添加闹钟")
    .option('once', '-o')
    .option('msg', '-m [msg:string]').action(({ session, options }, time) => {
      return add_clock(ctx, session as Session, time, options.msg, options.once ? false : true, config)
    })
  ctx.command('clock.r [id:number]', "删除闹钟", { checkArgCount: true, authority: 4 })
    .action(async ({ session }, id) => {
      await ctx.database.remove(TABLE_NAME, [id])
      return `闹钟 ${id} 删除成功`
    })
  ctx.command('clock.l', "列出所有闹钟").action(async ({ session }) => {
    return list_clock(ctx, session as Session)
  })
  ctx.command('clock.s [id:number]', "关闭/启动闹钟", { checkArgCount: true }).action(async ({ session }, id) => {
    return clock_switch(ctx, session as Session, id)
  })
}
/**
 * 根据闹钟id 启用/关闭 闹钟
 * @param ctx 上下文
 * @param session 会话
 * @param id 闹钟的id
 * @returns 
 */
async function clock_switch(ctx: Context, session: Session, id: number) {
  const target = await ctx.database.get(TABLE_NAME, [id])
  if (target.length < 1) {
    return '闹钟id 错误'
  }
  await ctx.database.set(TABLE_NAME, [id], { enable: target[0].enable ? false : true })
  const msg = `闹钟 ${id}，已${target[0].enable ? "关闭" : "开启"},重启后生效`
  // 重启 koishi
  session.execute('shutdown -r now')
  return msg

}
/**
 * 列出数据库所有的闹钟
 * @param ctx 上下文
 * @param session 会话
 * @returns 
 */
async function list_clock(ctx: Context, session: Session) {
  const list = await ctx.database.get(TABLE_NAME, {})
  let msg = '当前存在闹钟'
  let count = 0
  for (var i of list) {
    msg += `\n ${i.id}_${i.time}_${i.msg}_${i.enable ? '已启用' : "未启用"}`
    count++
    if (count > 50) {
      session.send(msg)
      msg = ''
      count = 0
    }
  }
  return msg
}
/**
 * 添加闹钟，根据 once 选项添加临时闹钟或永久闹钟
 * @param ctx 上下文
 * @param session 会话
 * @param time 时间的表达式
 * @param msg 闹钟响铃时提醒消息
 * @param anyway 永久启用 true 或仅此次 false
 * @param config 配置项
 * @returns 
 */
async function add_clock(
  ctx: Context,
  session: Session,
  time: string,
  msg: string,
  anyway: boolean = true,
  config: Config) {
  if (!time) {
    await session.send('请输入闹钟的时间')
    time = await session.prompt()
  }
  if (!time) {
    return '闹钟设置失败，无效的时间'
  }
  if (!msg) {
    await session.send('请输入提醒消息')
    msg = await session.prompt()
  }
  if (!msg) {
    msg = '时间到啦'
  }
  if (anyway) {
    ctx.database.create(TABLE_NAME, {
      time: time,
      msg: msg,
      enable: true,
      rule:
      {
        selfId: session.bot.selfId,
        platform: session.platform,
        guildId: session.guildId,
        channelId: session.channelId
      }
    })
  }

  schedule_cron(
    ctx,
    config,
    {
      msg: msg,
      time: time,
      enable: true,
      rule:
      {
        selfId: session.bot.selfId,
        platform: session.platform,
        guildId: session.guildId,
        channelId: session.channelId
      }
    })
  return '闹钟添加成功'

}
/**
 * 
 * @param ctx 上下文
 * @param config 配置项
 * @param clock 闹钟配置
 * @returns 
 */
function schedule_cron(ctx: Context, config: Config, clock: Clock) {
  const targets = config.rules
  targets.push(clock.rule)
  ctx.cron(clock.time, async () => {
    for (let { channelId, platform, selfId, guildId } of targets) {
      if ((!guildId) || (!platform) || (!channelId)) {
        continue
      }
      if (!selfId) {
        const channel = (await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId']))[0]
        if (!channel) return
        selfId = channel.assignee
        guildId = channel.guildId
      }
      const bot = ctx.bots[`${platform}:${selfId}`]
      bot?.sendMessage(channelId, clock.msg, guildId)
    }
  })
}