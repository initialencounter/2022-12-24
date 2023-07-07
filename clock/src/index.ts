import { Context, Schema, Session } from 'koishi'
import { schedule } from 'node-cron'

export const using = ['database']
export const name = 'clock'
export const usage = `
### [Allowed fields](https://github.com/node-cron/node-cron)

\`\`\`
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
\`\`\`

### Allowed values

|     field    |        value        |
|--------------|---------------------|
|    second    |         0-59        |
|    minute    |         0-59        |
|     hour     |         0-23        |
| day of month |         1-31        |
|     month    |     1-12 (or names) |
|  day of week |     0-7 (or names, 0 or 7 are sunday)  |


`
export interface Time {
  hours: number
  mins: number
  secs: number
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
}
declare module 'koishi' {
  interface Tables {
    clock: Clock
  }
}
export function apply(ctx: Context, config: Config) {
  ctx.model.extend('clock', {
    // 各字段类型
    id: 'unsigned',
    time: "text",
    msg: "text",
    enable: "boolean"
  }, {
    primary: 'id', //设置 uid 为主键
    autoInc: true
  })
  ctx.on('ready', async () => {
    const clocks = await ctx.database.get('clock', {})
    for (var i of clocks) {
      if (i.enable) {
        schedule_cron(ctx,config,i)
      }
    }
  })
  ctx.command('clock [time:text]', "添加闹钟")
    .option('once', '-o')
    .option('msg', '-m [msg:string]').action(({ session, options }, time) => {
      return add_clock(ctx, session, time, options.msg, options.once ? false : true, config)
    })
  ctx.command('clock.r [id:number]', "删除闹钟", { checkArgCount: true })
    .action(async ({ session }, id) => {
      await ctx.database.remove('clock', [id])
      return `闹钟 ${id} 删除成功`
    })
  ctx.command('clock.l', "列出所有闹钟").action(async ({ session }) => {
    return list_clock(ctx, session)
  })
  ctx.command('clock.s [id:number]', "列出所有闹钟", { checkArgCount: true }).action(async ({ session }, id) => {
    return clock_switch(ctx, session, id)
  })
}

async function clock_switch(ctx: Context, session: Session, id: number) {
  const target = await ctx.database.get('clock', [id])
  if (target.length < 1) {
    return '闹钟id 错误'
  }
  await ctx.database.set('clock', [id], { enable: target[0].enable ? false : true })
  const msg = `闹钟 ${id}，已${target[0].enable ? "关闭" : "开启"},重启后生效`
  return msg

}
async function list_clock(ctx: Context, session: Session) {
  const list = await ctx.database.get('clock', {})
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
async function add_clock(ctx: Context, session: Session, time: string, msg: string, once: boolean = true, config: Config) {
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
  if (once) {
    ctx.database.create('clock', { time: time, msg: msg, enable: true })
  }

  schedule_cron(ctx, config, { msg: msg, time: time, enable: true })
  return '闹钟添加成功'

}

function schedule_cron(ctx: Context, config: Config, clock: Clock) {
  schedule(clock.time, async () => {
    for (let { channelId, platform, selfId, guildId } of config.rules) {
      if (!selfId) {
        const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
        if (!channel || !channel.assignee) return
        selfId = channel.assignee
        guildId = channel.guildId
      }
      const bot = ctx.bots[`${platform}:${selfId}`]
      bot?.sendMessage(channelId, clock.msg, guildId)
    }
  })
}