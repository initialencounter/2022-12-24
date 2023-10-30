import { Context, Schema, Logger, Dict, Session, h, Keys } from 'koishi';
import Minefield from "./minesweeper";
import { renderX, setTheme } from './render'
export const name = 'minesweeper-ending';

import { MineConfig, mineUsage } from "./config"

import {
  updateChallengeRank,
  updateRank,
  findNoGuess,
  getMineNums,
  sleep,
  getProfiles,
  makePool,
  GameInfo,
  renderProfiles
} from "./utils";

const logger = new Logger(name)

export interface MinesweeperRank {
  id: number
  userId: string
  userName: string
  score: number
  isFlag: boolean
  LastChallenge: number
  ChallengeScore: number
  openNums: number
  games: number
  wins: number
  title: string
}

// TypeScript 用户需要进行类型合并
declare module 'koishi' {
  interface Tables {
    minesweeper_ending_rank: MinesweeperRank
  }
}

class EndingGame {
  static using = ['puppeteer']
  minefieldDict: Dict
  banList: Dict
  theme: string
  constructor(private ctx: Context, private config: MineConfig) {
    setTheme(config)
    this.banList = {}
    this.theme = this.config.theme
    ctx = ctx.guild()
    // 拓展 Minesweeper 排行榜表
    ctx.model.extend('minesweeper_ending_rank', {
      // 各字段类型
      id: 'unsigned',
      userId: 'string',
      userName: 'string',
      score: 'integer(10)',
      isFlag: 'boolean',
      LastChallenge: 'integer(16)',
      ChallengeScore: "integer(10)",
      openNums: "integer(10)",
      games: "integer(10)",
      wins: "integer(10)",
      title: "string"
    }, {
      // 使用自增的主键值
      autoInc: true,
    })
    this.minefieldDict = {}


    ctx.command("扫雷生涯 [at]", "查看自己或其他玩家的生涯").alias("我的信息", "生涯").action(async ({ session }) => {
      const target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
      let uid: string = session.userId
      if (target?.length > 0) {
        uid = target[0]
      }
      const porfile: Pick<MinesweeperRank, Keys<MinesweeperRank, any>> = await getProfiles(ctx, uid)
      return await renderProfiles(ctx, porfile)
    })

    // 挑战玩法
    ctx.command("fight", "开启扫雷挑战模式")
      .alias("挑战模式")
      .action(async ({ session }) => {
        let last = await ctx.model.get('minesweeper_ending_rank', { userId: session.userId })
        const now = new Date().getDate()
        if (last.length === 0) {
          await ctx.model.create('minesweeper_ending_rank', { userId: session.userId, userName: session.username, LastChallenge: now })
        } else {
          if (last[0]?.LastChallenge) {
            if (last[0]?.LastChallenge === now) {
              const { score } = await getProfiles(ctx, session.userId)
              if (score) {
                if (score < 10) {
                  return `积分不足啦喵~ 当前积分: ${score}`
                }
              } else {
                return `积分不足啦喵~ 当前积分: 0`
              }
              session.send("今天已经挑战过了, 门票将收取 10 积分")
              const info: GameInfo = {
                userId: session.userId,
                username: session.username,
                score: -10,
                openNums: 0,
                ChallengeScore: 0,
                games: 0,
                wins: 0
              }
              updateRank(ctx, info)
            } else {
              await ctx.model.set('minesweeper_ending_rank', { userId: session.userId }, { LastChallenge: now })
            }
          } else {
            await ctx.model.set('minesweeper_ending_rank', { userId: session.userId }, { LastChallenge: now })
          }
        }
        session.send(h.at(session.userId) + "请准备! 3s 后开始挑战, 输入取消可以放弃挑战")
        await sleep(3000)
        const nowStamp = Date.now()
        let m = new Minefield(this.config.widthC, this.config.heightC, this.config.minesC)
        m = makePool(m)
        session.send(h.at(session.userId) + `|\n雷数:${m["mines"]}\n剩余BV:${m["keyPool"].length}` + h.image(await renderX(m), "image/png"))
        const cell = await session.prompt(86400000)
        if (!cell) {
          return "挑战失败"
        }
        if (isNaN(Number(cell))) {
          session.send(h.at(session.userId) + "输入不合法，你还有一次机会")
          const cell = await session.prompt(86400000)
          if (isNaN(Number(cell))) {
            return "挑战失败"
          }
        }
        m = findNoGuess(m, cell)
        m = makePool(m)
        m["goingOn"] = true
        while (m["goingOn"] == true) {
          m = makePool(m)
          session.send(h.at(session.userId) + `|\n雷数:${m["mines"]}\n剩余BV:${m["keyPool"].length}` + h.image(await renderX(m), "image/png"))
          var input = await session.prompt(86400000)
          if (!input) {
            return h.at(session.userId) + "输入超时, 挑战失败"
          }
          if (input.includes("放弃") || input.includes("取消")) {
            m["goingOn"] = false
          } else {
            let s = input
            if (s.startsWith('f')) {
              s = s.slice(1,)
              if (isNaN(Number(s))) {
                session.send("输入序号不合法")
              } else {
                m = this.challengeFl(m, s, session as Session)
              }
            } else if (s.startsWith('s')) {
              s = s.slice(1,)
              if (isNaN(Number(s))) {
                session.send("输入序号不合法")
              } else {
                m = this.challengeNf(m, s, session as Session)
              }
            } else {
              if (isNaN(Number(s))) {
                session.send("输入序号不合法")
              } else {
                const flag = await ctx.model.get('minesweeper_ending_rank', { userId: session.userId })
                if (flag?.[0]?.isFlag) {
                  m = this.challengeFl(m, s, session as Session)
                } else {
                  m = this.challengeNf(m, s, session as Session)
                }
              }
            }
          }
          m = makePool(m)
          if (m["keyPool"].length === 0 || m["dgPool"] === 0) {
            break
          }
        }
        if (m["goingOn"]) {
          const completeTime = Date.now()
          const dt: number = completeTime - nowStamp
          await updateChallengeRank(session as Session, ctx, session.userId, session.username, dt)
          return `挑战完成，用时${dt / 1000}秒`
        } else {
          return "挑战失败"
        }



      })
    ctx.command('flag', '开启或关闭标记模式,仅对自己生效').alias('切换标记模式')
      .action(async ({ session }) => {
        const target = await ctx.model.get('minesweeper_ending_rank', { userId: session.userId }, ["isFlag"])
        if (target.length > 0) {
          await ctx.model.set('minesweeper_ending_rank', { userId: session.userId }, { isFlag: target[0]?.isFlag ? false : true })
          return `已切换为 ${target[0]?.isFlag ? "nf" : "fl"} 模式`
        } else {
          await ctx.database.create('minesweeper_ending_rank', { userId: session.userId, userName: session.username, isFlag: true })
          return '已为您设置为 nf 模式'
        }
      })
    ctx.command("ed [行:number] [列:number] [雷:number]", "开启残局，默认是4*4*6")
      .alias('残局', "minesweeper-ending")
      .option("force", "-f")
      .action(async ({ session, options }, ...args) => {
        const m: Minefield = this.minefieldDict[session.channelId]
        if (options.force) {
          logger.info("强制重开")
        } else if (m?.isGoingOn()) {
          session.send(h.at(session.userId) + `|\n雷数:${m["mines"]}\n剩余BV:${m["keyPool"].length}` + h.image(await renderX(m), "image/png"))
          return "已存在残局"
        }
        const info: GameInfo = {
          userId: session.userId,
          username: session.username,
          score: 0,
          openNums: 0,
          ChallengeScore: 0,
          games: 1,
          wins: 0
        }
        await updateRank(ctx, info)
        let x: number
        let y: number
        let z: number
        if (args[0] && args[1]) {
          if (args[0] * args[1] > 99) {
            return "图太大了, 格子数应当小于100"
          }
          if (args[0] * args[1] < 9) {
            return "图太小了, bv数应当大于9"
          }
          x = args[0]
          y = args[1]
        }
        if (x && y && args[2]) {
          if (x * y < args[2]) {
            return "雷比格子多"
          }
          z = args[2]
        } else {
          if (x && y && !args[2]) {
            z = getMineNums(x, y)
          }
        }
        return await this.renew(session as Session, x, y, z)
      })
    ctx.command("ed.end", "结束 ed").alias('不玩了').action(({ session }) => {
      this.minefieldDict[session.guildId] = null
      return "游戏结束"
    })
    ctx.command("ed.n", "刷新 ed").alias("刷新残局", "重开").action(async ({ session }) => {
      const m: Minefield = this.minefieldDict[session.channelId]
      if (!m) {
        return "不存在残局"
      }
      return await this.renew(session as Session, m.width, m.height, m.mines)
    })
    ctx.command("ed.l", "查看地雷").alias("揭晓").action(({ session }) => {
      let m = this.minefieldDict[session.channelId]
      return this.getHint(m, session as Session)
    })


    /**
     * 二. 开始游戏
     * 1.发送雷图
     * 2.接收玩家的指令，将残局的所有雷标记出来的玩家获胜
     */
    ctx.command("ed.s [numberString:string]", "打开格子").alias("破解", "开", "打开", "破", "open").action(async ({ session, options }, inputString) => {

      //检查是否拥有操作权限
      const dt = this.checkPermision(session.userId)
      if (dt) {
        return `你已被禁止操作，${dt / 1000}s 后重试`
      }

      let m: Minefield = this.minefieldDict[session.channelId]
      if (!m?.isGoingOn()) {
        return "不存在残局"
      }
      const tmp = []
      for (let i = 0; i < inputString.length; i += 2) {
        let pair = inputString.slice(i, i + 2);
        if (pair.startsWith("0")) {
          pair = this.remove0(pair)
        }
        // 清洗后的 cellId
        if (pair) {
          tmp.push(pair)
        }
      }
      const c: string[] = m["keyPool"].filter(function (v) { return tmp.indexOf(v) > -1 })
      const wrong: string[] = tmp.filter(function (v) { return m["keyPool"].indexOf(v) == -1 })
      logger.info(`谜底：${m["keyPool"]}`)
      logger.info(`输入：${tmp}`)
      logger.info(`交集: ${c}`)
      logger.info(`开错的：${wrong}`)
      // 打开正确的方块
      for (var s of c) {
        m.openCell(s)
      }
      // 更新 雷 和 空
      m = makePool(m)
      await session.send(h.at(session.userId) + `|\n雷数:${m["mines"]}\n剩余BV:${m["keyPool"].length}` + h.image(await renderX(m), "image/png"))
      // 猜错了
      if (wrong.length > 0) {
        await this.ban(session.userId)
        const info: GameInfo = {
          userId: session.userId,
          username: session.username,
          score: -5,
          openNums: c.length,
          ChallengeScore: 0,
          games: 0,
          wins: 0
        }
        await updateRank(ctx, info)
        return `捣乱的叉出去！${wrong}`
      }
      if (m["keyPool"]?.length > 0) {
        // 开不全
        const score = Math.fround(c.length / 2)
        const info: GameInfo = {
          userId: session.userId,
          username: session.username,
          score: score,
          openNums: score,
          ChallengeScore: 0,
          games: 0,
          wins: 0
        }
        await updateRank(ctx, info)
        return `你猜对了${c.length}个,获得 ${score} 点积分喵~`
      } else {
        // 开全了
        this.minefieldDict[session.channelId] = null
        const info: GameInfo = {
          userId: session.userId,
          username: session.username,
          score: tmp.length * 2,
          openNums: tmp.length,
          ChallengeScore: 0,
          games: 0,
          wins: 1
        }
        await updateRank(ctx, info)
        return `破解成功！恭喜你喵~ 获得 ${tmp.length * 2} 点积分喵~`
      }
    })
    ctx.command("ed.f [numberString:string]", "标记地雷").alias("标记", "标").action(async ({ session, options }, inputString) => {

      //检查是否拥有操作权限
      const dt = this.checkPermision(session.userId)
      if (dt) {
        return `你已被禁止操作，${dt / 1000}s 后重试`
      }

      let m: Minefield = this.minefieldDict[session.channelId]
      if (!m?.isGoingOn()) {
        return "不存在残局"
      }
      const tmp = []
      for (let i = 0; i < inputString.length; i += 2) {
        let pair = inputString.slice(i, i + 2);
        if (pair.startsWith("0")) {
          pair = this.remove0(pair)
        }
        // 清洗后的 cellId
        if (pair) {
          tmp.push(pair)
        }
      }
      const c: string[] = m["dgPool"].filter(function (v) { return tmp.indexOf(v) > -1 })
      const wrong: string[] = tmp.filter(function (v) { return m["dgPool"].indexOf(v) == -1 })
      logger.info(`正确的雷：${m["dgPool"]}`)
      logger.info(`输入：${tmp}`)
      logger.info(`交集: ${c}`)
      logger.info(`标错的：${wrong}`)

      // 标出正确的雷
      for (var s of c) {
        m[s]["isFlagged"] = true
      }

      // 更新 雷 和 空
      m = makePool(m)
      await session.send(h.at(session.userId) + `|\n雷数:${m["mines"]}\n剩余BV:${m["keyPool"].length}` + h.image(await renderX(m), "image/png"))

      // 猜错了
      if (wrong.length > 0) {
        await this.ban(session.userId)
        const info: GameInfo = {
          userId: session.userId,
          username: session.username,
          score: -5,
          openNums: c.length,
          ChallengeScore: 0,
          games: 0,
          wins: 0
        }
        await updateRank(ctx, info)
        return `捣乱的叉出去！${wrong}`
      }

      // 标不全
      if (m["dgPool"]?.length > 0) {
        const score = Math.fround(c.length / 2)
        const info: GameInfo = {
          userId: session.userId,
          username: session.username,
          score: c.length / 2,
          openNums: c.length,
          ChallengeScore: 0,
          games: 0,
          wins: 0
        }
        await updateRank(ctx, info)
        return `你猜对了${c.length}个,获得 ${score} 点积分喵~`
      } else {
        this.minefieldDict[session.channelId] = null
        const info: GameInfo = {
          userId: session.userId,
          username: session.username,
          score: m["keyPool"].length * 2,
          openNums: m["keyPool"].length,
          ChallengeScore: 0,
          games: 0,
          wins: 1
        }
        await updateRank(ctx, info)
        return `破解成功！恭喜你喵~ 获得 ${m["keyPool"].length * 2} 点积分喵~`
      }
    })
    ctx.middleware(async (session, next) => {
      if (session.content.startsWith("生涯")) {
        const target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
        if (target.length > 0) {
          const uid = target[0]
          const porfile: Pick<MinesweeperRank, Keys<MinesweeperRank, any>> = await getProfiles(ctx, uid)
          return await renderProfiles(ctx, porfile)
        } else {
          return next()
        }
      }
      if (!this.minefieldDict[session.channelId]?.isGoingOn()) {
        return next()
      }
      let s = session.content
      if (s.startsWith('f')) {
        s = s.slice(1,)
        if (isNaN(Number(s))) {
          return next()
        }

        return session.execute(`ed.f ${s}`)
      } else if (s.startsWith('s')) {
        s = s.slice(1,)
        if (isNaN(Number(s))) {
          return next()
        }
        return session.execute(`ed.s ${s}`)
      } else {
        if (isNaN(Number(s))) {
          return next()
        }
        const flag = await ctx.model.get('minesweeper_ending_rank', { userId: session.userId })
        if (flag?.[0]?.isFlag) {
          return session.execute(`ed.f ${s}`)
        } else {
          return session.execute(`ed.s ${s}`)
        }
      }

    })

    ctx.command('ed.r', '查看最强扫雷榜单').alias("雷神殿", "雷神榜", "排行榜", "排名")
      .action(async ({ }) => {
        // 获取游戏信息
        const rankInfo: MinesweeperRank[] = await ctx.model.get('minesweeper_ending_rank', {})
        // 根据score属性进行降序排序
        rankInfo.sort((a, b) => b.score - a.score)
        // 只保留前十名玩家，并生成排行榜的纯文本
        const table: string = generateRankTable(rankInfo.slice(0, 10))
        return table

        // 定义一个函数来生成排行榜的纯文本
        function generateRankTable(rankInfo: MinesweeperRank[]): string {
          // 定义排行榜的模板字符串
          const template = `
雷神殿：
排名  昵称   积分  
--------------------
${rankInfo.map((player, index) => ` ${String(index + 1).padStart(2, ' ')}   ${player.userName.padEnd(6, ' ')} ${player.score.toString().padEnd(4, ' ')}`).join('\n')}
`
          return template
        }
      })

    ctx.command('ed.cr', '查看挑战榜').alias("挑战榜")
      .action(async ({ }) => {
        // 获取游戏信息
        const rankInfo: MinesweeperRank[] = await ctx.model.get('minesweeper_ending_rank', {})
        // 根据score属性进行降序排序
        const tmp = []
        for (var i of rankInfo) {
          if (i.ChallengeScore != 0) {
            tmp.push(i)
          }
        }
        tmp.sort((a, b) => a.ChallengeScore - b.ChallengeScore)
        const table: string = generateRankTable(tmp)
        return table

        // 定义一个函数来生成排行榜的纯文本
        function generateRankTable(rankInfo: MinesweeperRank[]): string {
          // 定义排行榜的模板字符串
          const template = `
挑战榜：
排名  昵称   用时  
--------------------
${rankInfo.map((player, index) => ` ${String(index + 1).padStart(2, ' ')}   ${player.userName.padEnd(6, ' ')} ${player.ChallengeScore.toString().padEnd(4, ' ')}`).join('\n')}
`
          return template
        }
      })

  }



  /**
   * 冻结模块
   * @param userId 
   */
  async ban(userId: string) {
    const now = Date.now()
    this.banList[userId] = now
  }


  checkPermision(userId: string) {
    const lastTime: number = this.banList[userId]
    const now = Date.now()
    if (lastTime) {
      const dt = now - lastTime
      const sleep = this.config.wrongSleep
      if (dt < sleep) {
        return sleep - dt
      } else {
        return 0
      }
    } else {
      return 0
    }
  }


  /**
   * 提示模块
   * @param m 
   * @param session 
   * @returns 
   */
  async getHint(m: Minefield, session: Session) {
    if (!m.isGoingOn()) return "不存在残局"
    const now = Date.now()
    if (now - m.start_time < this.config.MinHintTime) {
      return `${(this.config.MinHintTime + m.start_time - now) / 1000}秒后才能揭晓`
    }
    for (var i of m["keyPool"]) {
      m.openCell(i)
    }
    return h.at(session.userId) + `|\n雷数:${m["mines"]}\n剩余BV:${m["keyPool"].length}` + h.image(await renderX(m), "image/png")
  }


  /**
   * 
   * @param m 挑战模式 FL
   * @param inputString 
   * @param session 
   * @returns 
   */
  challengeFl(m: Minefield, inputString: string, session: Session) {
    const tmp = []
    for (let i = 0; i < inputString.length; i += 2) {
      let pair = inputString.slice(i, i + 2);
      if (pair.startsWith("0")) {
        pair = this.remove0(pair)
      }
      // 清洗后的 cellId
      if (pair) {
        tmp.push(pair)
      }
    }
    const c = m["dgPool"].filter(function (v) { return tmp.indexOf(v) > -1 })
    const wrong = tmp.filter(function (v) { return m["dgPool"].indexOf(v) == -1 })
    logger.info(`正确的雷：${m["dgPool"]}`)
    logger.info(`输入：${tmp}`)
    logger.info(`交集: ${c}`)
    logger.info(`标错的：${wrong}`)

    if (wrong.length > 0) {
      m["goingOn"] = false
    }
    // 标出正确的雷
    for (var s of c) {
      m[s]["isFlagged"] = true
    }
    return m
  }


  /**
   * 挑战模式 NF
   * @param m 
   * @param inputString 
   * @param session 
   * @returns 
   */
  challengeNf(m: Minefield, inputString: string, session: Session) {
    const tmp = []
    for (let i = 0; i < inputString.length; i += 2) {
      let pair = inputString.slice(i, i + 2);
      if (pair.startsWith("0")) {
        pair = this.remove0(pair)
      }
      // 清洗后的 cellId
      if (pair) {
        tmp.push(pair)
      }
    }
    const c = m["keyPool"].filter(function (v) { return tmp.indexOf(v) > -1 })
    const wrong = tmp.filter(function (v) { return m["keyPool"].indexOf(v) == -1 })
    logger.info(`谜底：${m["keyPool"]}`)
    logger.info(`输入：${tmp}`)
    logger.info(`交集: ${c}`)
    logger.info(`开错的：${wrong}`)

    if (wrong.length > 0) {
      m["goingOn"] = false
    }

    // 打开正确的方块
    for (var s of c) {
      m.openCell(s)
    }
    return m
  }



  /**
   * 一.初始化，生成一个小的残局
   * 1.破空(就是打开所有雷数为0的格子)
   * 2.随机打开不为雷的格子
   * @param x 行
   * @param y 列
   * @param z 雷
   */
  initialize(x: number = this.config.width, y: number = this.config.height, z: number = this.config.mines): Minefield {
    let m = new Minefield(x, y, z)

    // 无猜
    if (!this.config.Guess) {
      m = findNoGuess(m, "0")
    }
    const cells = x * y

    // 破空
    for (var j: number = 0; j < cells; j++) {
      const s = String(j)
      const cellRecent = m[s]
      if (cellRecent["mines"] == 0) {
        m.openCell(s)
      }
    }
    // 更新 雷 和 空
    m = makePool(m)
    this.makeEnding(m)
    return m
  }



  /**
   * random openCell
   */
  makeEnding(m: Minefield) {
    let openCount = 0
    let flagCount = 0
    const keyLength = m["keyPool"].length
    const dangerLength = m["dgPool"].length
    if (this.config.InitOpen) {
      while (openCount < ((1 - this.config.DifficultyLevel) * keyLength)) {
        const randomNum = Math.floor(Math.random() * m["keyPool"].length)
        const cell = m["keyPool"][randomNum]
        m["keyPool"].splice(randomNum, 1)
        m.openCell(cell)
        openCount++
      }
    }
    if (this.config.InitFlag) {
      while (flagCount < (this.config.DifficultyLevel * dangerLength * 0.6)) {
        const randomNumD = Math.floor(Math.random() * m["dgPool"].length)
        const cell = m["dgPool"][randomNumD]
        m["dgPool"].splice(randomNumD, 1)
        m[cell]["isFlagged"] = true
        flagCount++
      }
    }

    return m
  }


  /**
   * 重置游戏
   * @param session 
   * @param x 
   * @param y 
   * @param z 
   * @returns 
   */
  async renew(session: Session, x: number = this.config.width, y: number = this.config.height, z: number = this.config.mines) {
    let m: Minefield = this.initialize(x, y, z)
    this.minefieldDict[session.channelId] = m
    return h.at(session.userId) + `|\n雷数:${m["mines"]}\n剩余BV:${m["keyPool"].length}` + h.image(await renderX(m), "image/png")
  }



  /**
   * 删除数字前面的0
   * 01，0002 返回 1 2 
   * @param s 
   * @returns string
   */
  remove0(s: String) {
    if (s.length == 1) {
      return "0"
    }
    s = s.slice(1,)
    if (s.startsWith("0")) {
      return this.remove0(s)
    } else {
      return s
    }
  }
}
namespace EndingGame {
  export const usage = `${mineUsage}`
  export const Config: Schema = MineConfig
}


export default EndingGame