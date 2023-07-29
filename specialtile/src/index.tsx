import { Context, Logger, Schema, Session, Dict } from 'koishi'

import { } from '@koishijs/plugin-adapter-onebot'

import fs from "fs"
export const name = 'specialtitle'
export const logger = new Logger(name)

declare module 'koishi' {
  interface Tables {
    ban_rank: Ban_rank
  }
}

export interface Ban_rank {
  id: number
  uid: string
  gid: string
  score: number
}

class Special {
  nickname_data: Dict
  map: Dict
  constructor(private ctx: Context, config: Special.Config) {
    this.map = {}
    try {
      this.nickname_data = require('./data/nickname.json');
    } catch (e) {
      this.nickname_data = [
        "最後の冰吻",
        "花落相思尽 〆",
        "ヾ我後悔叻",
        "寂寞の牵 ?",
        "KISS→温柔",
        "承諾ー羋孑",
        "ゝy1笑倾城。",
        "久违的心痛╮",
        "无所谓的爱",
        "假装多好",
        "正在刪除ゝ",
        "演绎玓刂\角色",
        "╰守不住的情",
        "我 ┛只是",
        "剪断了牵挂〃",
        "心丶在滴血。",
        "习惯了孤单゛",
        "放了我的手",
        "只剩、相片。",
        "後悔、愛上你。",
        "最初的依赖°",
        "彼岸的命運╰＇",
        "一厢情愿、",
        "细腻的女子ヽ",
        "⑴心メ守护｀",
        "过眼、烟云",
        "一句好分手。",
        "望尔离去背影",
        "盛夏的剩下。",
        "这样的我太失落",
        "在失望中沉寂",
        "墜落の天使",
        "失望让我堕落",
        "荷花の冬天",
        "涐的心好冷╮",
        "你是我的Angel",
        "改变了节奏",
        "仅仅戏一场",
        "思念是一种病",
        "情、傷了",
        "吥离θ弃",
        "两个人的荒岛",
        "ゝ太妃咖啡 シ",
        "coastline",
        "笑靥如花あ",
        "你说你难过、",
        "卑微的承诺",
        "眼泪何必固执",
        "虚妄浮生╮",
        "╰黒の眼圏╮",
        "继续装下去╮",
        "回忆是那般痛",
        "相思引╰ー",
        "打开窗。爱你",
        "日光、倾城。",
        "说 好旳幸福呢",
        "陌上、花开。",
        "太多旳顾虑。",
        "我想。跟你走",
        "潜意识失忆",
        "回忆录(Hyil)",
        " 最妩媚。",
        "玛奇朵 Ver",
        "性感不是*",
        "他说我天真丶",
        "珎out了",
        "薇薇想念式",
        "相见不如怀念"]
      fs.writeFileSync('./data/nickname.json', JSON.stringify(this.nickname_data));
    }
    ctx.model.extend('ban_rank', {
      id: "unsigned",
      uid: 'string',
      gid: 'string',
      score: 'integer'
    },{
      autoInc: true
    })
    ctx.command('设置管理 [nickname:string]', '通过QQ号设置管理员', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      session?.onebot.setGroupAdmin(session.guildId, args[0], true)
    })
    ctx.command('取消管理 [nickname:string]', '通过QQ号取消管理员', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      session?.onebot.setGroupAdmin(session.guildId, args[0], false)
    })
    ctx.command('修改昵称 [nickname:string]', '修改群友昵称', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      session?.onebot.setGroupCard(session.guildId, args[0], args[1])
    })
    ctx.command('修改头衔 [uid:string] [nickname:string]', '修改群友头衔', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      session?.onebot.setGroupSpecialTitle(session.guildId, args[0], args[1])
    })
    ctx.command('口球大礼包').action(async ({ session }) => {
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      const dt = Math.floor((Math.random() * 300))
      await this.add_score(session.channelId,session.userId,dt)
      session?.onebot.setGroupBan(session.channelId, session.userId, dt)
    })
    ctx.command('封神榜','谁才是本群的运气王').action(async ({ session }) => {
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      const list = await ctx.database.get('ban_rank', { gid: session.channelId })
      if (list.length < 1) {
        return '本群无人封神'
      }
      const sorted_arr = this.quickSort(list)
      const rank_div: any[] = []
      rank_div.push(<div style="font-size:20px;width:200px;height:30px">封神榜</div>)
      for (var i in sorted_arr) {
        var itm: Ban_rank = sorted_arr[i]
        const info = await session?.onebot.getGroupMemberInfo(session.guildId,itm.uid)
        rank_div.push(<div style="font-size:10px;width:200px;height:20px">{`${(info.nickname||info.user_id)}:${itm.score}`}</div>)
      }
      return <html>
        <div style={{
          width: 200 + 'px',
          height: (sorted_arr.length + 1) * 50 + 30 + 'px',
          background: "transparent",
        }}></div>
        {rank_div}
      </html>
    })
    ctx.middleware(async(session, next) => {
      if (!session.content.startsWith('捆绑')) {
        return next()
      }
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      const target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
      if (!target) {
        return next()
      }
      for (var i of target) {
        const dt = Math.floor((Math.random() * 60))
        await this.add_score(session.channelId,i,dt)
        session?.onebot.setGroupBan(session.channelId, i, dt)
      }
      return next()

    })
    ctx.middleware(async(session, next) => {
      if (!session.content.startsWith('解绑')) {
        return next()
      }
      if (session.platform !== 'onebot') {
        return '该命令只适用于 onebot 平台'
      }
      const target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
      if (!target) {
        return next()
      }
      for (var i of target) {
        await this.add_score(session.channelId,i,0-(this.map[i+session.channelId]?this.map[i+session.channelId]:0))
        session?.onebot.setGroupBan(session.channelId, i, 0)
      }
      return next()
    })
    ctx.on('guild-member-added', async (session) => {
      if (session.platform == 'onebot' && session?.onebot) {
        const nickname = this.get_rondom_name()
        await session?.onebot.setGroupSpecialTitle(session.guildId, session.userId, nickname)
      }
    })
  }
  quickSort(arr: Ban_rank[]) {
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
  async add_score(channelId:string,userId:string, score: number) {
    this.map[userId+channelId] = score
    const target = await this.ctx.database.get('ban_rank', { uid: userId, gid: channelId })
    if (target.length === 0) {
      await this.ctx.database.create('ban_rank', { uid: userId, gid: channelId, score: score })
    } else {
      await this.ctx.database.set('ban_rank', { uid: userId, gid: channelId }, { score: target[0].score + score })
    }
  }
  get_rondom_name(): string {
    return this.nickname_data[Math.floor((Math.random() * this.nickname_data.length))]
  }
}
namespace Special {
  export const usage = `
使用说明：
机器人必须拥有群主权限
如果有更多文本内容想要修改，可以在 data/nickname.json 中修改
`

  export interface Config {
  }

  export const Config: Schema<Config> = Schema.object({
  })
}
export default Special