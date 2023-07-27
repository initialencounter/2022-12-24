import { Context, Logger, Schema, Session, Dict } from 'koishi'

import { } from '@koishijs/plugin-adapter-onebot'

import fs from "fs"
export const name = 'specialtitle'
export const logger = new Logger(name)

class Special {
  nickname_data: Dict
  constructor(ctx: Context, config: Special.Config) {
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
    ctx.command('修改昵称 [uid:string] [nickname:string]', '修改群友昵称', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      session?.onebot.setGroupCard(session.guildId, args[0], args[1])
    })
    ctx.command('修改头衔 [uid:string] [nickname:string]', '修改群友头衔', { checkArgCount: true, authority: 5 }).action(async ({ session }, ...args) => {
      session?.onebot.setGroupSpecialTitle(session.guildId, args[0], args[1])
    })
    ctx.command('口球大礼包').action(({session})=>{
      session?.onebot.setGroupBan(session.guildId,session.userId,Math.floor((Math.random() * 1800000)))
    })
    ctx.on('guild-member-added', async (session) => {
      if (session.platform == 'onebot' && session?.onebot) {
        const nickname = this.get_rondom_name()
        // 记录名片
        await session?.onebot.setGroupSpecialTitle(session.guildId, session.userId, nickname)
      }
    })
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