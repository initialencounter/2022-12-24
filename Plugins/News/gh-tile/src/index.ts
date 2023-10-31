import { Context, Schema, Session, h, Logger } from 'koishi'

import { mainUsage } from './config'
import { pathToFileURL } from 'node:url'
import { resolve } from "path";
import { getTileNums, getContributions } from "./utils"
import cron from 'node-cron'
export const name = 'gh-tile'
export const logger = new Logger(name)

export const usage = `${mainUsage}`
export interface Rule {
  platform: string
  channelId: string
  selfId?: string
  guildId?: string
}

export const Config: Schema<Config> = Schema.object({
  corn: Schema.string().default("23-30").description("默认的提醒时间,UTC时间"),
  forwardServer: Schema.string().default("https://initencunter-node-server.hf.space/?method=get&url=https://github.com").description("转发服务")
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
  enable?: boolean
  rules: Rule
  token: string
  username: string
  nickname: string
  userId: string
}

export const alertList: Gh_tile[] = []
let channelIdObj = {}
export const using = ['database']
export function apply(ctx: Context, config: Config) {
  ctx.model.extend('github_tile', {
    // 各字段类型
    id: 'unsigned',
    enable: "boolean",
    rules: "json",
    token: "text",
    username: "text",
    nickname: "text",
    userId: "string",
  }, {
    primary: 'id', //设置 uid 为主键
    autoInc: true,
    unique: ['id', 'userId']
  })
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.on('ready', async () => {
    const clocks = await ctx.database.get('github_tile', { enable: { $eq: true } })
    for (var j of clocks) {
      alertList.push(j)
      logger.info(`${(j.userId)}-${j.username} 瓷砖提醒设置成功！`)
    }
    const [hour, minute] = config.corn.split('-')
    const cronExp = `0 ${minute} ${hour} * * *`
    cron.schedule(cronExp, () => alertCallbackFunctionasync(ctx))
  })
  ctx.command('tile', "查看群友今天贴了多少瓷砖").alias("瓷砖")
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
        return session.text('commands.tile.messages.no-such-user')
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
      if (nums === 0) {
        return `${username} 在 ${date} 没有贴瓷砖`
      }
      return `${username} 在 ${date} 贴了 ${nums} 块瓷砖`
    })
  ctx.command('tile.switch', "关闭/启动tile提醒", { checkArgCount: true }).action(async ({ session }, id) => {
    return clock_switch(ctx, session as Session)
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
        return session.text('commands.tile.messages.no-such-user')
      }
      if (session.content.indexOf("昨天") > -1) {
        const date = getYesterdayDate()
        return session.execute(`瓷砖 -u ${username} -d ${date}`)
      }
      return session.execute("瓷砖 -u " + username)

    }
  })
  ctx.command('tile.bind [username:string]', "添加github瓷砖提醒, 绑定github用户名").alias("绑定gh", "添加瓷砖")
    .action(({ session }, username) => {
      session.bot.sendPrivateMessage
      // 为了保证登录安全，只能私信机器人操作
      if (session?.guildId === session?.channelId) {
        return add_clock(ctx, session as Session, username)
      } else {
        return add_clock(ctx, session as Session, username, false)
      }
    })
}

function channelIdDict<T>(channelIdselfId: T): Array<{
  enable: boolean,
  userId: T,
  token: T,
  username: T,
  nickname:T,
  rules:
  {
    selfId: T,
    platform: T,
    guildId: T,
    channelId: T
  }

}> {
  return channelIdObj[`${channelIdselfId}`] ?? []
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
  username: string,
  addToken: boolean = false) {
  let token: string = ''
  let cover: boolean = false
  const target = await ctx.database.get(TABLE_NAME, { userId: session.userId })
  if (target?.length > 0) {
    session.send("已存在提醒，是否要继续[y/n]")
    const continu = await session.prompt(150000)
    if (!continu.toUpperCase().startsWith("Y")) {
      return
    }
    cover = true
    clearAlarm(session.userId)
    token = target[0]?.token
  }


  if (addToken) {
    await session.send(session.text('commands.tile.messages.tile-input', ["GitHub token"]))
    token = await session.prompt(150000)
    if (!token) {
      return session.text('commands.tile.messages.inv-token')
    }
  }

  if (!username) {
    await session.send(session.text('commands.tile.messages.tile-input', ["GitHub 用户名"]))
    username = await session.prompt(150000)
  }
  if (!username) {
    return session.text('commands.tile.messages.inv-username')
  }
  if (cover) {
    ctx.database.set('github_tile', { userId: session.userId }, {
      enable: true,
      token: token,
      username: username,
      nickname: session.username,
      rules:
      {
        selfId: session.bot.selfId,
        platform: session.platform,
        guildId: session.guildId,
        channelId: session.channelId
      }

    })
  } else {
    ctx.database.create('github_tile', {
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
  alertList.push({
    enable: true,
    userId: session.userId,
    token: token,
    username: username,
    nickname: session.username,
    rules: {
      selfId: session.bot.selfId,
      platform: session.platform,
      guildId: session.guildId,
      channelId: session.channelId
    }
  })
  return session.text('commands.tile.messages.tile-set-success')

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
  if (target.length === 0) {
    return session.text('commands.tile.messages.no-such-user')
  }
  if (target?.[0].enable) {
    clearAlarm(session.userId)
  } else {
    alertList.push(target?.[0])
  }
  await ctx.database.set(TABLE_NAME, { userId: session.userId }, { enable: target[0].enable ? false : true })

  return session.text('commands.tile.messages.tile-switch', [target?.[0].username, target[0].enable ? "关闭" : "开启"])

}
export async function alertCallbackFunctionasync(ctx: Context) {
  const date = getDate()
  channelIdObj = []
  for (var i of alertList) {
    let { channelId, selfId } = i.rules
    const channelIdList = channelIdDict<string>(`${channelId}-${selfId}`)
    if ((channelIdList).length < 1) {
      channelIdObj[`${channelId}-${selfId}`] = [i]
    } else {
      channelIdObj[`${channelId}-${selfId}`].push(i)
    }
  }
  for (var j of Object.keys(channelIdObj)) {
    let atList = ''
    let { channelId, platform, selfId, guildId } = channelIdDict<string>(j)[0].rules
    let rank = []
    for (var k of channelIdDict<string>(j)) {
      let nums: number | boolean
      if (k?.token) {
        nums = await getContributions(ctx, k.token, k.username, date)
      } else {
        nums = await getTileNums(ctx, k.username, date)
      }
      // 记录瓷砖
      if (nums as number > 0) {
        rank.push({ username: k.username, tile: nums })
      }
      if (nums === -1) {
        atList += h.at(k.userId,{name: k.nickname}) + ' '
      } else if (!nums) {
        logger.warn(`${(k.userId)}-${k.username} 瓷砖查询失败, 建议配置 token 或 proxy`)
      }
    }

    // 排序
    rank.sort((a, b) => b.tile - a.tile)
    const bot = ctx.bots[`${platform}:${selfId}`]
    const img_url = pathToFileURL(resolve(__dirname, "0.jpg")).href
    bot?.sendMessage(channelId, `${rank[0].username} 是今天的瓷砖王，居然贴了${rank[0]?.tile}块瓷砖!`, guildId)
    // 读取提醒语
    const alertText = ctx.i18n.get('commands.tile.messages.tile-alert')['zh'] ?? '快起来贴瓷砖！'
    if (atList) {
      bot?.sendMessage(channelId, h.image(img_url) + "" + atList + alertText, guildId)
    }
  }
}

export function clearAlarm(uid: string) {
  // 清除timeOut
  for (var i = 0; i < alertList.length; i++)
    if (alertList[i].userId == uid) {
      alertList.splice(i, 1)
    }
}

export function getDate() {
  // 获取日期 如果在8点之前，则返回昨天的日期
  const now = new Date();
  const hour = now.getHours()
  if (hour<8){
    const date = getYesterdayDate()
    return date
  }
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  return `${year}-${month < 10 ? "0" + month : month}-${day < 10 ? "0" + day : day}`
}

export function getYesterdayDate() {
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
  return date
}