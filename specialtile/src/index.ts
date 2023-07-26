import { Context, Logger, Schema,Session } from 'koishi'

import { } from '@koishijs/plugin-adapter-onebot'

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
  session:Session
  constructor(ctx: Context, config: Special.Config) {
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
    ctx.command('specialtitle','启动 specialtitle').action(({session})=>{
      this.session = session
      return 'specialstitle 已启动'
    })
    ctx.on('guild-member-added', async (session) => {
      this.session = session
      if (session.platform == 'onebot' && session?.onebot) {
        const uid = session.guildId + session.userId
        const nickname = session.text('specialtitle.nickname')
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
    ctx.on('ready',()=>{
      // 监听群友名片的变化
    setInterval(async ()=>{
      if(!this.session){
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
          this.session.onebot.setGroupSpecialTitle(k.guildId,k.userId,k.nickname)
        }
      }
    },5000)
    })
  }
}
namespace Special{
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