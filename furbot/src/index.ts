import { Context, Schema, Logger, segment, h, Session, Quester, Dict,Next } from 'koishi'
const axios = require('axios')
export const name = 'furbot'
const logger = new Logger(name)

declare module 'koishi' {
  interface Tables {
    account: FurBot.Account
  }
}
class FurBot {
  message_box: Dict
  private constructor(private ctx: Context, config: FurBot.Config) {
    this.message_box = {}
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.model.extend('account', {
      // 各字段类型
      id: 'unsigned',
      uid: 'string',
      token: 'string',
      cookies: 'list'
    }, {
      primary: 'id', //设置 uid 为主键
      unique: ['id'], //设置 uid 为唯一键
      foreign: {
        id: ['user', 'id'], //将 uid 与 user 表的 id 绑定
      }
    })
    ctx.before('attach-user', async ({ }, fields) => {
      fields.add('id')
    })
    ctx.command('毛图', '随机毛图').alias('fur')
      .option('name', '-n <name:text>')
      .option('type', '-t <type:string>')
      .action(async ({ session,options }) => {
        const picture = await this.randomImg(options)
        let picture_url: string | boolean
        if (picture) picture_url = await this.get_url(picture)
        if (picture_url) {
          let msg_id:string[]
          msg_id = await session.bot.sendMessage(session.channelId, segment('image', { url: picture_url }), session.guildId)
          this.message_box[msg_id[0]] = picture
        }
      })

    ctx.middleware(async (session, next) => this.middleware(session, next));
    ctx.command('login')
      .option('account', '-a <account:string>')
      .option('password', '-p <password:string>')
      .option('model', '-m <model:number>')
      .action(async ({ session, options }) => {
        this.login(session, options)
      })
    ctx.command('thumb')
  }
 
  async middleware( session: Session, next: Next){
    if (session.parsed.appel&&Object.keys(this.message_box).includes(session.quote.messageId)) {
      return this.thumbs(session,session.quote.messageId)
    }else{
      return next()
    }
  }
  
  async recall(session: Session, messageId: string, time: number) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , time));

  }
  public async randomImg(option: FurBot.RondomImgOPT): Promise<string | boolean> {
    const name = encodeURIComponent(option.name ? option.name : '')
    const type = encodeURIComponent(option.type ? option.type : '')
    let picture: string
    let picture_name: string

    try {
      const response: FurBot.RondomImgRES = (await this.ctx.http.axios({
        method: 'get',
        url: `https://cloud.foxtail.cn/api/function/random?name=${name}&type=${type}`,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })).data;
      picture_name = response.picture.name
      picture = response.picture.picture
      return picture
    } catch (e) {
      logger.error(e);
      return false
    }
  }
  public async get_url(picture: string | boolean) {
    let picture_url: string
    if (!picture) {
      return false
    }
    try {
      const response: FurBot.PictureRES = (await this.ctx.http.axios({
        method: 'get',
        url: `https://cloud.foxtail.cn/api/function/pictures?picture=${picture}&model=0`,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })).data;
      picture_url = response.url
    } catch (e) {
      logger.error(e);
      return false
    }
    return picture_url ? picture_url : false
  }


  public async thumbs(session:Session, picture?: string) {
    const session_id: Session<"id"> = session as Session<"id">
    let account:FurBot.Account = (await this.ctx.database.get('account',session_id.user.id))[0]
    if(!account){
      return session.text('messages.check.login.notlogin')
    }
    let picture_url: string
    if (!picture) {
      return '点赞失败'
    }
    try {
      const response: FurBot.PictureRES = (await this.ctx.http.axios({
        method: 'get',
        url: `https://cloud.foxtail.cn/api/function/thumbs?picture=${picture}&model=0`,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })).data;
      picture_url = response.url
    } catch (e) {
      logger.error(e);
      return String(e)
    }
    return picture_url ? picture_url : '点赞失败'
  }


  public async login(session: Session, option: FurBot.LoginOPT){
    if (session.subtype !== 'private') {
      return '请私信登录'
    }
    const res = await this.ctx.http.axios({
      method: 'get',
      url: 'https://cloud.foxtail.cn/api/check',
      responseType: 'arraybuffer'
    })
    session.send(session.text('messages.check', [60]) + segment.image(res.data, 'image/png'))
    const proving: string = await session.prompt()
    let response
    if (!proving) {
      return false
    }
    try {
      response = (await this.ctx.http.axios({
        withCredentials: true,
        method: 'post',
        url: ` https://cloud.foxtail.cn/api/account/login`,
        headers: {
          'Content-Type': 'multipart/form-data',
          'cookie': res.headers['set-cookie']
        },
        data: {
          account: option.account,
          password: option.password,
          model: option.model,
          proving: proving
        }
      }));
      session.send(response.data.msg)
    }
    catch (e) {
      logger.error(e);
      return false
    }
    if (!response) {
      return false
    }
    try {
      const token = await this.ctx.http.axios({
        method: 'get',
        headers: {
          'cookie': response.headers['set-cookie']
        },
        url: 'https://cloud.foxtail.cn/api/account/tkapply'
      })
      if (token.data.token) {
        const session_id: Session<"id"> = session as Session<"id">
        await this.ctx.database.set('account', [session_id.user.id], { uid: session.userId, token: token.data.token, cookies: response.headers['set-cookie'] })
        return session.text('messages.login.success')
      }
      return session.text('messages.login.failure')

    } catch (e) {
      logger.error(e)
      return false
    }
  }




}

namespace FurBot {
  export interface Account {
    id?: number
    uid?: string
    account?: string
    password?: string
    token?: string
    cookies?: string[]
  }
  export interface LoginOPT {
    account?: string
    password?: string
    model?: number
    proving?: string
  }
  export interface PictureRES {
    name: string
    id: string
    picture: string
    md5: string
    power: number
    examine: number
    state: number
    url: string
    url2: string
    suggest: string
    format: string
    msg: string
    code: string
  }
  export interface RondomImgOPT {
    name?: string
    type?: string
  }
  export interface RondomImgRES {
    picture: {
      account: string
      name: string
      id: string
      picture: string
      md5: string
      format: string
      suggest: string
      time: string
      timestamp: string
      type: string,
      Collection: string,
      thumbs: string
    },
    msg: string
    code: string
  }
  export interface Config { }

  export const Config: Schema<Config> = Schema.object({})

}

export default FurBot;
