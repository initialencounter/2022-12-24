import { Context, Schema, Logger, Session, h, Element } from 'koishi'
import { CubeCore, Cube } from './cube'
import { resolve } from 'path'
import { readFileSync } from 'fs'
export const name: string = 'cube'
export const logger = new Logger(name)


declare module 'koishi' {
  interface Tables {
    cube_score: CubeScore
  }
}

export interface CubeScore {
  uid: string
  gid: string
  score: number
}
export function quickSort(arr: CubeScore[]) {
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
class CubeActivity {
  static inject = {
    required: ["database"],
  }
  cube_dict: {
    [key: string]: CubeCore
  }
  key_fix: number
  constructor(private ctx: Context, private config: CubeActivity.Config) {
    this.key_fix = config.key ? config.key : Math.random() * 9999
    this.cube_dict = {}
    ctx.model.extend('cube_score', {
      uid: 'string',
      gid: 'string',
      score: 'integer(5)' //限制长度为 5 位，节省内存空间
    }, {
      primary: 'uid', //设置 uid 为主键
      unique: ['uid'], //设置 uid 为唯一键
    })
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.before('attach-user', async (session, fields) => {
      fields.add('authority')
      fields.add('id')
    })

    ctx.command('cube <prompt:text>', '三阶魔方')
      .alias('cb', '魔方')
      .action(async ({ session }, prompt) => this.main_proc(session, prompt))

    ctx.command('cube.rank', '魔方排行榜').alias('cb.rank')
      .action(async () => this.get_rank())

    ctx.command('cube.undo', '撤回魔方操作').alias('cb.undo')
      .action(async ({ session }) => this.undo(session))

    ctx.command('cube.def', '自定义魔方').alias('cb.def')
      .action(async ({ session }, prompt) => this.def(session, prompt))

    ctx.command('cube.bind <key:number>', '走后门').alias('cb.bind')
      .action(async ({ session }, key) => this.bind(session, key))

  }
  bind(session: Session, key: number) {
    if (key == this.key_fix) {
      const session3: Session<"authority"> = session as Session<"authority">
      session3.user.authority = 5
      this.key_fix = Math.random() * 999
      return '交易成功'
    } else {
      return '请先与管理员进行py交易'
    }
  }
  async def(session: Session, prompt: string): Promise<string | Element> {
    const gid: string = session.channelId
    const cube_key: string[] = Object.keys(this.cube_dict)
    if (cube_key.includes(gid)) {
      session.send(session.text('commands.cube.messages.ifreset'))
      const input: string = await session.prompt()
      if (input.toUpperCase() == 'Y') {
        session.send(session.text('自定义成功'))
      } else {
        return '取消'
      }
    }
    // @ts-ignore
    const cube: CubeCore = new Cube()
    if (prompt) {
      cube.rotate(prompt)
    }
    this.cube_dict[gid] = cube
    let base64: string = cube.getSvgBase64Png()
    return h.image(base64)

  }
  async undo(session: Session) {
    const gid: string = session.channelId
    const cube_key: string[] = Object.keys(this.cube_dict)
    if (!cube_key.includes(gid)) {
      return '不存在cube'
    }
    const cube: CubeCore = this.cube_dict[gid]
    let last_op: string = cube.getLastStep()
    if (last_op == "") {
      return '暂无操作'
    }
    cube.rotate(this.do_reverse(last_op))
    let text: string = '已撤销操作：' + last_op
    session.send(text)
    let base64: string = cube.getSvgBase64Png()
    return h.image(base64)

  }
  do_reverse(text: string): string {
    let res = ''
    for (let i = text.length - 1; i >= 0; i--) {
      let char = text[i]
      if (char === char.toUpperCase()) {
        char = char.toLowerCase();
      } else {
        char = char.toUpperCase();
      }
      res += char
    }
    return res
  }
  async get_rank(): Promise<Element> {
    const rank_arr: any[] = await this.ctx.database.get('cube_score', {})
    const sorted_arr: CubeScore = quickSort(rank_arr)
    let rank_div = ''
    rank_div += "最早通关玩家\n"
    rank_div += "1.Riley\n"
    rank_div += "2.疏棂\n"
    rank_div += "3.Transformation\n"
    rank_div += "----------------------\n"
    rank_div += "魔方排行榜\n"
    for (var i in sorted_arr) {
      var itm: CubeScore = sorted_arr[i]
      rank_div += `${itm.uid}:${itm.score}`
    }
    return h.text(rank_div)
  }

  async main_proc(session: Session, prompt: string) {
    const gid: string = session.channelId
    const cube_key: string[] = Object.keys(this.cube_dict)
    if (!cube_key.includes(gid)) {
      // @ts-ignore
      const cube: CubeCore = new Cube()
      cube.scramble(1000)
      this.cube_dict[gid] = cube
      let base64: string = cube.getSvgBase64Png()
      return h.image(base64)
    }
    const cube: CubeCore = this.cube_dict[gid]
    let text: string = prompt
    if (prompt) {
      cube.rotate(prompt)
      if (cube.isSolved()) {
        await this.add_score(session.userId, gid)
        delete this.cube_dict[gid]
        text = session.text('commands.cube.messages.game-done')
      }
    }
    session.send(text)
    let base64: string = cube.getSvgBase64Png()
    return h.image(base64)
  }
  async add_score(uid: string, gid: string) {

    const pass_score: any[] = await this.ctx.database.get('cube_score', [uid], ["uid", "score"])
    if (pass_score.length === 0) {
      await this.ctx.database.create('cube_score', { uid: uid, gid: gid, score: 1 })
    } else {
      await this.ctx.database.set('cube_score', [uid], { score: pass_score[0]["score"] + 1 })
    }
  }
}
namespace CubeActivity {
  export const usage = `${readFileSync(resolve(__dirname, "../readme.md")).toString('utf-8')}`
  export interface Config {
    mark_str: string
    key: number
  }
  export const Config: Schema<Config> = Schema.object({
    mark_str: Schema.string().default('”').description('反向拧的标记字符'),
    key: Schema.number().description('走后门的钥匙')
  })

}

export default CubeActivity
