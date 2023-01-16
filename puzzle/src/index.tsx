import { Context, Schema } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { Klotsk } from './puzzle'
export const name = 'puzzle'

declare module 'koishi' {
  interface Tables {
    puzzle: Puzzle
  }
}

export interface Puzzle {
  id: number
  gid: string
  uid: string
  mode: number
  score: number
}



export interface Config {
  maxConcurrency: number
  size: number
}
export const log = console.log
export const Config: Schema<Config> = Schema.object({
  maxConcurrency: Schema.number().default(3).description('最大排队数'),
  size: Schema.number().default(50).description('图片大小')
})
export const theme = [['#707070', '#707070', '#707070', '#707070', '#707070'],
['#444444', '#00C91A', '#00C91A', '#00C91A', '#00C91A'],
['#444444', '#008314', '#006FFF', '#006FFF', '#006FFF'],
['#444444', '#008314', '#001EE1', '#FF0000', '#FF0000'],
['#444444', '#008314', '#001EE1', '#BB0000', '#ED9512']]

export const find_color = (num: number, mode: number) => {
  var cr_num: number = 0
  for (let i = 0; i < mode; i++) {                          // 生成数组
    for (let j = 0; j < mode; j++) {
      if (num == cr_num) {
        return theme[i][j]
      }
      cr_num++
    }
  }
}

export const replace_n = (s: string) => {
  if (s.indexOf('\n') == -1) {
    return s
  } else {
    var ss: string = s.replace('\n', ' ')
    return replace_n(ss)
  }

}
const globalTasks: object = {}
const drctn_list: string[] = ['U', 'D', 'L', 'R']
// const trsn_dist: object = {'U':'L', 'D':'R', 'L':'U', 'R':'D'} 



export const game = async (gid: string, opration: string, uid: string, ctx: Context) => {     //游戏逻辑
  const ktk = globalTasks[gid]
  const upper_str: string = opration.toUpperCase()
  const str_list: string[] = upper_str.split('')
  let op_str: string = ''
  str_list.forEach((i) => {
    if (drctn_list.includes(i)) {
      op_str += i
    }
  })
  const ststus = ktk.move_sqnc(op_str)
  if (ststus) {
    const game_msg: string = `已还原,执行操作${op_str},\n用时${ktk.duration()}`
    await add_scroe(ctx, gid, uid, ktk.mode)
    const game_data: number[][] = [].concat(ktk.klotsk)
    delete globalTasks[gid]
    return [game_msg, game_data]
  } else {
    return [`执行操作${op_str},\n用时${ktk.duration()}`, ktk.klotsk]
  }
}


export const add_scroe = async (ctx: Context, gid: string, uid: string, mode: number) => {
  const pass_score: any[] = await ctx.database.get('puzzle', ["id", "score"])
  if (pass_score.length = 0) {
    await ctx.database.create('puzzle', { gid: gid, uid: uid, mode: mode, score: 1 })
  } else {
    await ctx.database.set('puzzle', [pass_score[0]["id"]], { score: pass_score[0]["score"] + 1 })
  }
}
export function quickSort(arr: Puzzle[]) {
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
  return quickSort(left).concat([arr[0]]).concat(quickSort(right))
}


export const draw_img = (ctx: Context, data: number[][], size: number, msg: string) => {
  if (ctx.puppeteer) {
    const style_arr: any[] = []
    const ofs: number = 8
    for (let i = 0; i < data.length; i++) {                          // 生成数组
      for (let j = 0; j < data.length; j++) {
        var style_str: string = `position: absolute;font-size: ${size / 1.7}px;text-align: center;width: ${size}px;height: ${size}px;left: ${j * size + ofs}px;top: ${i * size + ofs}px;background: ${find_color(data[i][j], data.length)}`
        style_arr.push([style_str, data[i][j]])
      }
    }

    const res: any[] = style_arr.map((style) =>
      <div style={style[0]}>{style[1]}</div>
    )
    res.push(<p style={`position: absolute;text-align: center;font-size: ${size / 3}px;width: ${size * data.length}px;height: ${size / 4}px;left: ${ofs}px;top: ${data.length * size + ofs}px`}>{msg}</p>)
    return res
  } else {
    var msg_str = ''
    for (let i = 0; i < data.length; i++) {                          //未安装ppt时
      for (let j = 0; j < data.length; j++) {
        msg_str += data[i][j] + ' '
      }
      msg_str += '\n'
    }
    msg_str += msg
    return <p>{msg_str}</p>
  }
}

export function apply(ctx: Context, config: Config) {

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
  ctx.command('def <prompt:text>')       //自定义画puzzle
    .option('size', '-s <size:number>')
    .action(({ session, options }, prompt) => {
      const size: number = options.size ? options.size : config.size
      if (prompt) {
        const def_data: string = prompt
        const filt_data: string = replace_n(def_data)
        const filt_arr: string[] = filt_data.split(' ')
        const def_mode: number = Math.sqrt(filt_arr.length)
        if (def_mode > 5) {
          return session.text('.bad-mode')
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
        const game_img = draw_img(ctx, def_koi, size, prompt.slice(0, 12) + '\n' + prompt.slice(12, -1))
        return <html>
          <div style={{
            width: def_mode * size + 'px',
            height: def_mode * size + 100 + 'px',
            background: 'transparent',
          }}></div>
          {game_img}
        </html>
      }
    })
  ctx.command('puzzle <prompt:string>')
    .alias('pz')
    .option('mode', '-m <mode:number>')
    .option('opt', '-o <opt:string>')
    .option('size', '-s <size:number>')
    .option('rank', '-r <rank:number>')
    .action(async ({ session, options }, prompt) => {
      const gid: string = session.channelId
      const uid: string = session.userId
      if (options.rank) {
        const rank_arr: any[] = await ctx.database.get('puzzle', { mode: [options.rank] }, ["uid", "score"])
        const sorted_arr: Puzzle = quickSort(rank_arr)
        const rank_div: any[] = []
        for (var i in sorted_arr) {
          var itm: Puzzle = sorted_arr[i]
          rank_div.push(<div style="font-size:40px;width:200px;height:50px">{`${itm.uid}:${itm.score}`}</div>)
        }
        rank_div.push(<div style="font-size:20px;width:200px;height:50px">----------------------</div>)
        rank_div.push(<div style="font-size:20px;width:200px;height:50px">{`${options.rank}x${options.rank}排行榜`}</div>)
        return <html>
          <div style={{
            width: 200 + 'px',
            height: (rank_arr.length + 1) * 50 + 30 + 'px',
            background: "transparent",
          }}></div>
          {rank_div}
        </html>
      }

      if (options.mode > 5) {
        return session.text('.bad-mode')
      }
      if (options.opt == 'stop') {
        if (Object.keys(globalTasks).includes(gid)) {
          delete globalTasks[gid]
          return session.text('.gameover')
        } else {
          return session.text('.notFound')
        }
      }
      if (Object.keys(globalTasks).includes(gid)) {
        const game_info = await game(gid, prompt ? prompt : '', uid, ctx)
        const game_img = draw_img(ctx, game_info[1], options.size ? options.size : config.size, game_info[0])
        var rec_klotsk = globalTasks[gid]
        return <html>
          <div style={{
            width: rec_klotsk.mode * config.size + 'px',
            height: rec_klotsk.mode * config.size + 60 + 'px',
            background: 'transparent',
          }}></div>
          {game_img}
        </html>
      } else {
        if (config.maxConcurrency) {
          if (Object.keys(globalTasks).length >= config.maxConcurrency) {
            return session.text('.concurrent-jobs')
          } else {
            const new_klotsk = new Klotsk(options.mode ? options.mode : 5)
            globalTasks[gid] = new_klotsk
            const game_info = await game(gid, prompt ? prompt : '', uid, ctx)
            const game_img = draw_img(ctx, game_info[1], options.size ? options.size : config.size, game_info[0])
            return <html>
              <div style={{
                width: new_klotsk.mode * config.size + 'px',
                height: new_klotsk.mode * config.size + 60 + 'px',
                background: "transparent",
              }}></div>
              {game_img}
            </html>
          }
        }
      }
    })
}
