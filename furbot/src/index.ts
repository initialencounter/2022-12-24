import { Context, Schema, Logger, segment, Session, Dict, Next } from 'koishi'
export const name = 'furbot'
const logger = new Logger(name)
const BASE_URL = 'https://cloud.foxtail.cn/api';
declare module 'koishi' {
  interface Tables {
    furry_account: FurBot.Account
  }
}
class FurBot {
  message_box: Dict
  private constructor(private ctx: Context, config: FurBot.Config) {
    this.message_box = {}
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.model.extend('furry_account', {
      // 各字段类型
      id: 'unsigned',
      uid: 'string',
      account: 'string',
      password: 'string',
      token: 'string',
      cookies: 'list'
    }, {
      primary: 'uid', //设置 uid 为主键
      unique: ['uid','id'], //设置 uid及id 为唯一键
      autoInc: true
    })
    ctx.before('attach-user', async ({ }, fields) => {
      fields.add('id')
    })

    ctx.command('fur', '随机毛图')
      .alias('毛图')
      .option('name', '-n <name:text>')
      .option('type', '-t <type:string>')
      .action(async ({ session, options }) => {
        const picture = await this.randomImg(options)
        let picture_url: string | boolean
        if (picture) picture_url = await this.get_url(picture)
        if (picture_url) {
          const msg_id: string[] = await session.bot.sendMessage(session.channelId, picture + segment('image', { url: picture_url }), session.guildId)
          this.message_box[msg_id[0]] = picture
        }
      })
    ctx.middleware(async (session, next) => this.middleware(session, next));
    ctx.command('fur.注册 <account:string> <password:string> <mailbox:string>', { checkArgCount: true })
      .alias('fur.register')
      .option('qq', '-q <qq:number>')
      .option('invitation', '-i <invitation:string>')
      .action(async ({ session, options }, ...args) => {
        const params: FurBot.RegisterOPT = {
          account: args[0],
          password: args[1],
          mailbox: args[2],
          qq: options.qq,
          invitation: options.invitation
        }
        return this.register(session, params)
      })
    ctx.command('fur.登录 <account:string> <password:string>', { checkArgCount: true })
      .alias('fur.login')
      .option('model', '-m <model:number>')
      .option('token', '-t <token:string>')
      .action(async ({ session, options }, ...args) => {
        const params: FurBot.LoginOPT = {
          account: args[0],
          password: args[1],
          model: options.model,
          token: options.token
        }
        return this.login(session, params)
      })
    ctx.command('fur.下载 <imgID:string>', { checkArgCount: true })
      .alias('fur.download')
      .action(async ({ session }, arg) => {
        const picture_url: string = await this.get_url(arg)
        if (picture_url) {
          const msg_id: string[] = await session.bot.sendMessage(session.channelId, segment('image', { url: picture_url }), session.guildId)
          this.message_box[msg_id[0]] = arg
        } else {
          return session.text('messages.download.failure', ['Image not found.'])
        }

      })
    ctx.command('fur.点赞 <imgID:string>', { checkArgCount: true })
      .alias('fur.thumb')
      .action(async ({ session }, arg) => {
        return this.thumb(session, arg, 'thumbs');
      })
    ctx.command('fur.取消点赞 <imgID:string>', { checkArgCount: true })
      .alias('fur.thumbt')
      .action(async ({ session }, arg) => {
        return this.thumb(session, arg, 'thumbt');
      })
    ctx.command('fur.收藏 <imgID:string>', { checkArgCount: true })
      .alias('fur.collect')
      .action(async ({ session }, arg) => {
        return this.thumb(session, arg, 'storeadd');
      })
    ctx.command('fur.取消收藏 <imgID:string>', { checkArgCount: true })
      .alias('fur.uncollect')
      .action(async ({ session }, arg) => {
        return this.thumb(session, arg, 'storedel');
      })
    ctx.command('fur.收藏列表').action(async ({ session }) => {
      return this.storelist(session)
    })
    ctx.command('fur.更新cookie').action(async ({ session }) => {
      return this.update_cookie(session)
    })


  }

  async storelist(session: Session) {
    const account: FurBot.Account = await this.getAccount(session);
    if (!account) {
      return session.text('messages.login.notlogin');
    }
    try {
      const response: FurBot.StornlistRES = await this.makeGetRequest_cookie(`${BASE_URL}/function/storelist`, account.cookies);
      return JSON.stringify(response)
    } catch (e) {
      logger.error(e);
      return String(e)
    }
  }

  /**
   * 点赞/取消点赞/收藏/取消收藏 的实现方法
   * @param session 会话
   * @param next Next
   * @returns void|string
   */
  async middleware(session: Session, next: Next) {
    const { message_box } = this;
    if (!session.parsed.appel) {
      return next()
    }
    if (!session.quote) {
      return next()
    }
    if (session.parsed.appel && Object.keys(message_box).includes(session.quote.messageId)) {
      const content = session.content;

      const actions = [
        { keyword: '取消点赞', type: 'thumbt' },
        { keyword: '点赞', type: 'thumbs' },
        { keyword: '收藏', type: 'storeadd' },
        { keyword: '取消收藏', type: 'storedel' }
      ];

      for (const action of actions) {
        if (content.indexOf(action.keyword) > -1) {
          return this.thumb(session, message_box[session.quote.messageId], action.type);
        }
      }
    }

    return next();
  }

  /**
   * 注册账号
   * @param session 会话
   * @param option 注册参数
   * @returns msg
   */

  async register(session: Session, option: FurBot.RegisterOPT): Promise<string> {
    if (session.subtype !== 'private') {
      return session.text('messages.register.failure', ['不安全的操作，请私信机器人操作']);
    }
    // 设置请求参数
    const { account, password, mailbox } = option;
    const registrationData = { account, password, mailbox };
    // 发送验证码
    const checkResponse = await this.makeGetRequest_buffer(`${BASE_URL}/check`);
    session.send(session.text('messages.check', [60]) + segment.image(checkResponse.data, 'image/png'));
    const userResponse = await session.prompt();

    // 验证超时
    if (!userResponse && (userResponse.length !== 5)) {
      return session.text('messages.login.failure', ['!proving']);
    }

    registrationData['proving'] = userResponse;

    const headers = {
      'Content-Type': 'multipart/form-data',
      'cookie': checkResponse.headers['set-cookie']
    };
    // 发起注册请求
    try {
      const loginResponse = await this.makePostRequest(`${BASE_URL}/account/register`, headers, registrationData);
      return loginResponse.data.msg;
    } catch (error) {
      logger.error(error);
      return session.text('messages.login.failure', [String(error)]);
    }
  }

  public async randomImg(option: FurBot.RondomImgOPT): Promise<string> {
    const name = encodeURIComponent(option.name ? option.name : '')
    const type = encodeURIComponent(option.type ? option.type : '')
    let picture: string

    try {
      const response: FurBot.RondomImgRES = await this.makeGetRequest_form(`${BASE_URL}/function/random?name=${name}&type=${type}`)
      picture = response.picture.picture
      return picture
    } catch (e) {
      logger.error(e);
      return ''
    }
  }
  public async get_url(picture: string) {
    let picture_url: string
    if (!picture) {
      return ''
    }
    try {
      const response: FurBot.PictureRES = await this.makeGetRequest_form(`${BASE_URL}/function/pictures?picture=${picture}&model=0`);
      picture_url = response.url
    } catch (e) {
      logger.error(e);
      return ''
    }
    return picture_url ? picture_url : ''
  }

  /**
   * 点赞/取消点赞/收藏/取消收藏
   * @param session 会话
   * @param picture 图片ID
   * @param type 点赞/取消点赞/收藏/取消收藏
   * @returns msg
   */
  public async thumb(session: Session, picture: string, type: string) {
    this.message_box[session.messageId] = picture
    const account: FurBot.Account = await this.getAccount(session)
    if (!account) {
      return session.text('messages.login.notlogin');
    }

    if (!picture) {
      return '失败,图片不存在';
    }

    const url: string = `${BASE_URL}/function/${type}?picture=${picture}&model=0`;
    let response: FurBot.ThumbRES;
    try {
      response = await this.makeGetRequest_cookie(url, account.cookies);
    } catch (e) {
      logger.error(e);
      return '请求失败，请稍后重试';
    }

    const messageType = response ? response.msg : type + ' failure';
    const msg_id: string[] = await session.bot.sendMessage(session.channelId, messageType, session.guildId);
    this.message_box[msg_id[0]] = picture;
  }

  async update_cookie(session: Session) {
    const account = await this.getAccount(session)
    if (!account) {
      return session.text('messages.update.failure', ['未设置账号密码'])
    }
    const params: FurBot.LoginOPT = {
      account: account.account,
      password: account.password,
      model: 1,
      token: account.token
    }
    return await this.login(session, params)
  }

  /**
   * 登录操作，支持验证码和唯一令牌两种方式，
   * @param session 会话
   * @param option 参数
   * @returns msg
   */

  public async login(session: Session, option: FurBot.LoginOPT): Promise<string> {

    // 为了保证登录安全，只能私信机器人操作
    if (!(session.subtype == 'private')) {
      return session.text('messages.login.failure', ['不安全的操作，请私信机器人操作'])
    }


    // 设置请求参数
    let response: any
    let headers: any = {
      'Content-Type': 'multipart/form-data'
    }
    let data: FurBot.LoginOPT = {
      account: option.account,
      password: option.password,
      model: option.model
    }
    if (!option.model) {
      const checkResponse = await this.makeGetRequest_buffer(`${BASE_URL}/check`);
      session.send(session.text('messages.check', [60]) + segment.image(checkResponse.data, 'image/png'));
      const proving: string = await session.prompt()
      if (!proving && (proving.length !== 5)) {
        return session.text('messages.login.failure', ['!proving'])
      }
      data['proving'] = proving
      headers = {
        'Content-Type': 'multipart/form-data',
        'cookie': checkResponse.headers['set-cookie']
      }
    } else {
      if (!option.token) {
        return session.text('messages.login.failure', ['!option.token'])
      }
      data['token'] = option.token
    }


    // 开始请求
    try {
      response = await this.makePostRequest(`${BASE_URL}/account/login`, headers, data);

      // 获取令牌
      const token = await this.makeGetRequest_cookie(`${BASE_URL}/account/tkapply`, response.headers['set-cookie'])
      if (token.token) {

        // 查询数据库是否存在账户
        const account: FurBot.Account = (await this.ctx.database.get('furry_account', { uid: [session.userId] }))[0];
        // 更新数据库
        if (account) {
          await this.ctx.database.set('furry_account', { uid: [session.userId] }, { token: token.token, cookies: response.headers['set-cookie'] })
        } else {
          await this.ctx.database.create('furry_account', { uid: session.userId, token: token.token, cookies: response.headers['set-cookie'], account: option.account, password: option.password })
        }
        return session.text('messages.login.success', [token.token])
      }
      return session.text('messages.login.failure', [token.msg])
    }
    catch (e) {
      logger.error(e);
      return session.text('messages.login.failure', [String(e)])
    }

  }
  async getAccount(session: Session): Promise<FurBot.Account> {
    const account: FurBot.Account = (await this.ctx.database.get('furry_account', { uid: [session.userId] }))[0];
    return account
  }
  async makeGetRequest_buffer(url: string) {
    return (await this.ctx.http.axios({
      method: 'get',
      url,
      responseType: 'arraybuffer'
    }));
  }
  async makeGetRequest_form(url: string) {
    return (await this.ctx.http.axios({
      method: 'get',
      url,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })).data;
  }
  async makeGetRequest_cookie(url: string, cookie: string[]) {
    return (await this.ctx.http.axios({
      method: 'get',
      url,
      headers: {
        'Content-Type': 'multipart/form-data',
        'cookie': cookie
      },
    })).data;
  }

  async makePostRequest(url: string, headers: any, data: any) {
    return (await this.ctx.http.axios({
      method: 'post',
      url,
      headers,
      data
    }));
  }

  async recall(session: Session, messageId: string, time: number) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , time));

  }



}

namespace FurBot {
  export const usage = `
兽云祭，作为 兽耳工作室 的其中一个子项目，目前该项目已经投入试运行. .

## 机器人功能
### 已经做好了的
- [x] 账号注册
- [x] 账号登录
- [x] 图片下载
- [x] 随机毛图
- [x] 图片点赞
- [x] 图片收藏
- [x] 取消收藏
- [x] 收藏列表
- [x] 更新cookie

- [ ] 图片上载（正在制作）


## 使用说明
API文档 <a style="color:blue" href="https://console-docs.apipost.cn/preview/6bf01cfebd3e5f96/c4e20a5d1a5db86c?target_id=ba49a931-663a-4341-fc98-37ab95cbc6ee">兽云祭</a><br>

命令示例：
- 账号注册
    - fur.register 账号名 密码 邮箱
- 账号登录
    - fur.login 账号名 密码
- 随机毛图
    - fur


### 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~

### 支持

如果你支持本项目，可以给个[star](https://github.com/initialencounter/mykoishi)，你的支持不会获得额外内容，但会提高本项目的更新积极性

本机器人目前仅供学习交流使用。

您不应以任何形式使用本仓库进行盈利性活动。

对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-furbot 概不负责。

  `
  export interface RegisterOPT {
    account: string
    password: string
    mailbox: string
    proving?: string
    qq?: number
    invitation?: string
  }
  export interface StornlistRES {
    collection: {
      account: string;
      name: string;
      id: string;
      picture: string;
      format: string;
      power: string;
      type: string;
      suggest: string;
      Collection: string;
      thumbs: string;
    }[][];
    msg: string;
    code: string;
  }

  export interface ThumbRES {
    msg: string
    code: string
  }
  export interface Hearders {
    'Content-Type'?: string
    cookie?: string[]
  }
  export interface Account {
    id?: number
    uid?: string
    account?: string
    password?: string
    token?: string
    cookies?: string[]
  }
  export interface LoginOPT {
    account: string
    password: string
    model?: number
    proving?: string
    token?: string
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
