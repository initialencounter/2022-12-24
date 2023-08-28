import { Context, Schema, Session, h, Logger } from 'koishi'

import { mainUsage } from './config'
import { pathToFileURL} from 'node:url'
import { resolve } from "path";
export const name = 'gh-tile'
export const logger = new Logger(name)

export const usage = mainUsage
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
  corn: Schema.string().default("23-30").description("默认的提醒时间")
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
        schedule_cron(ctx, config, i)
      }
    }
  })
  ctx.command('stile', "关闭/启动tile提醒", { checkArgCount: true }).action(async ({ session }, id) => {
    return clock_switch(ctx, session as Session)
  })
  ctx.command('瓷砖 [userId:string]',"查看群友今天贴了多少瓷砖").action(async({session})=>{
    const clocks = await ctx.database.get('gh_tile', {userId:session.userId})
    if(clocks.length===0){
      return "该用户没有绑定token (私信机器人绑定)"
    }else{
      const currentWeek = new Date().getDay()
      const data = await getContributions(ctx, clocks[0]?.token, clocks[0]?.username)
      const tileNums = data?.["user"]?.["contributionsCollection"]?.["contributionCalendar"]?.["weeks"]?.[0]?.["contributionDays"]?.[currentWeek]?.["contributionCount"]
      return clocks[0]?.username+"今天贴了 "+tileNums+" 块瓷砖"
    }
  })
  ctx.middleware(async (session, next)=>{
    if(!session.content.startsWith("瓷砖")){
      return next()
    }else{
      const target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
      if(target.length===0){
        return next()
      }else{
        return session.execute("瓷砖 "+target[0])
      }
    }
  })
  ctx.command('tile', "添加github瓷砖提醒, 绑定token")
    .action(({ session}) => {
      // 为了保证登录安全，只能私信机器人操作
      if (session?.guildId===session?.channelId) {
        return session.text('messages.login.failure', ['不安全的操作，请私信机器人操作'])
      }
      return add_clock(ctx, session as Session, config)
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
  config: Config) {
  
  const target = await ctx.database.get("gh_tile", { userId: session.userId })
  if (target.length > 0) {
    return '已存在瓷砖提醒，请输入命令stile 关闭/启动tile提醒'
  }

  let token: string
  await session.send('请输入github token')
  token = await session.prompt(150000)
  if (!token) {
    return '瓷砖提醒设置失败，无效的github token'
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
    config,
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

async function getContributions(ctx: Context, token: string, username: string) {
  const headers = {
    'Authorization': `bearer ${token}`,
  }
  const currentDate = new Date();
  // 获取 周几
  const currentWeek = currentDate.getDay();

  // 获取周末
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentWeek);
  const formattedStart = weekStart.toISOString();

  // 获取周日
  const weekEnd = new Date(currentDate);
  weekEnd.setDate(currentDate.getDate() + (6 - currentWeek)); // Start from the 1st day of last month
  const formattedEnd = weekEnd.toISOString();

  const body = {
    "query": `query {
          user(login: "${username}") {
            name
            contributionsCollection(from: "${formattedStart}" to: "${formattedEnd}") {
              contributionCalendar {
                weeks {
                  contributionDays {
                    contributionCount
                    date
                    weekday
                  }
                  firstDay
                }
              }
            }
          }
        }`
  }
  const response = await ctx.http.post('https://api.github.com/graphql', body, { headers: headers });
  const data = await response.data;
  return data
}

function getContributionCount(contributionData, currentWeek: number) {
  const todayContribution = contributionData?.["user"]?.["contributionsCollection"]?.["contributionCalendar"]?.["weeks"]?.[0]?.["contributionDays"]?.[currentWeek]?.["contributionCount"]
  if (todayContribution === 0) {
    return false
  } else {
    return true
  }
}


/**
 * 
 * @param ctx 上下文
 * @param config 配置项
 * @param clock 闹钟配置
 * @returns 
 */
function schedule_cron(ctx: Context, config: Config, gh_tile: Gh_tile) {
  const targets = config.rules
  for (var i of gh_tile.rules) {
    if (!targets.includes(i)) {
      targets.push(i)
    }
  }
  // 设置每天早上8点触响铃
setDailyAlarm(gh_tile.time, async () => {
  for (let { channelId, platform, selfId, guildId } of targets) {
    if (!selfId) {
      const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
      if (!channel || !channel.assignee) return
      selfId = channel.assignee
      guildId = channel.guildId
    }
    const data = await getContributions(ctx, gh_tile.token, gh_tile.username)
    const tile = getContributionCount(data, new Date().getDay())
    if (!tile) {
      const bot = ctx.bots[`${platform}:${selfId}`]
      const img_url = pathToFileURL(resolve(__dirname, "0.jpg")).href
      bot?.sendMessage(channelId, h.image(img_url)+""+h.at(gh_tile.userId)+"起来贴瓷砖!!!", guildId)
    }
  }
});

}

function setDailyAlarm(time:string, callback:CallableFunction) {
  const hour = Number(time.split("-")[0])
  const minute = Number(time.split("-")[1])
  if(isNaN(hour)||isNaN(minute)){
    logger.error("瓷砖提醒设置失败！")
    return
  }
  const now = new Date();
  const alarmTime = new Date();
  alarmTime.setUTCHours(hour);
  alarmTime.setUTCMinutes(minute);
  alarmTime.setUTCSeconds(0);

  if (alarmTime <= now) {
    // 如果今天的时间已经过去了，就设置到明天的同一时间
    alarmTime.setUTCDate(alarmTime.getDate() + 1);
  }

  const timeUntilAlarm = alarmTime.getTime() - now.getTime();
  setTimeout(() => {
    setInterval(callback, 86400000);
    callback();
    // 设置每隔一天触发一次的定时器
  }, timeUntilAlarm);
  logger.info("瓷砖提醒设置成功！")
}