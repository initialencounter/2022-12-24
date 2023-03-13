import { Context, Schema, Logger, segment, Element, Session, Service, Dict } from 'koishi';
import fs from 'fs';
import { } from '@koishijs/plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
export const name = 'davinci-003';
export const logger = new Logger(name);

/**
 * chat_with_gpt|message: [{role:'user',content:<text>}] 
 * get_credit | 获取余额
 * censor_request | text要审查的文本
 */

declare module 'koishi' {
  interface Context {
    dvc: Dvc
  }
  interface Dvc {
    chat_with_gpt(message: Dvc.Msg[]): Promise<string>
    get_credit(session: Session): Promise<string>
    censor_request(text: string): Promise<string>
  }

}

class Dvc extends Service {
  session_config: { "msg": Dvc.Msg[] };
  sessions: Dict;
  personality: string;
  sessions_cmd: Dict;
  reg: RegExp;
  openai: OpenAI;
  access_token: string;
  ifgettoken: boolean;
  constructor(ctx: Context, private config: Dvc.Config) {
    super(ctx, 'dvc', true)
    this.openai = new OpenAI(config.key, ctx);
    this.reg = new RegExp(config.reg);
    this.sessions_cmd = {};
    this.sessions = {};
    this.access_token = ''
    this.session_config = {
      'msg': [
        { "role": "system", "content": config.preset }
      ]
    }
    if (!ctx.puppeteer && config.output == 'verbose') {
      logger.warn('未启用puppter,将无法发送图片');
    }

    let num: number = 1;
    while (config.alias.length < 5) {
      config.alias.push(`davinci${num}`);
      num++;
    }
    try {
      JSON.parse(fs.readFileSync('./davinci-003-data.json').toString());
    } catch (e) {
      fs.writeFileSync('./davinci-003-data.json', '{"派蒙":"你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"}');
    }
    this.personality = JSON.parse(fs.readFileSync('./davinci-003-data.json').toString());
    ctx.command('dvc.credit').action(async ({ session }) => this.get_credit(session));
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.middleware(async (session, next) => this.middleware1(session, next));
    ctx.command('dvc.img', {//人格名称触发命令的关键
      authority: config.authority,
      maxUsage: config.usage,
      minInterval: config.minInterval,
      usageName: 'ai'
    }).action(async ({ session }, prompt) => this.dvc_img(session, prompt, config))
    ctx.command('dvc <prompt:text>', { authority: config.authority })//主要逻辑
      .alias(config.alias[0], config.alias[1], config.alias[2], config.alias[3], config.alias[4])
      .action(async ({ session }, prompt) => this.dvc(session, prompt))
    ctx.command('count', {//统计次数的工具人
      maxUsage: config.usage,
      usageName: 'ai'
    }).action(() => { logger.info('usage-1') })
    ctx.command('dvc.clear', {//清空所有会话及人格
      authority: 5
    }).action(async ({ session }) => this.clear(session))
  }

  /**
   * 
   * @param session 当前会话
   * @returns 返回清空的消息
   */

  async clear(session: Session) {
    this.sessions = {}
    return session.text('commands.dvc.messages.clean')
  }

  /**
   * 
   * @returns 百度审核令牌
   */
  async get_token() {
    this.ifgettoken = true
    if (this.config.AK && this.config.SK) {
      try {
        let options = {
          'method': 'POST',
          'url': 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + this.config.AK + '&client_secret=' + this.config.SK
        }
        const resp: string = (await this.ctx.http.axios(options)).data.access_token
        return resp
      }
      catch (e) {
        logger.warn(e.toString())
        return ''
      }
    }else{
      return ''
    }
  }

  /**
   * 
   * @param session 当前会话
   * @param prompt 图片描述
   * @param config 配置项
   * @returns 图片
   */

  async dvc_img(session: Session, prompt: string, config: Dvc.Config) {

    try {
      const resp: Dvc.Resp = await this.ctx.http.post(config.endpoint.replace('chat', 'img'), {
        'msg': prompt,
        'id': config.resolution,
        'api_key': config.key
      })

      return segment.image(resp.msg[0].content)
    }
    catch (err) {
      logger.warn(err);
      return `${session.text('commands.dvc.messages.err')}${String(err)}`
    }
  }

/**
 * 对话主要逻辑
 */



  async dvc(session: Session, prompt: string) {
    if (!prompt) {
      return session.text('commands.dvc.messages.no-prompt')
    }
    if (session.content.length > this.config.max_tokens) {
      return session.text('commands.dvc.messages.toolong')
    }
    if (this.config.waiting) {
      session.send(session.text('commands.dvc.messages.thinking'))
    }
    let msg: string = prompt
    if(!this.ifgettoken){
      this.access_token = await this.get_token()
    }
    if (!(this.access_token=='')){
      const censor_text: boolean = await this.censor_request(session.content)
      if (censor_text==false) {
        return session.text('commands.dvc.messages.censor')
      }
    }
    const session_id_string: string = session.userId
    if (this.config.superusr.indexOf(session_id_string) == -1) {
      session.execute("count")
    }

    if (prompt.slice(0, 4) == '设置人格') {
      let nick_name: string = '小猪'
      try {
        nick_name = prompt.match(this.reg)[0].slice(4, -1)
      }
      catch (err) {
        logger.warn('未设置Ai的昵称，可忽略')
      }
      if (Object.keys(this.sessions_cmd).indexOf(session_id_string) > -1) {
        Object.keys(this.sessions_cmd).forEach((i, id) => {
          if (i.indexOf(session_id_string) == -1) {
            this.sessions_cmd[id] = session_id_string + nick_name
          }
        })
      } else {
        this.sessions_cmd[session_id_string] = nick_name
      }
      if (!(nick_name == '小猪')) {
        this.personality[String(nick_name)] = prompt.slice(4, prompt.length)
        try {
          fs.writeFileSync('./davinci-003-data.json', JSON.stringify(this.personality));
        } catch (e) {
          logger.warn(e);
        }
      }
    } else if (prompt.slice(0, 4) == '切换人格') {
      if (prompt.length == 4) {
        if (Object.keys(this.personality).length == 0) {
          return session.text('commands.dvc.messages.switch-errr')
        }
        if (Object.keys(this.personality).length > 1) {
          let nickname_str: string = '\n'
          Object.keys(this.personality).forEach((i, id) => {
            nickname_str += String(id + 1) + ' ' + i + '\n'
          })
          session.send(session.text('commands.dvc.messages.switch', [nickname_str]))
          const input = await session.prompt()

          if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
          const index: number = +input - 1
          if (!Object.keys(this.personality)[index]) return '请输入正确的序号。'
          msg = '设置人格' + this.personality[Object.keys(this.personality)[index]]
          this.sessions_cmd[session_id_string] = Object.keys(this.personality)[index]
        } else {
          msg = '设置人格' + this.personality[Object.keys(this.personality)[0]]
          this.sessions_cmd[session_id_string] = Object.keys(this.personality)[0]

        }
      } else {
        const input: string = prompt.slice(4, prompt.length)
        if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
        const index: number = +input - 1
        if (!Object.keys(this.personality)[index]) return '请输入正确的序号。'
        if (this.personality[Object.keys(this.personality)[index]]) {
          msg = '设置人格' + this.personality[Object.keys(this.personality)[index]]
          this.sessions_cmd[session_id_string] = Object.keys(this.personality)[index]
        }
      }
    }
    if (this.config.type == 'gpt3.5-js') {
      try {
        const resp = await this.chat(msg, session_id_string)
        return resp
      }
      catch (err) {
        logger.warn(err);
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }

    }
    else if (this.config.type == 'gpt3.5') {
      try {
        const resp: Dvc.Resp = await this.ctx.http.post(this.config.endpoint, {
          'msg': msg,
          'id': session_id_string,
          'api_key': this.config.key
        })
        return this.getContent(session.userId, resp)
      }
      catch (err) {
        logger.warn(err);
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }

    } else if (this.config.type == 'gpt3.5-unit') {
      try {
        const text = await this.chat_with_gpt([{ 'role': 'user', 'content': prompt }])
        const resp = { 'msg': [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }], 'id': 0 }
        return this.getContent(session.userId, resp)
      }
      catch (err) {
        logger.warn(err);
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }

    }
    const opts: Dvc.Payload = {
      engine: this.config.mode,
      prompt: prompt,
      temperature: this.config.temperature,
      max_tokens: this.config.max_tokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }
    try {
      const text: string = await this.openai.complete(opts);
      const resp: Dvc.Resp = { 'msg': [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }], 'id': 0 }
      return this.getContent(session.userId, resp)
    }
    catch (err) {
      logger.warn(err);
      return `${session.text('commands.dvc.messages.err')}${String(err)}`
    }
  }

  /**
   * 
   * @param session 当前会话
   * @param next 通过函数
   * @returns 消息
   */

  async middleware1(session: Session, next) {
    const session_id_string: string = session.userId
    if (Object.keys(this.sessions_cmd).indexOf(session_id_string) == -1) {
      return next()
    }
    Object.keys(this.sessions_cmd).forEach((i, _id) => {
      if (i == session_id_string && (session.content.indexOf(this.sessions_cmd[i]) == 0)) {
        if (session.content.length == i.length) {
          session.execute('dvc')
          return next()
        } else {
          session.execute(`dvc ${session.content.replace(this.sessions_cmd[i], '')}`)
          return next()
        }
      }
    })
    return next()
  }

  /**
   * 
   * @param text 要审查的文本
   * @param token 百度审核api的令牌
   * @returns 合规或不合规
   */

  async censor_request(text: string) {
    try {
      const option = {
        'method': 'POST',
        'url': 'https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=' + this.access_token,
        'headers': {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        data: {
          'text': text
        }
      }
      const resp = await this.ctx.http.axios(option)
      if (resp.data.conclusion == '不合规') {
        return false
      } else {
        return true
      }
    } catch (e) {
      logger.warn(String(e))
      return true
    }




  }

  /**
   * 
   * @param session 当前绘画
   * @returns apikey剩余额度
   */

  async get_credit(session: Session) {
    session.send(session.text('commands.dvc.messages.get'))
    try {
      const url: string = "https://chat-gpt.aurorax.cloud/dashboard/billing/credit_grants"
      const res = await this.ctx.http.get(url, {
        headers: {
          "Authorization": "Bearer " + this.config.key
        }
      })
      return session.text('commands.dvc.messages.total_available', [res["total_available"]])
    }
    catch (err) {
      logger.warn(err);
      return `${session.text('commands.dvc.messages.err')}${String(err)}`
    }
  }
  /**
   * 
   * @param userId 用户QQ号
   * @param resp gpt返回的json
   * @returns 文字，图片或聊天记录
   */
  getContent(userId: string, resp: Dvc.Resp) {
    if (this.config.output == 'minimal') {
      return resp.msg[resp.msg.length - 1].content
    } else if (this.config.output == 'default') {
      const result = segment('figure')
      for (var msg of resp.msg) {
        if (msg.role == 'user') {
          result.children.push(
            segment('message', {
              userId: userId,
              nickname: msg.role,
            }, msg.content))
          continue
        }
        if (msg.role == 'assistant') {
          result.children.push(
            segment('message', {
              userId: this.config.selfid,
              nickname: msg.role,
            }, msg.content))
        } else {
          result.children.push(
            segment('message', {
              userId: userId,
              nickname: msg.role,
            }, msg.content))
        }
      }
      return result
    }
    else {
      const elements: Array<Element> = []
      for (var msg of resp.msg) {
        if (msg.role == 'user') {
          elements.push(<div style="color:#723b8d;font-size: 15px;background:transparent;weidth=600px;height:50px,">{msg.role}:{msg.content}</div>)
          continue
        }
        if (msg.role == 'assistant') {
          elements.push(<div style="color:#3b8d4f;font-size: 15px;background:transparent;weidth=600px;height:50px,">{msg.role}:{msg.content}</div>)
        } else {
          elements.push(<div style="color:#723b8d;font-size: 20px;background:transparent;weidth=400px">gpt3.5人格设定:{msg.content}</div>)
        }
      }
      return <html>
        <img style="-webkit-user-select: none; display: block; margin: auto; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); cursor: zoom-in;" src="https://api.dujin.org/bing/m.php" width="600" height="1100"></img>
        <div style='position: absolute;top:20px;left:20px;width:695px;'>
          <p style="color:#723b8d;font-size: 80px">chatgpt3.5-turbo</p>
          {elements}
          <ftooter>create by koishi-plugin-davinci-003__v1.4.2</ftooter>
        </div>

      </html>
    }
  }
  /**
   * 
   * @param obj json对象
   * @returns 深拷贝后得到的对象
   */

  deepClone(obj: Dict) {
    // 原文链接：https://blog.csdn.net/liuyibo0314/article/details/126246181
    let _tmp = JSON.stringify(obj);//将对象转换为json字符串形式
    let result = JSON.parse(_tmp);//将转换而来的字符串转换为原生js对象
    return result;
  };

  /**
   * 
   * @param message 发送给chatgpt的json列表
   * @returns 将返回文字处理成json
   */


  async chat_with_gpt(message: Dvc.Msg[]) {
    const url: string = "https://chat-gpt.aurorax.cloud/v1/chat/completions"
    try {
      const response = await this.ctx.http.axios(
        {
          method: 'post',
          url: 'https://chat-gpt.aurorax.cloud/v1/chat/completions',
          headers: {
            Authorization: `Bearer ${this.config.key}`,
            'Content-Type': 'application/json'
          },
          data: {
            model: 'gpt-3.5-turbo',
            temperature: this.config.temperature,
            max_tokens: this.config.max_tokens,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            messages: message
          }
        })
      return response.data.choices[0].message.content
    }
    catch (error) {
      logger.warn(error)
      return { "msg": [{ "role": "", "content": String(error) }], "id": 1 }
    }
  }

  /**
   * 
   * @param sessionid QQ号
   * @returns 对应QQ的会话
   */

  get_chat_session(sessionid: string) {
    if (Object.keys(this.sessions).indexOf(sessionid) == -1) {
      const _config = this.deepClone(this.session_config)
      _config['id'] = sessionid
      this.sessions[sessionid] = _config
    }
    return this.sessions[sessionid]
  }

  /**
   * 
   * @param msg prompt消息
   * @param sessionid QQ号
   * @returns json消息
   */

  async chat(msg: string, sessionid: string) {

    ///逻辑段参考自<a style="color:yellow" href="https://lucent.blog">Lucent佬</a><br></br>
    try {
      if (msg == '') {
        return '您好，我是人工智能助手，如果您有任何问题，请随时告诉我，我将尽力回答。\n如果您需要重置我们的会话，请回复`重置会话`'
      }
      // 获得对话session
      let session = this.get_chat_session(sessionid)
      if ('重置会话' == msg.slice(0, 4)) {
        // 清除对话内容但保留人设
        session = { "msg": [{ "role": "system", "content": session['msg'][0] }], "id": 1 }
        return '会话已重置'
      }
      if ('重置人格' == msg.slice(0, 4)) {
        // 清空对话内容并恢复预设人设
        session['msg'] = [
          { "role": "system", "content": this.config.preset }
        ]
        return '人格重置成功'
      }
      if ('设置人格' == msg.slice(0, 4)) {
        // 清空对话并设置人设
        session['msg'] = [
          { "role": "system", "content": msg.slice(0, 4) }
        ]
        return '人格设置成功'
      }
      // 设置本次对话内容
      session['msg'].push({ "role": "user", "content": msg })
      // 与ChatGPT交互获得对话内容

      let message = await this.chat_with_gpt(session['msg'])

      // 查看是否出错
      if (message.indexOf("This model's maximum context length is 4096 token") > -1 || JSON.stringify(session).length>this.config.max_tokens) {
        if (session['msg'].length < 2) {
          return '文本过长'
        }
        // 出错就清理一条
        session['msg'] = [session['msg'].slice(0, 1).concat(session['msg'].slice(2, session['msg']).length - 1)]
        // 重新交互

        message = await this.chat(msg, sessionid)
      }
      // 记录上下文
      session['msg'].push({ "role": "assistant", "content": message })
      console.log("会话ID: " + sessionid)
      console.log("ChatGPT返回内容: ")
      console.log(message)
      return this.getContent(sessionid, session)
    }
    catch (error) {
      logger.warn(error)
      return { "msg": [{ "role": "sys", "content": String(error) }], "id": 1 }
    }
  }
}




namespace Dvc {
  export const usage = `
## 注意事项
> 使用前在 <a style="color:yellow" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如需使用内容审查,请前往<a style="color:yellow" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
后端模式下，无需代理，服务端需要同步更新至3月8日2点后的版本，否则会报错<br>
<a style="color:yellow" href="https://github.com/initialencounter/mykoishi/blob/main/davinci-003#readme.md">GPT-3.5turbo自建后端教程</a><br>
对于部署者行为及所产生的任何纠纷， Koishi 及 <a style="color:yellow" href="https://github.com/initialencounter/mykoishi">koishi-plugin-davinci-003</a>概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:yellow" href="/locales">本地化</a>中修改 zh 内容</br>
GPT-3.5turbo后端参考自<a style="color:yellow" href="https://lucent.blog">Lucent佬(呆呆木)</a><br>
反代api使用的是lucent佬(呆呆木)的，再次感谢！
`

  export interface Msg {
    role: string
    content: string
  }
  export interface Resp {
    msg: Array<Msg>
    id: number
  }
  export interface Payload {
    engine: string
    prompt: string
    temperature: number
    max_tokens: number
    top_p: number
    frequency_penalty: number
    presence_penalty: number
  }

  export interface Config {
    AK: string
    SK: string
    type: string
    endpoint: string
    alias: string[]
    key: string
    temperature: number
    max_tokens: number
    authority: number
    waiting: boolean
    usage?: number
    mode: string
    output: string
    selfid: string
    reg: string
    superusr: string[]
    minInterval?: number
    resolution?: string
    preset: string
  }

  export const Config = Schema.intersect([
    Schema.object({
      type: Schema.union([
        Schema.const('gpt3.5' as const).description('GPT-3.5turbo-js,自建后端模式,默认地址为http://127.0.0.1:32336/chat'),
        Schema.const('gpt3.5-js' as const).description('GPT-3.5turbo-js,推荐模式，无需后端'),
        Schema.const('gpt3.5-unit' as const).description('GPT-3.5turbo-unit,超级节俭模式，无需后端，'),
        Schema.const('davinci-003' as const).description('davici等旧模型,无需后端'),
      ] as const).default('gpt3.5-js').description('模型选择'),
    }).description('基础设置'),
    Schema.union([
      Schema.object({
        type: Schema.const('gpt3.5-unit'),
        preset: Schema.string().description('预设人格').default("你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"),
      }),
      Schema.object({
        type: Schema.const('gpt3.5-js'),
        preset: Schema.string().description('预设人格').default("你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"),
      }),
      Schema.object({
        type: Schema.const('gpt3.5'),
        endpoint: Schema.string().description('API 服务器地址。').required(),
        preset: Schema.string().description('预设人格').default("你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"),
      }),
      Schema.object({
        type: Schema.const('davinci-003'),
        temperature: Schema.number().description('偏题程度').default(0),
        mode: Schema.union([
          Schema.const('text-davinci-003').description('语言相关text-davinci-003'),
          Schema.const('text-curie-001').description('语言相关text-curie-001'),
          Schema.const('text-babbage-001').description('语言相关text-babbage-001'),
          Schema.const('text-ada-001').description('语言相关text-ada-001'),
          Schema.const('code-cushman-001').description('代码相关code-cushman-001'),
          Schema.const('code-davinci-003').description('代码相关code-davinci-003')
        ]).description('模型选择').default('text-davinci-003')
      })
    ]),
    Schema.object({
      AK: Schema.string().description('百度智能云内容审核AK'),
      SK: Schema.string().description('内容审核SK防止api-key被封'),
      selfid: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),
      key: Schema.string().description('api_key').required(),
      reg: Schema.string().default('名字[是|叫]“[^,]+”').description('匹配人格的正则表达式'),
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      max_tokens: Schema.number().description('请求长度').default(1024),
      authority: Schema.number().description('允许使用的最低权限').default(1),
      superusr: Schema.array(String).default(['3118087750', '@Eve']).description('可以无限调用的用户,使用特殊指令super'),
      usage: Schema.computed(Schema.number()).description('每人每日可用次数').default(100),
      minInterval: Schema.computed(Schema.number()).default(5000).description('连续调用的最小间隔,单位毫秒。'),
      alias: Schema.array(String).default(['davinci', '达芬奇', 'ai']).description('触发命令;别名'),
      resolution: Schema.union([
        Schema.const('256x256').description('256x256'),
        Schema.const('512x512').description('512x512'),
        Schema.const('1024x1024').description('1024x1024')
      ]).default('1024x1024').description('生成图像的默认比例'),
      output: Schema.union([
        Schema.const('minimal').description('只发送文字消息'),
        Schema.const('default').description('以聊天记录形式发送'),
        Schema.const('verbose').description('将对话转成图片'),
      ]).description('输出方式。').default('default')
    }).description('进阶设置')
  ])

}

/**
 * davinci-003相关模型类
 */

class OpenAI {
  _api_key: string
  ctx: Context
  constructor(api_key: string, ctx: Context,) {
    this._api_key = api_key;
    this.ctx = ctx;
  }

  /**
   * 
   * @param url api地址
   * @param method 请求方法
   * @param opts 配置项
   * @returns 文本
   */

  async _send_request(url: string, method: string, opts: Dvc.Payload) {
    let camelToUnderscore = (key: string) => {
      let result = key.replace(/([A-Z])/g, " $1");
      return result.split(' ').join('_').toLowerCase();
    };
    const data = {};
    for (const key in opts) {
      data[camelToUnderscore(key)] = opts[key];
    }

    const response = await this.ctx.http.axios({
      url,
      headers: {
        'Authorization': `Bearer ${this._api_key}`,
        'Content-Type': 'application/json'
      },
      data: Object.keys(data).length ? data : '',
      method,
    });
    return response.data.choices[0].text;
  }

  async complete(opts: Dvc.Payload) {
    const url = `https://chat-gpt.aurorax.cloud/v1/engines/${opts.engine}/completions`;
    delete opts.engine;
    return await this._send_request(url, 'post', opts);
  }
}

export default Dvc