import { Context, Schema, Session, h, Logger } from 'koishi'

import { mainUsage } from './config'
import { pathToFileURL } from 'node:url'
import { resolve } from "path";
import { getTileNums, getContributions } from "./utils"
import cron from 'node-cron'
export const name = 'gh-tile'
export const logger = new Logger(name)

const setTimeoutDict = {}
export const usage = `${mainUsage}`
export interface Rule {
  platform: string
  channelId: string
  selfId?: string
  guildId?: string
}

export const Config: Schema<Config> = Schema.object({
  corn: Schema.string().default("23-30").description("默认的提醒时间,UTC时间")
})

export interface Config {
  corn: string
}
declare module 'koishi' {
  interface Tables {
    github_tile: Gh_tile
  }
}
const TABLE_NAME = "github_tile"
export interface Gh_tile {
  id?: number
  time?: string
  enable?: boolean
  rules: Rule
  token: string
  username: string
  userId: string
}

export const using = ['database']
export function apply(ctx: Context, config: Config) {
  ctx.model.extend('github_tile', {
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
    autoInc: true,
    unique: ['id', 'userId']
  })
  ctx.on('ready', async () => {
    const clocks = await ctx.database.get('github_tile', {})
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
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const day = now.getDate()
      const nowadate = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`

      let token: string

      if (!date) {
        date = nowadate
      }
      if (!username) {
        const clocks = await ctx.database.get('github_tile', { userId: session.userId })
        username = clocks?.[0]?.username
        token = clocks?.[0]?.token
      } else {
        const clocks = await ctx.database.get('github_tile', { username: username })
        token = clocks?.[0]?.token
      }

      if (!username) {
        return "该用户未绑定 github"
      }
      if (token) {
        nums = await getContributions(ctx, token, username, date)
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
      const username = (await ctx.database.get(TABLE_NAME, { userId: target[0] }))?.[0]?.username
      if (!username) {
        return '该用户未绑定 github'
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
  let username: string
  let token: string = ''
  let cover: boolean = false
  const target = await ctx.database.get(TABLE_NAME, { userId: session.userId })
  if (target?.length > 0) {
    session.send("已存在提醒，是否要继续[y/n]")
    const continu = await session.prompt(150000)
    if (continu.toUpperCase().startsWith("N")) {
      return
    }
    cover = true
    clearAlarm(session.userId)
    token = target[0]?.token
  }


  if (addToken) {
    await session.send('请输入github token')
    token = await session.prompt(150000)
    if (!token) {
      return '瓷砖提醒设置失败，无效的github token'
    }
  }


  await session.send('请输入 github 用户名')
  username = await session.prompt(150000)
  if (!username) {
    return '瓷砖提醒设置失败，无效的 username'
  }
  if (cover) {
    ctx.database.set('github_tile', { userId: session.userId }, {
      time: config.corn,
      enable: true,
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
  } else {
    ctx.database.create('github_tile', {
      time: config.corn,
      enable: true,
      userId: session.userId,
      token: token,
      username: username,
      rules: {
        selfId: session.bot.selfId,
        platform: session.platform,
        guildId: session.guildId,
        channelId: session.channelId
      }
    })
  }



  schedule_cron(
    ctx,
    {
      time: config.corn,
      token: token,
      username: username,
      userId: session.userId,
      enable: true,
      rules: {
        selfId: session.bot.selfId,
        platform: session.platform,
        guildId: session.guildId,
        channelId: session.channelId
      }

    })
  return '瓷砖提醒成功,输入命令stile 关闭/启动tile提醒'

}
/**
 * 根据闹钟id 启用/关闭 闹钟
 * @param ctx 上下文
 * @param session 会话
 * @param id 闹钟的id
 * @returns 
 */
async function clock_switch(ctx: Context, session: Session) {
  const target = await ctx.database.get(TABLE_NAME, { userId: session.userId })
  if (target.length < 1) {
    return '请先添加瓷砖提醒'
  }
  clearAlarm(session.userId)
  await ctx.database.set(TABLE_NAME, { userId: session.userId }, { enable: target[0].enable ? false : true })
  const msg = `${target?.[0].username}，已${target[0].enable ? "关闭" : "开启"}瓷砖提醒`
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
  const [hour,minute] = gh_tile.time.split('-')
  const cronExp = `0 ${minute} ${hour} * * *`
  cron.schedule(cronExp,async () => {
    let { channelId, platform, selfId, guildId } = gh_tile.rules
    if (!selfId) {
      const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
      if (!channel || !channel.assignee) return
      selfId = channel.assignee
      guildId = channel.guildId
    }
    let nums: number | boolean


    // 获取日期
    const now = new Date();
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const date = `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`
    if (gh_tile?.token) {
      nums = await getContributions(ctx, gh_tile.token, gh_tile.username, date)
    } else {
      nums = await getTileNums(ctx, gh_tile.username, date)

    }
    if (nums === -1) {
      const bot = ctx.bots[`${gh_tile.rules[0].platform}:${gh_tile.rules[0].selfId}`]
      const img_url = pathToFileURL(resolve(__dirname, "0.jpg")).href
      bot?.sendMessage(channelId, h.image(img_url) + "" + h.at(gh_tile.userId) + "起来贴瓷砖!", guildId)
    }
  });
  logger.info(`${(gh_tile.userId)}-${gh_tile.username}瓷砖提醒设置成功！`)
}

export function clearAlarm(uid: string) {
  // 清除timeOut
  const timeoutId = setTimeoutDict[uid]
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

}