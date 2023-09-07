import { Context, Schema, Logger, Session, Dict, Element } from 'koishi'

import { } from 'koishi-plugin-puppeteer'
import { Cube } from './cube'
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
  cube_dict: Dict
  color: Dict
  mix_list: string[]
  operation: string
  reg_list: string[]
  key_fix: number
  constructor(private ctx: Context, private config: CubeActivity.Config) {
    this.key_fix = config.key ? config.key : Math.random() * 9999
    this.cube_dict = {}
    this.color = { 1: 'red', 3: 'yellow', 6: 'white', 5: 'green', 4: 'orange', 2: 'blue' }
    this.mix_list = ['U', 'U_', 'D', 'D_', 'R', 'R_', 'L', 'L_', 'F', 'F_', 'B', 'B_']
    this.reg_list = ['U', 'D', 'R', 'L', 'F', 'B']
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

    ctx.command('cube.back', '撤回魔方操作').alias('cb.back')
      .action(async ({ session }) => this.back(session))

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
    }else{
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
    const cube: Cube = new Cube()
    if (prompt) {
      const opration: string[] = this.split_input(prompt)
      cube.re_do(opration)
    }
    this.cube_dict[gid] = cube
    return <html>
      {this.draw_cube(cube)}
    </html>

  }
  async back(session: Session) {
    const gid: string = session.channelId
    const cube_key: string[] = Object.keys(this.cube_dict)
    if (!cube_key.includes(gid)) {
      return '不存在cube'
    }
    if (this.operation.length < 1) {
      return '暂无操作'
    }
    const cube = this.cube_dict[gid]
    const opration: string[] = this.do_reverse(this.operation)
    cube.re_do(opration)
    let text: string = '已撤销操作：'
    for (var i of opration) {
      text += i.replace('_', this.config.mark_str)
    }
    return <html>
      <div>{text}</div>
      {this.draw_cube(cube)}
    </html>

  }
  do_reverse(text: string): string[] {
    const res: string[] = []
    const raw_res: string[] = this.split_input(text)
    for (var i of raw_res) {
      if (this.reg_list.includes(i)) {
        res.push(i + '_')
      } else {
        res.push(i.slice(0, 1))
      }
    }
    return res.reverse();
  }
  split_input(text: string): string[] {
    const res: string[] = []
    const text_to_list: string[] = (text.toUpperCase()).split('').concat([])
    text_to_list.push('U')
    for (var op_num: number = 0; op_num < text_to_list.length; op_num++) {
      if (this.reg_list.indexOf(text_to_list[op_num]) == -1) {
        continue
      }
      if (this.reg_list.indexOf(text_to_list[op_num + 1]) == -1) {
        res.push(text_to_list[op_num] + '_')
      }
      else {
        res.push(text_to_list[op_num])
      }
    }

    logger.info(res)
    return res.slice(0, res.length - 1)
  }
  async get_rank(): Promise<Element> {
    const rank_arr: any[] = await this.ctx.database.get('cube_score', {})
    const sorted_arr: CubeScore = quickSort(rank_arr)
    const rank_div: any[] = []
    rank_div.push(<div style="font-size:20px;width:200px;height:40px">最早通关玩家</div>)
    rank_div.push(<div style="font-size:10px;width:200px;height:10px">1.Riley</div>)
    rank_div.push(<div style="font-size:10px;width:200px;height:10px">2.疏棂</div>)
    rank_div.push(<div style="font-size:10px;width:200px;height:10px">3.Transformation</div>)
    rank_div.push(<div style="font-size:20px;width:200px;height:30px">----------------------</div>)
    rank_div.push(<div style="font-size:20px;width:200px;height:30px">魔方排行榜</div>)
    for (var i in sorted_arr) {
      var itm: CubeScore = sorted_arr[i]
      rank_div.push(<div style="font-size:10px;width:200px;height:20px">{`${itm.uid}:${itm.score}`}</div>)
    }
    return <html>
      <div style={{
        width: 200 + 'px',
        height: (rank_arr.length + 1) * 50 + 30 + 'px',
        background: "transparent",
      }}></div>
      {rank_div}
    </html>
  }

  async main_proc(session: Session, prompt: string) {
    this.operation = prompt
    const gid: string = session.channelId
    const cube_key: string[] = Object.keys(this.cube_dict)
    if (!cube_key.includes(gid)) {
      const cube: Cube = new Cube()
      const process: string[] = []
      let process_str: string = ''
      for (var j = 0; j < 50; j++) {
        const randint = Math.floor((Math.random() * 11))
        process_str += this.mix_list[randint].replace('_', this.config.mark_str)
        process.push(this.mix_list[randint])
      }
      cube.re_do(process)
      this.cube_dict[gid] = cube
      session.send(`打乱步骤：${process_str}`)
      return <html>
        {this.draw_cube(cube)}
      </html>
    }
    const cube = this.cube_dict[gid]
    let text: string = ''
    if (prompt) {
      const opration: string[] = this.split_input(prompt)
      const opration_res = cube.re_do(opration)
      for (var i of opration) {
        text += i.replace('_', this.config.mark_str)
      }
      if (opration_res) {
        await this.add_scroe(session.userId, gid)
        delete this.cube_dict[gid]
        text = session.text('commands.cube.messages.game-done')
      }
    }
    return <html>
      <div>{text}</div>
      {this.draw_cube(cube)}
    </html>
  }
  async add_scroe(uid: string, gid: string) {

    const pass_score: any[] = await this.ctx.database.get('cube_score', [uid], ["uid", "score"])
    if (pass_score.length === 0) {
      await this.ctx.database.create('cube_score', { uid: uid, gid: gid, score: 1 })
    } else {
      await this.ctx.database.set('cube_score', [uid], { score: pass_score[0]["score"] + 1 })
    }
  }
  draw_cube(cube: Cube) {
    const color = this.color
    return <svg id="图层_1" data-name="图层 1" xmlns="http://www.w3.org/2000/svg">
      <rect class="cls-l10" x="0.25" y="59.25" width="12.39" height="12.49" fill={color[cube.left[1][0]]} />
      <path d="M12.39,63.5v12H.5v-12H12.39m.5-.5H0V76H12.89V63Z" transform="translate(0 -4)" />
      <rect class="cls-l00" x="0.25" y="44.96" width="12.39" height="12.49" fill={color[cube.left[0][0]]} />
      <path d="M12.39,49.21v12H.5v-12H12.39m.5-.5H0v13H12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-l20" x="0.25" y="73.54" width="12.39" height="12.49" fill={color[cube.left[2][0]]} />
      <path d="M12.39,77.79v12H.5v-12H12.39m.5-.5H0v13H12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-l01" x="14.43" y="44.96" width="12.39" height="12.49" fill={color[cube.left[0][1]]} />
      <path d="M26.57,49.21v12H14.68v-12H26.57m.5-.5H14.18v13H27.07v-13Z" transform="translate(0 -4)" />
      <rect class="cls-l11" x="14.43" y="59.25" width="12.39" height="12.49" fill={color[cube.left[1][1]]} />
      <path d="M26.57,63.5v12H14.68v-12H26.57m.5-.5H14.18V76H27.07V63Z" transform="translate(0 -4)" />
      <rect class="cls-l21" x="14.43" y="73.54" width="12.39" height="12.49" fill={color[cube.left[2][1]]} />
      <path d="M26.57,77.79v12H14.68v-12H26.57m.5-.5H14.18v13H27.07v-13Z" transform="translate(0 -4)" />
      <rect class="cls-l02" x="28.61" y="44.96" width="12.39" height="12.49" fill={color[cube.left[0][2]]} />
      <path d="M40.75,49.21v12H28.86v-12H40.75m.5-.5H28.36v13H41.25v-13Z" transform="translate(0 -4)" />
      <rect class="cls-l12" x="28.61" y="59.25" width="12.39" height="12.49" fill={color[cube.left[1][2]]} />
      <path d="M40.75,63.5v12H28.86v-12H40.75m.5-.5H28.36V76H41.25V63Z" transform="translate(0 -4)" />
      <rect class="cls-l22" x="28.61" y="73.54" width="12.39" height="12.49" fill={color[cube.left[2][2]]} />
      <path d="M40.75,77.79v12H28.86v-12H40.75m.5-.5H28.36v13H41.25v-13Z" transform="translate(0 -4)" />

      <rect class="cls-1" x="44.58" y="59.25" width="12.39" height="12.49" fill={color[cube.face[1][0]]} />
      <path d="M56.72,63.5v12H44.83v-12H56.72m.5-.5H44.33V76H57.22V63Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="44.58" y="44.96" width="12.39" height="12.49" fill={color[cube.face[0][0]]} />
      <path d="M56.72,49.21v12H44.83v-12H56.72m.5-.5H44.33v13H57.22v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="44.58" y="73.54" width="12.39" height="12.49" fill={color[cube.face[2][0]]} />
      <path d="M56.72,77.79v12H44.83v-12H56.72m.5-.5H44.33v13H57.22v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="44.96" width="12.39" height="12.49" fill={color[cube.face[0][1]]} />
      <path d="M70.9,49.21v12H59v-12H70.9m.5-.5H58.51v13H71.4v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="59.25" width="12.39" height="12.49" fill={color[cube.face[1][1]]} />
      <path d="M70.9,63.5v12H59v-12H70.9m.5-.5H58.51V76H71.4V63Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="73.54" width="12.39" height="12.49" fill={color[cube.face[2][1]]} />
      <path d="M70.9,77.79v12H59v-12H70.9m.5-.5H58.51v13H71.4v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="44.96" width="12.39" height="12.49" fill={color[cube.face[0][2]]} />
      <path d="M85.08,49.21v12H73.19v-12H85.08m.5-.5H72.69v13H85.58v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="59.25" width="12.39" height="12.49" fill={color[cube.face[1][2]]} />
      <path d="M85.08,63.5v12H73.19v-12H85.08m.5-.5H72.69V76H85.58V63Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="73.54" width="12.39" height="12.49" fill={color[cube.face[2][2]]} />
      <path d="M85.08,77.79v12H73.19v-12H85.08m.5-.5H72.69v13H85.58v-13Z" transform="translate(0 -4)" />

      <rect class="cls-1" x="44.58" y="14.54" width="12.39" height="12.49" fill={color[cube.up[1][0]]} />
      <path d="M56.72,18.79v12H44.83v-12H56.72m.5-.5H44.33v13H57.22v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="44.58" y="0.25" width="12.39" height="12.49" fill={color[cube.up[0][0]]} />
      <path d="M56.72,4.5v12H44.83V4.5H56.72m.5-.5H44.33V17H57.22V4Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="44.58" y="28.83" width="12.39" height="12.49" fill={color[cube.up[2][0]]} />
      <path d="M56.72,33.08v12H44.83v-12H56.72m.5-.5H44.33v13H57.22v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="0.25" width="12.39" height="12.49" fill={color[cube.up[0][1]]} />
      <path d="M70.9,4.5v12H59V4.5H70.9m.5-.5H58.51V17H71.4V4Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="14.54" width="12.39" height="12.49" fill={color[cube.up[1][1]]} />
      <path d="M70.9,18.79v12H59v-12H70.9m.5-.5H58.51v13H71.4v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="28.83" width="12.39" height="12.49" fill={color[cube.up[2][1]]} />
      <path d="M70.9,33.08v12H59v-12H70.9m.5-.5H58.51v13H71.4v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="0.25" width="12.39" height="12.49" fill={color[cube.up[0][2]]} />
      <path d="M85.08,4.5v12H73.19V4.5H85.08m.5-.5H72.69V17H85.58V4Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="14.54" width="12.39" height="12.49" fill={color[cube.up[1][2]]} />
      <path d="M85.08,18.79v12H73.19v-12H85.08m.5-.5H72.69v13H85.58v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="28.83" width="12.39" height="12.49" fill={color[cube.up[2][2]]} />
      <path d="M85.08,33.08v12H73.19v-12H85.08m.5-.5H72.69v13H85.58v-13Z" transform="translate(0 -4)" />

      <rect class="cls-1" x="44.58" y="103.97" width="12.39" height="12.49" fill={color[cube.down[1][0]]} />
      <path d="M56.72,108.22v12H44.83v-12H56.72m.5-.5H44.33v13H57.22v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="44.58" y="89.68" width="12.39" height="12.49" fill={color[cube.down[0][0]]} />
      <path d="M56.72,93.93v12H44.83v-12H56.72m.5-.5H44.33v13H57.22v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="44.58" y="118.26" width="12.39" height="12.49" fill={color[cube.down[2][0]]} />
      <path d="M56.72,122.51v12H44.83v-12H56.72m.5-.5H44.33v13H57.22V122Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="89.68" width="12.39" height="12.49" fill={color[cube.down[0][1]]} />
      <path d="M70.9,93.93v12H59v-12H70.9m.5-.5H58.51v13H71.4v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="103.97" width="12.39" height="12.49" fill={color[cube.down[1][1]]} />
      <path d="M70.9,108.22v12H59v-12H70.9m.5-.5H58.51v13H71.4v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="58.76" y="118.26" width="12.39" height="12.49" fill={color[cube.down[2][1]]} />
      <path d="M70.9,122.51v12H59v-12H70.9m.5-.5H58.51v13H71.4V122Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="89.68" width="12.39" height="12.49" fill={color[cube.down[0][2]]} />
      <path d="M85.08,93.93v12H73.19v-12H85.08m.5-.5H72.69v13H85.58v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="103.97" width="12.39" height="12.49" fill={color[cube.down[1][2]]} />
      <path d="M85.08,108.22v12H73.19v-12H85.08m.5-.5H72.69v13H85.58v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="72.94" y="118.26" width="12.39" height="12.49" fill={color[cube.down[2][2]]} />
      <path d="M85.08,122.51v12H73.19v-12H85.08m.5-.5H72.69v13H85.58V122Z" transform="translate(0 -4)" />

      <rect class="cls-r00" x="89.82" y="44.96" width="12.39" height="12.49" fill={color[cube.right[0][0]]} />
      <path d="M102,49.21v12H90.07v-12H102m.5-.5H89.57v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-r10" x="89.82" y="59.25" width="12.39" height="12.49" fill={color[cube.right[1][0]]} />
      <path d="M102,63.5v12H90.07v-12H102m.5-.5H89.57V76h12.89V63Z" transform="translate(0 -4)" />
      <rect class="cls-r20" x="89.82" y="73.54" width="12.39" height="12.49" fill={color[cube.right[2][0]]} />
      <path d="M102,77.79v12H90.07v-12H102m.5-.5H89.57v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-r01" x="104" y="44.96" width="12.39" height="12.49" fill={color[cube.right[0][1]]} />
      <path d="M116.14,49.21v12H104.25v-12h11.89m.5-.5H103.75v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-r11" x="104" y="59.25" width="12.39" height="12.49" fill={color[cube.right[1][1]]} />
      <path d="M116.14,63.5v12H104.25v-12h11.89m.5-.5H103.75V76h12.89V63Z" transform="translate(0 -4)" />
      <rect class="cls-r21" x="104" y="73.54" width="12.39" height="12.49" fill={color[cube.right[2][1]]} />
      <path d="M116.14,77.79v12H104.25v-12h11.89m.5-.5H103.75v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-r02" x="118.18" y="44.96" width="12.39" height="12.49" fill={color[cube.right[0][2]]} />
      <path d="M130.32,49.21v12H118.43v-12h11.89m.5-.5H117.93v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-r12" x="118.18" y="59.25" width="12.39" height="12.49" fill={color[cube.right[1][2]]} />
      <path d="M130.32,63.5v12H118.43v-12h11.89m.5-.5H117.93V76h12.89V63Z" transform="translate(0 -4)" />
      <rect class="cls-r22" x="118.18" y="73.54" width="12.39" height="12.49" fill={color[cube.right[2][2]]} />
      <path d="M130.32,77.79v12H118.43v-12h11.89m.5-.5H117.93v13h12.89v-13Z" transform="translate(0 -4)" />

      <rect class="cls-1" x="134.15" y="59.25" width="12.39" height="12.49" fill={color[cube.back[1][0]]} />
      <path d="M146.29,63.5v12H134.4v-12h11.89m.5-.5H133.9V76h12.89V63Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="134.15" y="44.96" width="12.39" height="12.49" fill={color[cube.back[0][0]]} />
      <path d="M146.29,49.21v12H134.4v-12h11.89m.5-.5H133.9v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="134.15" y="73.54" width="12.39" height="12.49" fill={color[cube.back[2][0]]} />
      <path d="M146.29,77.79v12H134.4v-12h11.89m.5-.5H133.9v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="148.33" y="44.96" width="12.39" height="12.49" fill={color[cube.back[0][1]]} />
      <path d="M160.47,49.21v12H148.58v-12h11.89m.5-.5H148.08v13H161v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="148.33" y="59.25" width="12.39" height="12.49" fill={color[cube.back[1][1]]} />
      <path d="M160.47,63.5v12H148.58v-12h11.89m.5-.5H148.08V76H161V63Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="148.33" y="73.54" width="12.39" height="12.49" fill={color[cube.back[2][1]]} />
      <path d="M160.47,77.79v12H148.58v-12h11.89m.5-.5H148.08v13H161v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="162.51" y="44.96" width="12.39" height="12.49" fill={color[cube.back[0][2]]} />
      <path d="M174.65,49.21v12H162.76v-12h11.89m.5-.5H162.26v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="162.51" y="59.25" width="12.39" height="12.49" fill={color[cube.back[1][2]]} />
      <path d="M174.65,63.5v12H162.76v-12h11.89m.5-.5H162.26V76h12.89V63Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="162.51" y="73.54" width="12.39" height="12.49" fill={color[cube.back[2][2]]} />
      <path d="M174.65,77.79v12H162.76v-12h11.89m.5-.5H162.26v13h12.89v-13Z" transform="translate(0 -4)" />

      <rect class="cls-1" x="178.15" y="58.25" width="12.39" height="12.49" fill={color[cube.face[1][0]]} />
      <path d="M190.29,62.5v12H178.4v-12h11.89m.5-.5H177.9V75h12.89V62Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="178.15" y="43.96" width="12.39" height="12.49" fill={color[cube.face[0][0]]} />
      <path d="M190.29,48.21v12H178.4v-12h11.89m.5-.5H177.9v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="178.15" y="72.54" width="12.39" height="12.49" fill={color[cube.face[2][0]]} />
      <path d="M190.29,76.79v12H178.4v-12h11.89m.5-.5H177.9v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="192.33" y="43.96" width="12.39" height="12.49" fill={color[cube.face[0][1]]} />
      <path d="M204.47,48.21v12H192.58v-12h11.89m.5-.5H192.08v13H205v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="192.33" y="58.25" width="12.39" height="12.49" fill={color[cube.face[1][1]]} />
      <path d="M204.47,62.5v12H192.58v-12h11.89m.5-.5H192.08V75H205V62Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="192.33" y="72.54" width="12.39" height="12.49" fill={color[cube.face[2][1]]} />
      <path d="M204.47,76.79v12H192.58v-12h11.89m.5-.5H192.08v13H205v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="206.51" y="43.96" width="12.39" height="12.49" fill={color[cube.face[0][2]]} />
      <path d="M218.65,48.21v12H206.76v-12h11.89m.5-.5H206.26v13h12.89v-13Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="206.51" y="58.25" width="12.39" height="12.49" fill={color[cube.face[1][2]]} />
      <path d="M218.65,62.5v12H206.76v-12h11.89m.5-.5H206.26V75h12.89V62Z" transform="translate(0 -4)" />
      <rect class="cls-1" x="206.51" y="72.54" width="12.39" height="12.49" fill={color[cube.face[2][2]]} />
      <path d="M218.65,76.79v12H206.76v-12h11.89m.5-.5H206.26v13h12.89v-13Z" transform="translate(0 -4)" />

      <polygon class="cls-1" points="187.22 33.23 194.14 25.62 206.23 25.62 199.31 33.23 187.22 33.23" fill={color[cube.up[1][0]]} />
      <path d="M205.67,29.87,199.2,37H187.79l6.46-7.11h11.42m1.13-.5H194l-7.37,8.11h12.77l7.37-8.11Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="195.33 24.3 202.25 16.68 214.34 16.68 207.43 24.3 195.33 24.3" fill={color[cube.up[0][0]]} />
      <path d="M202.36,20.93h11.42l-6.47,7.12H195.9l6.46-7.12m-.22-.5-7.37,8.12h12.77l7.37-8.12Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="179.11 42.17 186.03 34.55 198.12 34.55 191.21 42.17 179.11 42.17" fill={color[cube.up[2][0]]} />
      <path d="M197.56,38.8l-6.47,7.12H179.68l6.46-7.12h11.42m1.13-.5H185.92l-7.37,8.12h12.77l7.37-8.12Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="209.38 24.3 216.29 16.68 228.39 16.68 221.47 24.3 209.38 24.3" fill={color[cube.up[0][1]]} />
      <path d="M227.82,20.93l-6.46,7.12H209.94l6.47-7.12h11.41m1.13-.5H216.18l-7.37,8.12h12.77L229,20.43Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="201.27 33.23 208.19 25.62 220.28 25.62 213.36 33.23 201.27 33.23" fill={color[cube.up[1][1]]} />
      <path d="M219.71,29.87,213.25,37H201.83l6.47-7.11h11.41m1.13-.5H208.07l-7.37,8.11h12.77l7.37-8.11Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="193.16 42.17 200.08 34.55 212.17 34.55 205.25 42.17 193.16 42.17" fill={color[cube.up[2][1]]} />
      <path d="M211.61,38.8l-6.47,7.12H193.72l6.47-7.12h11.42m1.12-.5H200l-7.38,8.12h12.77l7.37-8.12Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="223.42 24.3 230.34 16.68 242.44 16.68 235.52 24.3 223.42 24.3" fill={color[cube.up[0][2]]} />
      <path d="M241.87,20.93l-6.46,7.12H224l6.46-7.12h11.42m1.13-.5H230.23l-7.37,8.12h12.77L243,20.43Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="215.31 33.23 222.23 25.62 234.33 25.62 227.41 33.23 215.31 33.23" fill={color[cube.up[1][2]]} />
      <path d="M222.34,29.87h11.42L227.3,37H215.88l6.46-7.11m-.22-.5-7.37,8.11h12.77l7.37-8.11Z"
        transform="translate(0 -4)" />
      <polygon class="cls-1" points="207.2 42.17 214.12 34.55 226.22 34.55 219.3 42.17 207.2 42.17" fill={color[cube.up[2][2]]} />
      <path d="M225.65,38.8l-6.46,7.12H207.77l6.46-7.12h11.42m1.13-.5H214l-7.37,8.12h12.77l7.37-8.12Z"
        transform="translate(0 -4)" />

      <polygon class="cls-r00" points="220.69 44.04 227.24 36.24 227.24 48.38 220.69 56.18 220.69 44.04" fill={color[cube.right[0][0]]} />
      <path d="M227,40.93V52.29l-6.05,7.21V48.13l6.05-7.2m.5-1.37L220.44,48V60.87l7.05-8.4V39.56Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r01" points="228.45 34.81 235 27.01 235 39.15 228.45 46.95 228.45 34.81" fill={color[cube.right[0][1]]} />
      <path d="M234.75,31.69V43.05l-6.05,7.21V38.9l6.05-7.21m.5-1.37-7.05,8.4V51.63l7.05-8.39V30.32Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r02" points="236.2 25.57 242.75 17.77 242.75 29.91 236.2 37.71 236.2 25.57" fill={color[cube.right[0][2]]} />
      <path d="M242.5,22.46V33.82L236.45,41V29.66l6.05-7.2m.5-1.38L236,29.48V42.4L243,34V21.08Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r10" points="220.69 58.25 227.24 50.45 227.24 62.59 220.69 70.39 220.69 58.25" fill={color[cube.right[1][0]]} />
      <path d="M227,55.14V66.5l-6.05,7.2V62.34l6.05-7.2m.5-1.38-7.05,8.4V75.08l7.05-8.4V53.76Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r11" points="228.45 49.02 235 41.22 235 53.35 228.45 61.15 228.45 49.02" fill={color[cube.right[1][1]]} />
      <path d="M234.75,45.9V57.26l-6.05,7.21V53.11l6.05-7.21m.5-1.37-7.05,8.39V65.84l7.05-8.4V44.53Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r12" points="236.2 39.78 242.75 31.98 242.75 44.12 236.2 51.92 236.2 39.78" fill={color[cube.right[1][2]]} />
      <path d="M242.5,36.67V48l-6.05,7.2V43.87l6.05-7.2m.5-1.38L236,43.69V56.61l7.05-8.4V35.29Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r20" points="220.69 72.46 227.24 64.66 227.24 76.8 220.69 84.6 220.69 72.46" fill={color[cube.right[2][0]]} />
      <path d="M227,69.35V80.71l-6.05,7.2V76.55l6.05-7.2m.5-1.38-7.05,8.4V89.29l7.05-8.4V68Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r21" points="228.45 63.22 235 55.42 235 67.56 228.45 75.36 228.45 63.22" fill={color[cube.right[2][1]]} />
      <path d="M234.75,60.11V71.47l-6.05,7.21V67.31l6.05-7.2m.5-1.37-7.05,8.39V80.05l7.05-8.4V58.74Z"
        transform="translate(0 -4)" />
      <polygon class="cls-r22" points="236.2 53.99 242.75 46.19 242.75 58.33 236.2 66.13 236.2 53.99" fill={color[cube.right[2][2]]} />
      <path d="M242.5,50.87V62.24l-6.05,7.2V58.08l6.05-7.21m.5-1.37L236,57.9V70.81L243,62.42V49.5Z"
        transform="translate(0 -4)" />
    </svg>
  }
}
namespace CubeActivity {
  export const usage = `
## 注意事项
>建议使用前在在插件管理加载puppteeter服务,否则无法发送图片\n
本插件只用于体现 Koishi 部署者意志\n
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-cube 概不负责。\n
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容

## 使用方法
- 操作魔法
  - cb +【f,b,u,d,l,r】不区分大小写，在字母前加入【非方向字符】代表顺时针旋转
- 新建魔法
  - cb
- 自定义魔法
  - cb.def 魔方数据
- 撤销操作
  - cb.back
- 魔方排行榜
  - cb.rank
- py交易 修改群友权限
  - cb.bind+一次性key 
  - 在配置项设置一次性key，交易对象发给机器人，
`


  export interface Config {
    mark_str: string
    key: number
  }
  const cube_dict: any = {}
  export const Config: Schema<Config> = Schema.object({
    mark_str: Schema.string().default('”').description('反向拧的标记字符'),
    key: Schema.number().description('走后门的钥匙')
  })

}

export default CubeActivity