import { Context, Dict, Schema, Session, Element, Logger, h } from 'koishi'
import { Klotsk } from './puzzle'
import { setTheme, renderX } from './render'
export const name: string = 'puzzle'
export const logger = new Logger(name)

export const theme = [['#FFFFFF', '#707070', '#707070', '#707070', '#707070',],
['#707070', '#444444', '#00C91A', '#00C91A', '#00C91A',],
['#00C91A', '#444444', '#008314', '#006FFF', '#006FFF',],
['#006FFF', '#444444', '#008314', '#001EE1', '#FF0000',],
['#FF0000', '#444444', '#008314', '#001EE1', '#BB0000',]]
export const drctn_list: string[] = ['U', 'D', 'L', 'R']

declare module 'koishi' {
  interface Tables {
    puzzle: Pz.Puzzle
  }
}


class Pz {
  session: Session
  options: Dict
  prompt: string
  mode: number
  globalTasks: Dict
  game_info: string
  game_data: number[][]
  game_img: Element[] | Element
  game_img_size: number
  wait: number
  players: string[]
  done: boolean
  constructor(private ctx: Context, private config: Pz.Config) {
    this.globalTasks = {}
    this.mode = config.mode
    this.players = []
    this.done = false
    setTheme(config)
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
      this.session = session
      this.game_img_size = config.size
      this.prompt = session.content ? session.content : ''
      if (!Object.keys(this.globalTasks).includes(this.session.channelId)) {
        return next()
      }
      return await this.puzzle()
    })
    ctx.command('pz.stop', '结束puzzle').alias('结束华容道').action(({ session }) => {
      this.session = session
      return this.stop()
    })

    ctx.command('pz.join', '加入puzzle').alias('加入pz').action(({ session }) => {
      this.players.push(session.userId)
    })

    ctx.command('pz.quit', '退出puzzle').alias('退出pz').action(({ session }) => {
      const index: number = this.players.indexOf(session.userId)
      if (index == -1) {
        return session.text('commands.pz.messages.not-player')
      } else {
        this.players.splice(index)
        return session.text('commands.pz.messages.quit')
      }
    })

    ctx.command('pz.rank <prompt:number>', '查看puzzle排行榜').alias('华容排行榜')
      .action(({ session }, prompt) => {
        this.session = session
        return this.get_rank(prompt ? prompt : config.mode)
      })


    ctx.command('pz <prompt:string>', '开始puzzle')
      .alias('puzzle')
      .option('mode', '-m <mode:number>', { fallback: config.mode })
      .option('size', '-s <size:number>', { fallback: config.size })
      .action(async ({ session, options }, prompt) => {
        if (options.mode > 5) {
          return this.session.text('commands.pz.messages.bad-mode')
        }
        if (Object.keys(this.globalTasks).indexOf(session.channelId) !== -1) {
          session.send(session.text('commands.pz.messages.ifreset'))
          const input: string = await session.prompt()
          if (input.toUpperCase() == 'Y') {
            delete this.globalTasks[session.channelId]
            session.send(session.text('commands.pz.messages.newgame'))
          }
        }
        this.mode = options.mode
        this.players.push(session.userId)
        this.game_img_size = options.size
        this.session = session
        this.prompt = ''
        return await this.puzzle(options)
      })
    ctx.command('pz.def <prompt:text>', '自定义puzzle')       //自定义画puzzle
      .option('size', '-s <size:number>', { fallback: config.size })
      .action(({ session, options }, prompt) => {
        if (!prompt) {
          return session.send(session.text('commands.pz.messages.nodata'))
        }
        this.session = session
        this.prompt = prompt
        return this.def(options)
      })
  }
  async puzzle(options: Dict = {}) {
    await this.add_score()
    const pass_score: Pz.Rankls[] = await this.ctx.database.get('puzzle', { mode: [4] }, ["uid", "score"])
    if (Object.keys(this.globalTasks).includes(this.session.channelId)) {
      await this.game() //更新游戏进度
      this.draw_img() //更新游戏图片
      const rec_klotsk: Klotsk = this.globalTasks[this.session.channelId]
      if (this.done) {
        delete this.globalTasks[this.session.channelId]
        this.done = false
      }
      this.session.send(this.game_info)
      return this.game_img
    } else {
      // return this.game_img

      if (this.config.maxConcurrency) {
        if (Object.keys(this.globalTasks).length >= this.config.maxConcurrency) {
          return this.session.text('commands.pz.messages.concurrent-jobs')
        } else {
          const new_klotsk: Klotsk = new Klotsk(options.mode ? options.mode : 5)
          this.globalTasks[this.session.channelId] = new_klotsk
          await this.game()
          this.draw_img()
          this.session.send(this.game_info)
          return this.game_img
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
  async game() {     //游戏逻辑
    const ktk = this.globalTasks[this.session.channelId]
    const upper_str: string = this.prompt.toUpperCase()
    const str_list: string[] = upper_str.split('')
    let op_str: string = ''
    str_list.forEach((i) => {
      if (drctn_list.includes(i)) {
        op_str += i
      }
    })
    this.game_data = [].concat(ktk.klotsk)

    if (ktk.move_sqnc(op_str)) {
      await this.add_score()
      this.game_info = this.session.text('commands.pz.messages.done', [op_str, ktk.duration()])
      this.done = true
    } else {
      this.game_info = this.session.text('commands.pz.messages.info', [op_str, ktk.duration()])
    }
  }
  async draw_img(data: number[][] = this.game_data, type: number = 1) {
    const mode = this.game_data.length
    const img = renderX(data)
    return this.game_img = h.image(img, 'image/png')
  }
  find_color(num: number, mode: number) {
    const y = num % mode
    const x = Math.floor(num / mode)
    return theme[x][y]

  }
  async add_score() {
    const pass_score: Pz.Rankls[] = await this.ctx.database.get('puzzle', {
      mode: [this.mode],
      uid: [this.session.userId]
    }, ["uid", "score"])
    if (pass_score.length == 0) {
      await this.ctx.database.create('puzzle', { gid: this.session.channelId, uid: this.session.userId, mode: this.mode, score: 1 })
    } else {
      await this.ctx.database.set('puzzle', {
        mode: [this.mode],
        uid: [this.session.userId]
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
  async get_rank(mode: number) {
    const rank_arr: Pz.Rankls[] = await this.ctx.database.get('puzzle', { mode: [mode] }, ["uid", "score"])
    if (rank_arr.length < 1) {
      return this.session.text('commands.pz.messages.no-rank', [mode])
    }
    const sorted_arr: Pz.Rankls[] = this.quickSort(rank_arr)
    let rank_div = `${mode}x${mode}排行榜\n`
    for (var itm of sorted_arr) {
      rank_div += `${itm.uid}:${itm.score}\n`
    }
    return rank_div
  }


  stop() {
    if (Object.keys(this.globalTasks).includes(this.session.channelId)) {
      delete this.globalTasks[this.session.channelId]
      return this.session.text('commands.pz.messages.gameover')
    } else {
      return this.session.text('commands.pz.messages.notFound')
    }
  }

  def(options: Dict) {
    const filt_data: string = this.replace_n(this.prompt)
    const filt_arr: string[] = filt_data.split(' ')
    const def_mode: number = Math.sqrt(filt_arr.length)
    if (def_mode > 5) {
      return this.session.text('commands.pz.messages.bad-mode')
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
    this.draw_img(def_koi, 2)
    return this.game_img
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