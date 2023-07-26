import { Context, Logger, Schema, Session, Dict } from 'koishi'

import { } from '@koishijs/plugin-adapter-onebot'

import fs from "fs"
export const name = 'specialtitle'
export const logger = new Logger(name)

declare module 'koishi' {
  interface Tables {
    specialtitle: specialtitle
  }
}
export interface specialtitle {
  id: number
  uid: string
  platform: string
  guildId: string
  userId: string
  nickname: string
}

class Special {
  session: Session
  nickname_data: Dict
  constructor(ctx: Context, config: Special.Config) {
    try {
      this.nickname_data = require('./personality.json');
    } catch (e) {
      this.nickname_data = ["最後の冰吻",
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
        "相见不如怀念",]
      fs.writeFileSync('./personality.json', JSON.stringify(this.nickname_data));
    }
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.model.extend('specialtitle', {
      id: 'unsigned',
      uid: 'text',
      platform: 'string',
      guildId: 'string',
      userId: 'string',
      nickname: 'text'
    }, {
      primary: 'id',
      unique: ['uid', 'id'],
      autoInc: true
    })
    ctx.command('specialtitle', '启动 specialtitle').action(({ session }) => {
      this.session = session
      return 'specialstitle 已启动'
    })
    ctx.on('guild-member-added', async (session) => {
      this.session = session
      if (session.platform == 'onebot' && session?.onebot) {
        const uid = session.guildId + session.userId
        const nickname = this.get_rondom_name()
        // 记录名片
        await ctx.database.create('specialtitle', {
          uid: uid,
          nickname: nickname,
          platform: session.platform,
          guildId: session.guildId,
          userId: session.userId
        })
        session?.onebot.setGroupCard(session.guildId, session.userId, nickname)
      }
    })
    // 退群后移除名片记录
    ctx.on('guild-member-deleted', async (session) => {
      this.session = session
      const uid = session.channelId + session.guildId + session.userId
      const member = await ctx.database.get('specialtitle', { uid: [uid] })
      if (member.length > 0) {
        await ctx.database.remove('specialtitle', { uid: [uid] })
      }
    })
    ctx.on('ready', () => {

      // 监听群友名片的变化
      setInterval(async () => {
        if (!this.session) {
          logger.warn('specialstitle 未启动,在QQ群发送 specialtitle 可启动')
        }
        const nickname_list = await ctx.database.get('specialtitle', { platform: ['onebot'] })
        const group_list = await ctx.database.get('channel', { platform: ['onebot'] }, ["id"])
        const group_list_data = {}
        const bot = ctx.bots[`onebot:${config.selfId}`]
        for (var i of group_list) {
          const member = await bot.getGuildMemberList(i.id)
          for (var j of member) {
            group_list_data[i.id + j['userId']] = j['nickname']
          }
        }
        for (var k of nickname_list) {
          if (k.nickname !== group_list_data[k.uid]) {
            if(group_list_data[k.uid]){
              this.session.onebot.setGroupSpecialTitle(k.guildId, k.userId, k.nickname)
            }
          }
        }
      }, 5000)
    })

  }
  get_rondom_name():string {
    return this.nickname_data[Math.floor((Math.random()*this.nickname_data.length))]
  }
}
namespace Special {
  export const usage = `
使用说明：
机器人必须拥有管理员权限
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容<br>
若specialstitle 未启动,在QQ群发送 specialtitle 即可启动
`
  export interface Config {
    selfId: string
    interval: number
  }

  export const Config: Schema<Config> = Schema.object({
    selfId: Schema.string().default('1114039391').description('qq机器人账号'),
    interval: Schema.number().default(60000).description('轮询间隔')
  })
}
export default Special