import { Context, Dict, Schema, Session, Element, Logger, h } from 'koishi'
import { Klotsk } from './puzzle'
// import { setTheme, renderX } from './render'
import { setTheme, renderX } from './renderJimp'

export const name: string = 'puzzle'
export const logger = new Logger(name)


export const drctn_list: string[] = ['U', 'D', 'L', 'R']

declare module 'koishi' {
  interface Tables {
    puzzle: Pz.Puzzle
  }
}


class Pz {
  static inject = {
    required: ['jimp', "database"],
  };
  options: Dict
  globalTasks: Dict
  game_data: number[][]
  wait: number
  players: string[]
  done: boolean
  constructor(private ctx: Context, private config: Pz.Config) {
    this.globalTasks = {}
    this.players = []
    this.done = false
    setTheme(ctx)
    // this.wait = new Date().getSeconds()
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.model.extend('puzzle', {
      // 各字段类型
      id: 'unsigned',
      gid: 'string',
      uid: 'string',
      mode: 'integer',
      score: 'integer'
    }, {
      // 使用自增的主键值
      autoInc: true,
    })
    ctx.middleware(async (session, next) => {
      if (this.players.indexOf(session.userId) == -1) {
        return next()
      }
      const prompt = session.content ? session.content : ''
      if (!Object.keys(this.globalTasks).includes(session.channelId)) {
        return next()
      }
      return await this.puzzle(session, prompt)
    })
    ctx.command('pz.stop', '结束 puzzle').alias('结束华容道').action(({ session }) => {
      session = session
      return this.stop(session)
    })

    ctx.command('pz.join', '加入 puzzle 游戏').alias('加入pz').action(({ session }) => {
      this.players.push(session.userId)
    })

    ctx.command('pz.quit', '退出 puzzle').alias('退出pz').action(({ session }) => {
      const index: number = this.players.indexOf(session.userId)
      if (index == -1) {
        return session.text('commands.pz.messages.not-player')
      } else {
        this.players.splice(index)
        return session.text('commands.pz.messages.quit')
      }
    })

    ctx.command('pz.rank <prompt:number>', '查看 puzzle 排行榜').alias('华容排行榜')
      .action(({ session }, prompt) => {
        session = session
        return this.get_rank(session, prompt ? prompt : config.mode)
      })


    ctx.command('pz [mode:number]', '开始 puzzle 游戏')
      .alias('puzzle')
      .action(async ({ session, options }, mode) => {
        if (!mode) {
          mode = 4
        }
        if (mode > 5) {
          return session.text('commands.pz.messages.bad-mode')
        }
        if (Object.keys(this.globalTasks).indexOf(session.channelId) !== -1) {
          session.send(session.text('commands.pz.messages.ifreset'))
          const input: string = await session.prompt()
          if (input.toUpperCase() == 'Y') {
            delete this.globalTasks[session.channelId]
            session.send(session.text('commands.pz.messages.newgame'))
          }
        }
        this.players.push(session.userId)
        return await this.puzzle(session, '', mode)
      })
    ctx.command('pz.def <prompt:text>', '自定义puzzle')       //自定义画puzzle
      .option('size', '-s <size:number>', { fallback: config.size })
      .action(({ session, options }, prompt) => {
        if (!prompt) {
          return session.send(session.text('commands.pz.messages.nodata'))
        }
        session = session
        return this.def(session, prompt)
      })
  }
  async puzzle(session: Session, prompt: string, mode?: number) {
    if (Object.keys(this.globalTasks).includes(session.channelId)) {
      const game_info = await this.game(session, prompt) //更新游戏进度
      if (this.done) {
        delete this.globalTasks[session.channelId]
        this.done = false
      }
      session.send(game_info)
      return await this.draw_img()
    } else {
      // return this.game_img
      if (this.config.maxConcurrency) {
        if (Object.keys(this.globalTasks).length >= this.config.maxConcurrency) {
          return session.text('commands.pz.messages.concurrent-jobs')
        } else {
          const new_klotsk: Klotsk = new Klotsk(mode)
          this.globalTasks[session.channelId] = new_klotsk
          const game_info = await this.game(session, '')
          session.send(game_info)
          return await this.draw_img()
        }
      }
    }

  }
  quickSort(arr: Pz.Rankls[]) {
    //基础结束条件：数组长度为1时，不用再作比较，直接返回
    if (arr.length < 2) return arr
    let pivot = arr[0].score //基准值
    let left = []
    let right = []
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].score > pivot) {
        left.push(arr[i])
      } else {
        right.push(arr[i])
      }
    }
    return this.quickSort(left).concat([arr[0]]).concat(this.quickSort(right))
  }
  async game(session: Session, prompt: string) {
    let game_info: string = '' //游戏逻辑
    const ktk = this.globalTasks[session.channelId]
    const upper_str: string = prompt.toUpperCase()
    const str_list: string[] = upper_str.split('')
    let op_str: string = ''
    str_list.forEach((i) => {
      if (drctn_list.includes(i)) {
        op_str += i
      }
    })
    this.game_data = [].concat(ktk.klotsk)

    if (ktk.move_sqnc(op_str)) {
      await this.add_score(session, ktk.mode)
      game_info = session.text('commands.pz.messages.done', [h.at(session.userId), ktk.duration()])
      this.done = true
    } else {
      game_info = session.text('commands.pz.messages.info', [op_str, ktk.duration()])
    }
    return game_info
  }
  async draw_img(data: number[][] = this.game_data) {
    const img = await renderX(this.ctx, data)
    return h.image(img, 'image/png')
  }
  async add_score(session: Session, mode: number) {
    const pass_score: Pz.Rankls[] = await this.ctx.database.get('puzzle', {
      mode: [mode],
      uid: [session.userId]
    }, ["uid", "score"])
    if (pass_score.length == 0) {
      await this.ctx.database.create('puzzle', { gid: session.channelId, uid: session.userId, mode: mode, score: 1 })
    } else {
      await this.ctx.database.set('puzzle', {
        mode: [mode],
        uid: [session.userId]
      }, { score: (pass_score[0]["score"] + 1) })
    }
  }
  replace_n(s: string) {
    if (s.indexOf('\n') == -1) {
      return s
    } else {
      var ss: string = s.replace('\n', ' ')
      return this.replace_n(ss)
    }

  }
  async get_rank(session: Session, mode: number) {
    const rank_arr: Pz.Rankls[] = await this.ctx.database.get('puzzle', { mode: [mode] }, ["uid", "score"])
    if (rank_arr.length < 1) {
      return session.text('commands.pz.messages.no-rank', [mode])
    }
    const sorted_arr: Pz.Rankls[] = this.quickSort(rank_arr)
    let rank_div = `${mode}x${mode}排行榜\n`
    for (var itm of sorted_arr) {
      rank_div += `${itm.uid}:${itm.score}\n`
    }
    return rank_div
  }


  stop(session: Session) {
    if (Object.keys(this.globalTasks).includes(session.channelId)) {
      delete this.globalTasks[session.channelId]
      return session.text('commands.pz.messages.gameover')
    } else {
      return session.text('commands.pz.messages.notFound')
    }
  }

  async def(session: Session, prompt: string) {
    const filt_data: string = this.replace_n(prompt)
    const filt_arr: string[] = filt_data.split(' ')
    const def_mode: number = Math.sqrt(filt_arr.length)
    if (def_mode > 5) {
      return session.text('commands.pz.messages.bad-mode')
    }
    const def_koi: number[][] = []
    var count: number = 0
    for (let i = 0; i < def_mode; i++) {                          // 生成数组
      var temp = []
      for (let j = 0; j < def_mode; j++) {
        temp.push(parseInt(filt_arr[count]))
        count++
      }
      def_koi.push(temp)
    }

    return await this.draw_img(def_koi)
  }


}
namespace Pz {
  export const usage = `
## 注意事项
> 原游戏 <a href="http://tapsss.com">扫雷联萌</a>
本插件仅供学习参考，请勿用于商业行为
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-puzzle 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`
  export interface Rankls {
    uid: string
    score: number
  }
  export interface Puzzle {
    id: number
    gid: string
    uid: string
    mode: number
    score: number
  }

  export interface Config {
    mode: number
    size: number
    colorForSerialNum: string
    maxConcurrency: number
  }

  export const Config: Schema<Config> = Schema.object({
    mode: Schema.union([
      Schema.const(5 as number).description('24p'),
      Schema.const(4 as number).description('15p'),
      Schema.const(3 as number).description('8p'),
    ]).default(4 as number).description('默认的游戏模式'),
    colorForSerialNum: Schema.string().default("#000000FF").description('数字颜色'),
    maxConcurrency: Schema.number().default(50).description('最大存在游戏局数'),
    size: Schema.number().default(50).description('图片大小')
  })
}
export default Pz