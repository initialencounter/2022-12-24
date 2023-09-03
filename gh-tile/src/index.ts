import { Context, Schema, Session, h, Logger } from 'koishi'

import { mainUsage } from './config'
import { pathToFileURL } from 'node:url'
import { resolve } from "path";
import { getTileNums, getContributions, setDailyAlarm } from "./utils"
export const name = 'gh-tile'
export const logger = new Logger(name)

export const usage = `${mainUsage}`
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
  rules: Schema.array(Rule).description('推送规则。'),
  corn: Schema.string().default("15-30").description("默认的提醒时间,UTC时间")
})
export interface Config {
  rules: Rule[]
  corn: string
}
declare module 'koishi' {
  interface Tables {
    gh_tile: Gh_tile
  }
}
export interface Gh_tile {
  id?: number
  time?: string
  enable?: boolean
  rules: Rule[]
  token: string
  username: string
  userId?: string
}

export const using = ['database']
export function apply(ctx: Context, config: Config) {
  ctx.model.extend('gh_tile', {
    // 各字段类型
    id: 'unsigned',
    time: "text",
    enable: "boolean",
    rules: "json",
    token: "text",
    username: "text",
    userId: "string"
  }, {
    primary: 'id', //设置 uid 为主键
    autoInc: true
  })
  ctx.on('ready', async () => {
    const clocks = await ctx.database.get('gh_tile', {})
    for (var i of clocks) {
      if (i.enable) {
        schedule_cron(ctx, i)
      }
    }
  })
  ctx.command('stile', "关闭/启动tile提醒", { checkArgCount: true }).action(async ({ session }, id) => {
    return clock_switch(ctx, session as Session)
  })
  ctx.command('瓷砖', "查看群友今天贴了多少瓷砖")
    .option("username", "-u <username:string>")
    .option("date", "-d <date:string>")
    .action(async ({ session, options }, ...args) => {
      let nums: number | boolean
      let username: string = options?.username
      let date: string = options?.date
      const now = new Date();
      const year = String(now.getFullYear())
      const month = String(now.getMonth() + 1)
      const day = String(now.getDate())
      const nowadate = `${year}-${month.length < 2 ? "0" + month : month}-${day.length < 2 ? "0" + day : day}`
      if (options?.date && date != nowadate) {
        // 获取日期
        date = options.date
      }

      if (!username) {
        const clocks = await ctx.database.get('gh_tile', { userId: session.userId })
        if (clocks?.length > 0) {
          if (clocks?.[0]?.token) {
            nums = await getContributions(ctx, clocks[0]?.token, clocks?.[0]?.username)
          } else {
            nums = await getTileNums(ctx, clocks[0].username, date)
          }
        }
        else {
          return "该用户未绑定 github"
        }
      } else {
        nums = await getTileNums(ctx, username, date)
      }
      if (nums === false) {
        return "获取瓷砖失败"
      }
      if (nums === -1) {
        nums = 0
      }
      return `${username} 在 ${date} 贴了 ${nums} 块瓷砖`
    })
  ctx.middleware(async (session, next) => {
    if (!session.content.startsWith("瓷砖")) {
      return next()
    } else {
      let target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
      if (!target) {
        target = [session.userId]
      }
      const username = (await ctx.database.get("gh_tile", { userId: target[0] }))?.[0].username
      if (!username) {
        return next()
      }
      if (session.content.indexOf("昨天") > -1) {
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let day = now.getDate();
        if (day === 1) {
          if ([1, 2, 4, 6, 8, 9, 11].includes(month)) {
            day = 31;
            if (month === 1) {
              year = now.getFullYear() - 1;
              month = 12;
            } else {
              month = now.getMonth();
            }
          } else if (month === 3) {
            const isLeapYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
            day = isLeapYear ? 29 : 28;
            month = now.getMonth();
          } else {
            day = 30;
            month = now.getMonth();
          }
        } else {
          day = day - 1;
        }
        const date = `${year}-${String(month).length < 2 ? "0" + month : month}-${String(day).length < 2 ? "0" + day : day}`
        return session.execute(`瓷砖 -u ${username} -d ${date}`)
      }
      return session.execute("瓷砖 -u " + username)

    }
  })
  ctx.command('tile', "添加github瓷砖提醒, 绑定github用户名").alias("绑定gh")
    .action(({ session }) => {
      session.bot.sendPrivateMessage
      // 为了保证登录安全，只能私信机器人操作
      if (session?.guildId === session?.channelId) {
        return add_clock(ctx, session as Session, config)
      } else {
        return add_clock(ctx, session as Session, config, false)
      }
    })
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
  config: Config,
  addToken: boolean = false) {

  const target = await ctx.database.get("gh_tile", { userId: session.userId })
  if (target.length > 0) {
    return '已存在瓷砖提醒，请输入命令stile 关闭/启动tile提醒'
  }

  let token: string = ''
  if (addToken) {
    await session.send('请输入github token')
    token = await session.prompt(150000)
    if (!token) {
      return '瓷砖提醒设置失败，无效的github token'
    }
  }

  let username: string
  await session.send('请输入 github 用户名')
  username = await session.prompt(150000)
  if (!username) {
    return '瓷砖提醒设置失败，无效的 username'
  }

  ctx.database.create('gh_tile', {
    time: config.corn,
    enable: true,
    userId: session.userId,
    token: token,
    username: username,
    rules:
      [
        {
          selfId: session.bot.selfId,
          platform: session.platform,
          guildId: session.guildId,
          channelId: session.channelId
        }
      ]
  })


  schedule_cron(
    ctx,
    {
      time: config.corn,
      token: token,
      username: username,
      enable: true,
      rules:
        [
          {
            selfId: session.bot.selfId,
            platform: session.platform,
            guildId: session.guildId,
            channelId: session.channelId
          }
        ]
    })
  return '瓷砖提醒成功'

}
/**
 * 根据闹钟id 启用/关闭 闹钟
 * @param ctx 上下文
 * @param session 会话
 * @param id 闹钟的id
 * @returns 
 */
async function clock_switch(ctx: Context, session: Session) {
  const target = await ctx.database.get("gh_tile", { userId: session.userId })
  if (target.length < 1) {
    return '请先添加瓷砖提醒'
  }
  await ctx.database.set("gh_tile", { userId: session.userId }, { enable: target[0].enable ? false : true })
  const msg = `${target?.[0].username}，已${target[0].enable ? "关闭" : "开启"}瓷砖提醒, 重启后生效`
  // 重启 koishi
  session.execute('shutdown -r now')
  return msg

}



/**
 * 
 * @param ctx 上下文
 * @param config 配置项
 * @param clock 闹钟配置
 * @returns 
 */
function schedule_cron(ctx: Context, gh_tile: Gh_tile) {
  // 设置每天早上11点30触响铃
  setDailyAlarm(gh_tile.time, async () => {
    let { channelId, platform, selfId, guildId } = gh_tile.rules[0]
    if (!selfId) {
      const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
      if (!channel || !channel.assignee) return
      selfId = channel.assignee
      guildId = channel.guildId
    }
    let nums: number | boolean

    if (gh_tile?.token) {
      nums = await getContributions(ctx, gh_tile.token, gh_tile.username)
    } else {
      // 获取日期
      const now = new Date();
      const year = String(now.getFullYear())
      const month = String(now.getMonth() + 1)
      const day = String(now.getDate())
      const date = `${year}-${month.length < 2 ? "0" + month : month}-${day.length < 2 ? "0" + day : day}`
      nums = await getTileNums(ctx, gh_tile.username, date)

    }
    if (nums === -1) {
      const bot = ctx.bots[`${gh_tile.rules[0].platform}:${gh_tile.rules[0].selfId}`]
      const img_url = pathToFileURL(resolve(__dirname, "0.jpg")).href
      bot?.sendMessage(channelId, h.image(img_url) + "" + h.at(gh_tile.userId) + "起来贴瓷砖!", guildId)
    }
  });

}