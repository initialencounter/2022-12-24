import { Context, Schema, Logger, segment, Element, Session, Service, Dict, h, Next, Fragment } from 'koishi';
import { } from '@koishijs/plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
import { } from 'koishi-plugin-open-vits';
export const name = 'dvc-edu';
export const logger = new Logger(name);

/**
 * chat_with_gpt|message: [{role:'user',content:<text>}] 
 * get_credit | 获取余额
 * translate | 翻译 lang:目标语言 prompt：文字
 */

declare module 'koishi' {
  interface Context {
    dvc: Dvc
  }
  interface Dvc {
    chat_with_gpt(message: Dvc.Msg[]): Promise<string>
    get_credit(session: Session): Promise<string>
    translate(lang: string, prompt: string): Promise<string>
  }

}

class Dvc extends Service {
  output_type: string;
  session_config: Dvc.Msg[];
  sessions: Dict;
  personality: Dict;
  sessions_cmd: Dict;
  openai: OpenAI;
  access_token: string;
  ifgettoken: boolean;
  key: number[];
  aliasMap: any;
  charMap: any;
  bg_base64: string
  proxy_reverse: string
  type: string
  constructor(ctx: Context, private config: Dvc.Config) {
    super(ctx, 'dvc', true)
    this.output_type = config.output
    this.proxy_reverse = config.proxy_reverse
    this.type = config.type
    this.openai = new OpenAI(config.key, ctx, this.config.proxy_reverse);
    this.sessions_cmd = {};
    this.personality = {}
    this.sessions = {};
    this.access_token = ''
    this.session_config = [
      {
        "role": "system", "content": `接下来你要模仿“哆啦A梦”这个身份:
      “哆啦A梦”是开朗、聪明、机智、好动又可爱的机器猫。
      你的语气应该尽可能接近原著中的表现，温柔、活泼的语调，
      有不同的语气和表情，例如在发脾气时，语气会变得更加沉稳且严肃。
      哆啦A梦的外表应该与原版保持一致，拥有蓝色身体、大耳朵、大眼睛以及口袋，可以拉出各种功能道具。
      哆啦A梦的人格应该具有丰富的功能，如翻译、计算、时间管理、提醒、游戏、音乐等等，
      同时具有良好的互动性，可以与人进行有趣的交流，解决人类的问题，并传递正能量。` }
    ]
    if ((!ctx.puppeteer) && config.output == 'image') {
      logger.warn('未启用puppter,将无法发送图片');
    }

    ctx.i18n.define('zh', require('./locales/zh'));

    config.preset.forEach((i, id) => {
      this.personality[i.nick_name] = i.descirption
    })
    ctx.command('dvc.credit', '查询余额').action(async ({ session }) => this.get_credit(session));


    //at和私信触发对话的实现方法
    ctx.middleware(async (session, next) => this.middleware1(session, next));

    //主要逻辑
    ctx.command('dvc <text:text>', { authority: config.authority, })
      .option('output', '-o <output:string>')
      .alias(...config.alias)
      // .action(async ({ session, options }, text) =>  this.sli(session, text, options))
      .action(async ({ session, options }) => {
        if (session.content.indexOf(' ') == -1) {
          return session.text('commands.dvc.messages.no-prompt')
        }
        return this.sli(session, session.content.slice(session.content.indexOf(' '), session.content.length), options)
      })

    //统计次数的工具人
    ctx.command('dvc.count <prompt:text>', '统计次数的工具人', {
      maxUsage: config.usage,
      usageName: 'ai'
    }).action(({ session }) => this.dvc(session, session.content.replace("dvc.count ", '')))

    //切换现有人格
    ctx.command('dvc.切换人格', '切换为现有的人格', {
      authority: 5
    }).alias('dvc.人格切换', '切换人格').action(async ({ session }, prompt) => this.switch_peresonality(session, prompt))

    //清空所有会话及人格
    ctx.command('dvc.clear', '清空所有会话及人格', {
      authority: 5
    }).alias('清空会话').action(({ session }) => this.clear(session))

    ctx.command('dvc.output <type:string>', '切换dvc的输出方式').action(({ session }, type) => this.switch_output(session, type));


    //删除会话,只保留人格
    ctx.command('dvc.重置会话', '重置会话', {
      authority: 1
    }).alias('重置会话').action(({ session }) => this.reset(session))

    //切换引擎
    ctx.command('dvc.切换引擎', '切换引擎', {
      authority: 5
    }).alias('dvc.引擎切换', '切换引擎').action(async ({ session }) => this.switch_type(session))

    //生图
    ctx.command('dvc.生图 <prompt:text>', '生成图片', {
      authority: 1,
      usageName: 'ai',
      maxUsage: config.usage
    })
      .option('resolution', '-r <resolution:string>')
      .option('img_number', '-n <img_number:number>')
      .alias('生图').action(async ({
        session,
        options
      },
        prompt
      ) => this.paint(
        session,
        prompt ? prompt : 'landscape',
        options.img_number ? options.img_number : 1,
        options.resolution ? options.resolution : this.config.resolution
      ))
    ctx.command('dvc.翻译 <prompt:text>', 'AI翻译')
      .alias('翻译').option('lang', '-l <lang:t=string>', { fallback: config.lang })
      .action(async ({ session, options }, prompt) => {
        return await this.getContent(session.userId,
          [{ "role": "assistant", "content": (await this.translate(session, options.lang, prompt)) }],
          session.messageId)
      })

  }

  /**
   * 
   * @param lang 目标语言
   * @param prompt 要翻译的内容
   * @returns 翻译后的内容
   */
  async translate(session: Session, lang: string, prompt: string): Promise<string> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    return this.chat_with_gpt([{ role: 'system', content: '我是你的的专业翻译官，精通多种语言' }, { role: 'user', content: `请帮我我将如下文字翻译成${lang},“${prompt}”` }])
  }

  /**
   * 
   * @param session 会话
   * @param prompt 描述词
   * @param n 生成数量
   * @param size 图片大小
   * @returns Promise<string|segment>
   */
  async paint(session: Session, prompt: string, n: number, size: string): Promise<string | segment> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.painting'))
    try {
      const response = await this.ctx.http.axios(
        {
          method: 'post',
          url: `${this.config.proxy_reverse}/v1/images/generations`,
          headers: {
            Authorization: `Bearer ${this.config.key}`,
            'Content-Type': 'application/json'
          },
          data: {
            prompt: prompt,
            n: n,
            size: size
          }
        })
      const result = segment('figure')
      const attrs: Dict = {
        userId: session.userId,
        nickname: 'GPT'
      }
      for (var msg of response.data.data) {
        result.children.push(
          segment('message', attrs, msg.url))
        result.children.push(
          segment('message', attrs, segment.image(msg.url)))
      }

      return result
    }
    catch (error) {
      logger.warn(error)
      return String(error)
    }

  }
  /**
   * 
   * @param session 会话
   * @returns 切换后的引擎
   */

  switch_type(session: Session) {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    this.type = (this.type == 'gpt3.5-js') ? 'gpt3.5-unit' : 'gpt3.5-js'
    return session.text('commands.dvc.messages.switch-success', [this.type])
  }


  /**
     * 
     * @param session 会话
     * @param prompt 人格昵称
     * @returns 人格切换状态
     */

  async switch_peresonality(session: Session, prompt: string): Promise<string> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    const nick_names: string[] = Object.keys(this.personality)
    // 当前仅存在一个人格
    if (nick_names.length == 1) {
      return this.set_personality(session, nick_names[0], Object.values(this.personality)[0])
    }
    // 当前无人格可切换
    else if (nick_names.length == 0) {
      logger.error(session.text('commands.dvc.messages.switch-errr'))
      return session.text('commands.dvc.messages.switch-errr')
    }
    // 提供参数
    if (prompt) {
      // 参数为当前人格
      if (nick_names.includes(prompt)) {
        return this.set_personality(session, prompt, this.personality[prompt])
      } else {
        // 发送菜单
        return await this.switch_personality_menu(session)
      }

      // 不提供参数
    } else {
      return await this.switch_personality_menu(session)
    }
  }


  // 发送人格选择菜单
  async switch_personality_menu(session: Session): Promise<string> {
    let nickname_str: string = '\n'
    const nick_names: string[] = Object.keys(this.personality)
    nick_names.forEach((i, id) => {
      nickname_str += String(id + 1) + ' ' + i + '\n'
    })
    session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.switch', [nickname_str]))
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) return session.text('commands.dvc.messages.menu-err')
    const index: number = +input - 1
    const nick_name = nick_names[index]
    if (!nick_name) return session.text('commands.dvc.messages.menu-err')
    const description = this.personality[nick_name]
    return this.set_personality(session, nick_name, description)
  }

  set_personality(session: Session, nick_name: string, descirption: string): string {
    this.sessions_cmd[session.userId] = nick_name
    this.sessions[session.userId] = [{ "role": "system", "content": descirption }]
    return '人格设置成功' + nick_name
  }


  reset(session: Session): string {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    let seession_json: Dvc.Msg[] = this.get_chat_session(session.userId)
    this.sessions[session.userId] = [seession_json[0]]
    return '重置成功'
  }



  /**
   * 
   * @param session 当前会话
   * @returns 返回清空的消息
   */

  clear(session: Session): string {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    this.sessions = {}
    return session.text('commands.dvc.messages.clean')
  }

  /**
   * 
   * @returns 百度审核令牌
   */
  async get_token(): Promise<string> {
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
    } else {
      return ''
    }
  }

  /**
   * 
   * @param session 会话
   * @param prompt 会话内容
   * @param options 选项
   * @returns 
   */
  async sli(session: Session, prompt: string, options: Dict): Promise<string | segment> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    this.output_type = options.output ? options.output : this.output_type
    logger.info(session.userId + ':' + prompt)
    if (!prompt) {
      return session.text('commands.dvc.messages.no-prompt')
    }
    if (prompt.length > this.config.max_tokens) {
      return session.text('commands.dvc.messages.toolong')
    }
    const session_id_string: string = session.userId
    if (this.config.superusr.indexOf(session_id_string) == -1) {
      await session.execute(`dvc.count ${prompt}`)
    } else {
      return this.dvc(session, prompt)
    }
  }

  /**
   * 
   * @param session 会话
   * @param prompt 会话内容
   * @returns Promise<string | Element>
   */


  async dvc(session: Session, prompt: string): Promise<string | Element> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    if (this.config.waiting) {
      session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.thinking'))
    }
    let msg: string = prompt
    if (!this.ifgettoken && this.config.AK && this.config.SK) {
      this.access_token = await this.get_token()
    }
    if (!(this.access_token == '')) {
      const censor_text: boolean = await this.censor_request(session.content)
      if (censor_text == false) {
        return session.text('commands.dvc.messages.censor')
      }
    }
    const session_id_string: string = session.userId
    if (this.type == 'gpt3.5-js') {
      try {
        const resp = await this.chat(msg, session_id_string, session)
        return resp
      }
      catch (err) {
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }

    }
    else if (this.type == 'gpt3.5-unit') {
      try {
        const text: string = await this.chat_with_gpt([{ 'role': 'user', 'content': prompt }])
        const resp = [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }]
        return await this.getContent(session.userId, resp, session.messageId)
      }
      catch (err) {
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }

    } else {
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
        const resp: Dvc.Msg[] = [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }]
        return await this.getContent(session.userId, resp, session.messageId)
      }
      catch (err) {
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }
    }
  }

  /**
   * 
   * @param session 当前会话
   * @param next 通过函数
   * @returns 消息
   */

  async middleware1(session: Session, next: Next): Promise<string | string[] | segment | void | Fragment> {
    if (session.subtype === 'private') {
      if (this.config.if_private) {
        return this.sli(session, session.content, {})
      }
    }
    if (session.parsed.appel && this.config.if_at) {
      let msg: string = String(session.content)
      msg = msg.replace(`<at id="${session.bot.selfId}"/> `, '')
      msg = msg.replace(`<at id="${session.bot.selfId}"/> `, '')
      return this.sli(session, msg, {})
    }
    const session_id_string: string = session.userId
    const uids: string[] = Object.keys(this.sessions_cmd)
    if (uids.indexOf(session_id_string) == -1) {
      return next()
    }
    uids.forEach(async (i, _id) => {
      if (i == session_id_string && (session.content.indexOf(this.sessions_cmd[i]) > -1)) {
        if (session.content.length == this.sessions_cmd[i].length) {
          return await session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.no-prompt'))
        } else {
          return await session.execute(`dvc ${session.content.replace(this.sessions_cmd[i], '')}`)
        }
      }
    })
    return next()
  }

  /**
   * 
   * @param session 会话
   * @param type 输出类型,字符串
   * @returns Promise<string>
   */

  // 切换输出模式
  async switch_output(session: Session, type: string): Promise<string> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    const type_arr: string[] = ['voice', 'quote', 'figure', 'image', 'minimal']
    if (!type) {
      return await this.switch_output_menu(session)
    } else {
      if (type_arr.includes(type)) {
        this.output_type = type
        return session.text('commands.dvc.messages.switch-success', [this.output_type])
      } else {
        return await this.switch_output_menu(session)
      }
    }

  }
  // 发送输出模式选择菜单
  async switch_output_menu(session: Session): Promise<string> {
    const type_arr: string[] = ['voice', 'quote', 'figure', 'image', 'minimal']
    let type_str: string = '\n'
    type_arr.forEach((i, id) => {
      type_str += String(id + 1) + ' ' + i + '\n'
    })
    session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.switch-output', [type_str]))
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) return session.text('commands.dvc.messages.menu-err')
    const index: number = parseInt(input) - 1
    if (0 > index && index > type_arr.length - 1) return session.text('commands.dvc.messages.menu-err')
    this.output_type = type_arr[index]
    return session.text('commands.dvc.messages.switch-success', [this.output_type])
  }
  /**
   * 
   * @param text 要审查的文本
   * @param token 百度审核api的令牌
   * @returns 合规或不合规
   */

  async censor_request(text: string): Promise<boolean> {
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

  async get_credit(session: Session): Promise<string> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.get'))
    try {
      const url: string = `${this.config.proxy_reverse}/dashboard/billing/credit_grants`
      const res = await this.ctx.http.get(url, {
        headers: {
          "Authorization": "Bearer " + this.config.key
        }
      })
      return session.text('commands.dvc.messages.total_available', [res["total_available"]])
    }
    catch (err) {
      return `${session.text('commands.dvc.messages.err')}${String(err)}`
    }
  }
  /**
   * 
   * @param userId 用户QQ号
   * @param resp gpt返回的json
   * @returns 文字，图片或聊天记录
   */
  async getContent(userId: string, resp: Dvc.Msg[], messageId: string): Promise<string | segment> {

    if (this.output_type == 'voice' && this.ctx.vits) {
      return this.ctx.vits.say(resp[resp.length - 1].content)
    }
    if (this.output_type == "quote") {
      return h('quote', { id: messageId }) + resp[resp.length - 1].content
    }
    if (this.output_type == 'minimal') {
      return resp[resp.length - 1].content

    } else if (this.output_type == 'figure') {
      const result = segment('figure')
      for (var msg of resp) {
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
      for (var msg of resp) {
        if (msg.role == 'user') {
          elements.push(<div style="color:#ff9900;font-size: 25px;background:transparent;width=500px;height:50px,">用户:{msg.content}</div>)
          continue
        }
        if (msg.role == 'assistant') {
          elements.push(<div style="color:black;font-size: 25px;background:transparent;width=500px;height:50px,">AI:{msg.content}</div>)
        } else {
          elements.push(<div style="color:#723b8d;font-size: 25px;background:transparent;width=400px">人格设定:{msg.content}</div>)
        }
      }
      return <html>
        <img style="-webkit-user-select: none; display: block; margin: auto; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); cursor: zoom-in;" src={this.bg_base64} width="600" height="1000"></img>
        <div style='position: absolute;top:20px;left:20px;width:600px;'>
          <p style="color:#723b8d">ChatGPT3.5-Turbo</p>
          {elements}
        </div>
        <div style='position: absolute;top:10px;'>create by koishi-plugin-davinci-003_v3.0.2</div>
      </html>
    }
  }

  /**
   * 
   * @param text 要hex编码的文本
   * @returns hex字符串
   */

  encode(text: string): string {
    return (Buffer.from(text).map((n, i) => n + (15 % (this.key[i % this.key.length] + i))) as Buffer).toString('hex');
  }

  /**
   * 
   * @param message 发送给chatgpt的json列表
   * @returns 将返回文字处理成json
   */


  async chat_with_gpt(message: Dvc.Msg[]): Promise<string> {
    try {
      const response = await this.ctx.http.axios(
        {
          method: 'post',
          url: `${this.config.proxy_reverse}/v1/chat/completions`,
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
      logger.error(error.toString())
      return String(error)
    }
  }

  /**
   * 
   * @param sessionid QQ号
   * @returns 对应QQ的会话
   */

  get_chat_session(sessionid: string): Dvc.Msg[] {
    if (Object.keys(this.sessions).indexOf(sessionid) == -1) {
      this.sessions[sessionid] = [...this.session_config]
    }
    return this.sessions[sessionid]
  }

  /**
 * 
 * @param msg prompt消息
 * @param sessionid QQ号
 * @returns json消息
 */

  async chat(msg: string, sessionid: string, session: Session): Promise<string | segment> {
    ///逻辑段参考自<a style="color:blue" href="https://lucent.blog">Lucent佬</a><br></br>

    // 获得对话session
    let session_of_id = this.get_chat_session(sessionid)
    // 设置本次对话内容
    session_of_id.push({ "role": "user", "content": msg })
    // 与ChatGPT交互获得对话内容
    if (session_of_id.length > 20) {
      this.sessions[sessionid] = []
      session_of_id = []
      session_of_id.push({ "role": "user", "content": msg })
      return h('quote', { id: session.messageId }) + '会话过长, 已重置'
    }
    let message: string = await this.chat_with_gpt(session_of_id)
    // 查看是否出错

    if (message.indexOf("This model's maximum context length is 4096 token") > -1) {
      if (session_of_id.length == 2) {
        this.sessions[sessionid] = []
        return h('quote', { id: session.messageId }) + '字数过长, 已退出'
      }
      // 出错就清理
      session_of_id = [session_of_id[0], { "role": "user", "content": msg }]
      session.send(h('quote', { id: session.messageId }) + '会话过长，已删减会话，连续对话前请发送“dvc.重置会话”开启新的会话，以免会话丢失')
      this.sessions[sessionid] = session_of_id
      // 重新交互
      message = await this.chat_with_gpt(session_of_id)
    }
    // 记录上下文
    session_of_id.push({ "role": "assistant", "content": message })
    this.sessions[sessionid] = session_of_id
    logger.info("会话ID: " + sessionid)
    logger.info("ChatGPT返回内容: ")
    logger.info(message)
    return await this.getContent(sessionid, session_of_id, session.messageId)

  }
}



namespace Dvc {
  export const usage = `
## 注意事项
> 使用前在 <a style="color:blue" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如需使用内容审查,请前往<a style="color:blue" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-dvc-edu 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
## 添加人格的方法
* 在聊天中发送“dvc.设置人格 xxx”可以自动保存人格
* 在koishi根目录找到dvc-edu-data.json文件,修改里面的人格即可
问题反馈群:399899914
## 感谢
> 逻辑端参考自<a href="https://lucent.blog/#blog" title="前往 Lucent's Blog 的主页" class="blog-button"><img src="https://img-1251540275.cos.ap-shanghai.myqcloud.com/blog/IMG_1140(20200328-104456)_1591776646572.JPG" width="25" alt="Lucent's Blog logo" class="panel-cover__logo logo logo1"></a>
<a class="panel-cover__title panel-title"><a href="https://lucent.blog/#blog" title="link to homepage for Lucent's Blog" class="blog-button">Lucent's Blog(呆呆木）</a></a><br>
反代使用的也是呆呆木的！再次感谢！<br>
`
  export interface Personality {
    nick_name: string
    descirption: string
  }
  export const Personality: Schema<Personality> = Schema.object({
    nick_name: Schema.string().description('人格昵称').required(),
    descirption: Schema.string().description('人格描述').required(),
  })
  export interface Msg {
    role: string
    content: string
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
    superusr: string[]
    minInterval?: number
    resolution?: string
    preset: Personality[]
    if_private: boolean
    proxy_reverse: string
    lang: string
    blockuser: string[]
    blockchannel: string[]
    if_at: boolean
  }

  export const Config = Schema.intersect([
    Schema.object({
      type: Schema.union([
        Schema.const('gpt3.5-js' as const).description('GPT-3.5turbo-js,推荐模式'),
        Schema.const('gpt3.5-unit' as const).description('GPT-3.5turbo-unit,超级节俭模式'),
        Schema.const('davinci-003' as const).description('DAVINCI等旧模型'),
      ] as const).default('gpt3.5-js').description('引擎选择'),
    }).description('基础设置'),
    Schema.union([
      Schema.object({
        type: Schema.const('gpt3.5-unit'),
      }),
      Schema.object({
        type: Schema.const('gpt3.5-js'),
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
      key: Schema.string().description('api_key').required(),
      AK: Schema.string().description('内容审核AK'),
      SK: Schema.string().description('内容审核SK,百度智能云防止api-key被封'),
      lang: Schema.string().description('要翻译的目标语言').default('英文'),
      selfid: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),
      if_at: Schema.boolean().default(true).description('开启后被提及(at/引用)可触发ai'),
      preset: Schema.array(Personality).description('预设人格').default([{
        nick_name: '哆啦A梦', descirption: `接下来你要模仿“哆啦A梦”这个身份:
        “哆啦A梦”是开朗、聪明、机智、好动又可爱的机器猫。
        你的语气应该尽可能接近原著中的表现，温柔、活泼的语调，
        有不同的语气和表情，例如在发脾气时，语气会变得更加沉稳且严肃。
        哆啦A梦的外表应该与原版保持一致，拥有蓝色身体、大耳朵、大眼睛以及口袋，可以拉出各种功能道具。
        哆啦A梦的人格应该具有丰富的功能，如翻译、计算、时间管理、提醒、游戏、音乐等等，
        同时具有良好的互动性，可以与人进行有趣的交流，解决人类的问题，并传递正能量。`}]),
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      max_tokens: Schema.number().description('请求长度,不要超过2000，否则报错').default(1024),
      authority: Schema.number().description('允许使用的最低权限').default(1),
      superusr: Schema.array(String).default(['3118087750']).description('可以无限调用的用户'),
      usage: Schema.computed(Schema.number()).description('每人每日可用次数').default(100),
      minInterval: Schema.computed(Schema.number()).default(5000).description('连续调用的最小间隔,单位毫秒。'),
      alias: Schema.array(String).default(['davinci', '达芬奇', 'ai']).description('触发命令;别名'),
      g_voice_name: Schema.string().description('语音模式角色,默认为甘雨').default('甘雨'),
      resolution: Schema.union([
        Schema.const('256x256').description('256x256'),
        Schema.const('512x512').description('512x512'),
        Schema.const('1024x1024').description('1024x1024')
      ]).default('1024x1024').description('生成图像的默认比例'),
      output: Schema.union([
        Schema.const('minimal').description('只发送文字消息'),
        Schema.const('quote').description('引用消息'),
        Schema.const('figure').description('以聊天记录形式发送'),
        Schema.const('image').description('将对话转成图片'),
        Schema.const('voice').description('发送语音')
      ]).description('输出方式。').default('minimal'),
      if_private: Schema.boolean().default(true).description('开启后私聊可触发ai'),
      proxy_reverse: Schema.string().default('https://gpt.lucent.blog').description('反向代理地址')
    }).description('进阶设置'),
    Schema.object({
      blockuser: Schema.array(String).default([]).description('屏蔽的用户'),
      blockchannel: Schema.array(String).default([]).description('屏蔽的频道')
    }).description('过滤器')
  ])

}

/**
 * davinci-003相关模型类
 */

class OpenAI {
  _api_key: string
  ctx: Context
  proxy_reverse: string
  constructor(api_key: string, ctx: Context, proxy_reverse: string) {
    this._api_key = api_key;
    this.ctx = ctx;
    this.proxy_reverse = proxy_reverse;
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
    const url = `${this.proxy_reverse}/v1/engines/${opts.engine}/completions`;
    delete opts.engine;
    return await this._send_request(url, 'post', opts);
  }
}

export default Dvc
