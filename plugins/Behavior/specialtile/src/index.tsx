import { Context, Logger, Schema, Session, Dict } from 'koishi'

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
        "KISS→温柔",
        "ゝy1笑倾城。",
        "久违的心痛╮",
        "无所谓的爱",
        "正在刪除ゝ",
        "╰守不住的情",
        "我 ┛只是",
        "剪断了牵挂〃",
        "心丶在滴血。",
        "习惯了孤单゛",
        "放了我的手",
        "只剩、相片。",
        "最初的依赖°",
        "彼岸的命運╰＇",
        "一厢情愿、",
        "⑴心メ守护｀",
        "过眼、烟云",
        "盛夏的剩下。",
        "这样的我太失落",
        "在失望中沉寂",
        "墜落の天使",
        "失望让我堕落",
        "荷花の冬天",
        "思念是一种病",
        "两个人的荒岛",
        "笑靥如花あ",
        "卑微的承诺",
        "眼泪何必固执",
        "虚妄浮生╮",
        "继续装下去╮",
        "回忆是那般痛",
        "相思引╰ー",
        "陌上、花开。",
        "太多旳顾虑。",
        "我想。跟你走",
        "潜意识失忆",
        "回忆录(Hyil)",
        "玛奇朵 Ver",
        "薇薇想念式",
        "相见不如怀念",
        "痴心于他",
        "非爱不可",
        "人间绝色是你",
        "相思无处安放",
        "じ早已訫傷づ",
        "清风不解语",
        "离岸夕阳",
        "做梦都想你",
        "心痛的故事￣",
        "゛ 猩红色阳光",
        "丶狠温暖",
        "陪海枯石烂°",
        "心动九十九次",
        "世间河山不敌你",
        "心动倒计时",
        "へ风中搁浅の",
        "遙遙無歸期",
        "蓝色の幻想",
        "弈剑のㄨ听雨阁",
        "独洎の守候",
        "柏铯のゾ味檤",
        "祢ぺ葑のぺ丿",
        "瞳孔中的我",
        "心疼了暮色伊人",
        "微笑の瞳孔、",
        "恋の¤兲使√",
        "苩铯の玫瑰",
        "兜里の有糖硪の",
        "藦兲轮の约",
        "顁兲骄の魂",
        "梦の旅驿站",
        "ノ井、羙羙",
        "勾起讽刺の笶傛",
        "草莓味の衬衫",
        "ゞ夜色乄朦胧",
        "恛忆︿够了",
        "曽紟の詤言",
        "灞占迩の薀柔╰",
        "糖ωσ心の",
        "爱泪化作の雨",
        "卟洊在の廽忆い",
        "旧梦璀璨っ",
        "冷凌じ冰沁",
        "ぎ雨のぶ茚誋",
        "ζ᭄落້໌ᮨ雪无痕ꦿ᭄〆",
        "→偏執の守χμ者"
      ]
      fs.writeFileSync('./data/nickname.json', JSON.stringify(this.nickname_data));
    }
    ctx.model.extend('ban_rank', {
      id: "unsigned",
      uid: 'string',
      gid: 'string',
      score: 'integer'
    }, {
      autoInc: true
    })
    ctx.before('attach-user', async ({ }, fields) => {
      fields.add('authority')
      fields.add('id')
    })
    ctx.command('kick').action(async ({session})=>{
      const list = await session.bot.getGuildMemberList(session.guildId)
      console.dir(list)
    })
    ctx.command('设置管理 [nickname:string]', '通过userId设置管理员', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      session.bot.internal?.setGroupAdmin(session.guildId, args[0], true)
      return "嗯！已经设置了"
    })
    ctx.command('取消管理 [nickname:string]', '通过userId取消管理员', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      session.bot.internal?.setGroupAdmin(session.guildId, args[0], false)
      return "嗯！已经取消了"
    })
    ctx.command('修改昵称 [uid:string] [nickname:string]', '修改群友昵称', { checkArgCount: true, authority: 1 }).action(async ({ session }, ...args) => {
      session.bot.internal?.setGroupCard(session.guildId, args[0], args[1])
      return "嗯！已经修改了"
    })
    ctx.command('修改头衔 [uid:string] [nickname:string]', '修改群友头衔', { checkArgCount: true, authority: 1 }).action(async ({ session }, ...args) => {
      session.bot.internal?.setGroupSpecialTitle(session.guildId, args[0], args[1])
      return "嗯！已经修改了"
    })
    ctx.command('口球大礼包').action(async ({ session }) => {
      const dt = Math.floor((Math.random() * 300000))
      await this.add_score(session.guildId, session.userId, dt)
      await session.bot.muteGuildMember(session.guildId, session.userId, dt)
      return "嗯！"
    })
    ctx.command('封神榜', '谁才是本群的运气王').action(async ({ session }) => {
      if (session.platform !== 'onebot') {
        return
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
        try{
        const info = await session.bot.internal?.getGroupMemberInfo(session.guildId, itm.uid)
        rank_div.push(<div style="font-size:10px;width:200px;height:20px">{`${(info.nickname || info.user_id)}:${itm.score}`}</div>)
        }catch(e){
          logger.info(session.guild+itm.uid+"查无此人")
        }
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
    ctx.middleware(async (session, next) => {
      if (!session.content.startsWith('捆绑')) {
        return next()
      }
      const target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
      if (!target) {
        return next()
      }
      for (var i of target) {
        const dt = Math.floor((Math.random() * 60000))
        await this.add_score(session.channelId, i, dt)
        session.bot.muteGuildMember(session.channelId, i, dt)
      }
      return next()

    })
    ctx.middleware(async (session, next) => {
      if (!session.content.startsWith('解绑')) {
        return next()
      }
      if (session.platform !== 'onebot') {
        return next()
      }
      const target = session.content.match(/(?<=<at id=")([\s\S]*?)(?="\/>)/g)
      if (!target) {
        return next()
      }
      for (var i of target) {
        await this.add_score(session.channelId, i, 0 - (this.map[i + session.channelId] ? this.map[i + session.channelId] : 0))
        this.map[i + session.channelId] = 0
        session.bot.muteGuildMember(session.channelId, i, 0)
      }
      return next()
    })
    ctx.middleware(async (session, next) => {
      const session_auth: Session<"authority"> = session as Session<"authority">
      const authority = session_auth.user.authority
      if (authority == 0) {
        const dt = Math.floor((Math.random() * 60000))
        await this.add_score(session.channelId, session.userId, dt)
        session.bot.muteGuildMember(session.channelId, session.userId, dt)
      }
      return next()
    })
    ctx.on('guild-member-added', async (session) => {
      if (session.platform == 'onebot') {
        const nickname = this.get_rondom_name()
        await session.bot.internal?.setGroupSpecialTitle(session.guildId, session.userId, nickname)
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
  async add_score(channelId: string, userId: string, score: number) {
    this.map[userId + channelId] = score
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