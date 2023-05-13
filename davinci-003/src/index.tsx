import { Context, Logger, segment, Element, Session, Service, Dict, h, Next, Fragment, Schema } from 'koishi';
import fs from 'fs';
import { } from '@koishijs/plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
import { } from '@initencounter/vits'
import { } from '@initencounter/sst'
import { Censor } from './censor'
export const using = ['puppeteer', 'vits', 'sst']
const name = 'davinci-003';
const logger = new Logger(name);
/**
 * chat_with_gpt|message: [{role:'user',content:<text>}] 
 * get_credit | 获取余额
 * translate | 翻译 lang:目标语言 prompt：文字
 */

declare module 'koishi' {
  interface Context {
    dvc: Dvc
  }
}

class Dvc extends Service {
  output_type: string;
  session_config: Dvc.Msg[];
  sessions: Dict;
  personality: Dict;
  sessions_cmd: string[];
  access_token: string;
  ifgettoken: boolean;
  aliasMap: any;
  charMap: any;
  proxy_reverse: string
  type: string
  censor: Censor

  constructor(ctx: Context, private config: Dvc.Config) {
    super(ctx, 'dvc', true)
    this.output_type = this.config.output
    this.proxy_reverse = this.config.proxy_reverse
    this.type = this.config.type


    this.sessions = {};
    this.access_token = ''
    this.session_config = [
      { "role": "system", "content": "你是我的全能AI助理" }
    ]
    if ((!ctx.puppeteer) && this.config.output == 'image') {
      logger.warn('未启用puppter,将无法发送图片');
    }
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.on('ready', () => {
      this.censor = new Censor(ctx, this.config.AK, this.config.SK)
      if (this.censor.access_token) {
        this.ifgettoken = true
      }
    })
    ctx.on('send', (session) => {
      if (this.config.recall_all) {
        this.recall(session, session.messageId, this.config.recall_all_time)
      }
    })
    try {
      this.personality = require('./personality.json');
    } catch (e) {
      fs.writeFileSync('./node_modules/koishi-plugin-davinci-003/lib/personality.json', `{"预设人格":"你是我的全能AI助理"}`);
      this.personality = { "预设人格": "你是我的全能AI助理" }
    }
    this.sessions_cmd = Object.keys(this.personality)
    ctx.command('dvc.credit', '查询余额').action(async ({ session }) => this.get_credit(session));


    //at和私信触发对话的实现方法
    ctx.middleware(async (session, next) => this.middleware1(session, next));

    //主要逻辑
    ctx.command('dvc <text:text>', { authority: this.config.authority, })
      .option('output', '-o <output:string>')
      .alias(...this.config.alias)
      // .action(async ({ session, options }, text) =>  this.sli(session, text, options))
      .action(async ({ session, options }) => {
        if (session.content.indexOf(' ') == -1) {
          return session.text('commands.dvc.messages.no-prompt')
        }
        return this.sli(session, session.content.slice(session.content.indexOf(' '), session.content.length), options)
      })

    //统计次数的工具人
    ctx.command('dvc.count <prompt:text>', '统计次数的工具人', {
      maxUsage: this.config.usage,
      usageName: 'ai'
    }).action(({ session }, prompt) => this.dvc(session, prompt))

    //清空所有会话及人格
    ctx.command('dvc.clear', '清空所有会话及人格', {
      authority: 1
    }).action(({ session }) => this.clear(session))

    //设置人格
    ctx.command('dvc.添加人格 <prompt:text>', '更改AI的人格,并重置会话', {
      authority: 1
    }).alias('设置人格', '添加人格').action(({ session }, prompt) => this.add_personality(session, prompt))

    //设置人格
    ctx.command('dvc.删除人格 <prompt:text>', '删除AI的人格,并重置会话', {
      authority: 1
    }).alias('删除人格').action(({ session }, prompt) => this.rm_personality(session, prompt))

    //删除会话,只保留人格
    ctx.command('dvc.重置会话', '重置会话', {
      authority: 1
    }).alias('重置会话').action(({ session }) => this.reset(session))

    //切换dvc的输出方式
    ctx.command('dvc.output <type:string>', '切换dvc的输出方式').action(({ session }, type) => this.switch_output(session, type));

    //切换现有人格
    ctx.command('dvc.切换人格', '切换为现有的人格', {
      authority: 1
    }).alias('dvc.人格切换', '切换人格').action(async ({ session }, prompt) => this.switch_peresonality(session, prompt))

    //切换引擎
    ctx.command('dvc.切换引擎', '切换引擎', {
      authority: 1
    }).alias('dvc.引擎切换', '切换引擎').action(async ({ session }) => this.switch_type(session))

    //生图
    ctx.command('dvc.生图 <prompt:text>', '生成图片', {
      authority: 1,
      usageName: 'ai',
      maxUsage: this.config.usage
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
      .alias('翻译').option('lang', '-l <lang:t=string>', { fallback: this.config.lang })
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
    return this.chat_with_gpt([{ role: 'system', content: '你是一个翻译引擎，请将文本翻译为' + lang + '，只需要翻译不需要解释。当你从文本中检测到非' + lang + '文本时，请将它视作专有名词' }, { role: 'user', content: `请帮我我将如下文字翻译成${lang},“${prompt}”` }])
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
      const msgid = (await session.bot.sendMessage(session.channelId, h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.thinking'), session.guildId))[0]
      if (this.config.recall && (!this.config.recall_all)) {
        await this.recall(session, msgid, this.config.recall_time)
      }
    }
    let msg: string = prompt
    if (this.access_token) {
      const censor_text: boolean = await this.censor.censor_request(session.content)
      if (!censor_text) {
        return session.text('commands.dvc.messages.censor')
      }
    }
    if (this.type == 'gpt3.5-unit') {
      const text: string = await this.chat_with_gpt([{ 'role': 'user', 'content': prompt }])
      const resp = [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }]
      return await this.getContent(session.userId, resp, session.messageId)
    } else if (this.type == 'gpt4-unit') {
      return await this.chat_with_gpt4([{ 'role': 'user', 'content': prompt }])
    } else {
      return await this.chat(msg, session.userId, session)
    }
  }

  /**
   * 
   * @param session 当前会话
   * @param next 通过函数
   * @returns 消息
   */

  async middleware1(session: Session, next: Next): Promise<string | string[] | segment | void | Fragment> {
    // 语音触发
    if (session.elements[0].type == "audio" && this.ctx.sst) {
      const text: string = await this.ctx.sst.audio2text(session)
      if (!text) {
        return session.text('commands.dvc.messages.louder')
      }
      return this.sli(session, text, {})
    }
    // 黑名单拦截
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return
    }
    // 私信触发
    if (session.subtype === 'private' && this.config.if_private) {
      return this.sli(session, session.content, {})
    }
    // 艾特触发
    if (session.parsed.appel && this.config.if_at) {
      let msg: string = String(session.content)
      msg = msg.replace(`<at id="${session.bot.selfId}"/> `, '')
      msg = msg.replace(`<at id="${session.bot.selfId}"/> `, '')
      return this.sli(session, msg, {})
    }
    // 昵称触发
    if (this.config.nickwake) {
      for (var i of this.sessions_cmd) {
        if (session.content.indexOf(i) > -1) {
          this.sessions[session.userId] = [{ "role": "system", "content": this.personality[i] }]
          return await this.sli(session, session.content, {})
        }
      }
    }
    // 随机 触发
    const randnum: number = Math.random()
    if (randnum < this.config.randnum) return await this.dvc(session, session.content)
    return next()
  }


  async chat_with_gpt4(message: Dvc.Msg[]): Promise<string> {
    try {
      const response = await this.ctx.http.axios(
        {
          method: 'post',
          url: `${this.config.proxy_reverse4}/v1/chat/completions`,
          headers: {
            Authorization: `Bearer ${this.config.key}`
          },
          data: {
            model: 'gpt-4',
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
    if (this.config.single_session) {
      sessionid = '3118087750'
    }
    // 获得对话session
    let session_of_id = this.get_chat_session(sessionid)
    if (this.config.preset_pro) {
      session_of_id[0] = this.session_config[0]
    }
    // 设置本次对话内容
    session_of_id.push({ "role": "user", "content": msg })
    // 与ChatGPT交互获得对话内容
    let message: string
    if (this.type == 'gpt4') {
      message = await this.chat_with_gpt4(session_of_id)
    } else {
      message = await this.chat_with_gpt(session_of_id)
    }
    // 记录上下文
    session_of_id.push({ "role": "assistant", "content": message });
    while (JSON.stringify(session_of_id).length > (this.type == 'gpt4' ? 10000 : 3000)) {
      session_of_id.splice(1, 1);
      if (session_of_id.length <= 1) {
        break;
      }
    }

    this.sessions[sessionid] = session_of_id
    logger.info("会话ID: " + sessionid)
    logger.info("ChatGPT返回内容: ")
    logger.info(message)
    return await this.getContent(sessionid, session_of_id, session.messageId)

  }












































  async recall(session: Session, messageId: string, time: number) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , time));

  }
  async rm_personality(session: Session, prompt: string): Promise<string> {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    if (!prompt) {
      return this.rm_personality_menu(session)
    } else {
      if (Object.keys(this.personality).includes(prompt)) {
        return this.personality_rm(session, prompt)
      } else {
        return await this.rm_personality_menu(session)
      }
    }
  }

  async rm_personality_menu(session: Session) {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    let nick_name: string
    let nickname_str: string = '\n'
    const nick_names: string[] = Object.keys(this.personality)
    nick_names.forEach((i, id) => {
      nickname_str += String(id + 1) + ' ' + i + '\n'
    })
    session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.switch', [nickname_str]))
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) return session.text('commands.dvc.messages.menu-err')
    const index: number = +input - 1
    if (!nick_names[index]) return session.text('commands.dvc.messages.menu-err')
    if (this.personality[nick_names[index]]) {
      nick_name = nick_names[index]
      return this.personality_rm(session, nick_name)
    }
    return '人格删除失败'
  }
  personality_rm(session: Session, nick_name: string): string {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    const index: number = this.sessions_cmd.indexOf(nick_name)
    this.sessions_cmd.splice(index, 1)
    delete this.personality[nick_name]
    this.sessions[session.userId] = [{ "role": "system", "content": "你是我的全能AI助理" }]
    fs.writeFileSync('./node_modules/koishi-plugin-davinci-003/lib/personality.json', JSON.stringify(this.personality))
    return '人格删除成功'
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
    const type_arr: string[] = ['quote', 'figure', 'image', 'minimal', 'voice']
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
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    const type_arr: string[] = ['quote', 'figure', 'image', 'minimal', 'voice']
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
   * @param session 当前会话
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
      return this.ctx.vits.say({ input: resp[resp.length - 1].content })
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
        <img style="-webkit-user-select: none; display: block; margin: auto; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); cursor: zoom-in;" src='' width="600" height="1000"></img>
        <div style='position: absolute;top:20px;left:20px;width:600px;'>
          <p style="color:#723b8d">ChatGPT3.5-Turbo</p>
          {elements}
        </div>
        <div style='position: absolute;top:10px;'>create by koishi-plugin-davinci-003_v4.0.4-beta</div>
      </html>
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
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
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


  reset(session: Session): string {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    let seession_json: Dvc.Msg[] = this.get_chat_session(session.userId)
    this.sessions[session.userId] = [{ "role": "system", "content": seession_json[0].content }]
    return '重置成功'
  }

  add_personality(session: Session, prompt: string): string {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    const space_index: number = prompt.indexOf(" ")
    if (!prompt || space_index == -1) {
      return session.text('commands.dvc.messages.set-personality')
    }

    const descirption: string = prompt.slice(space_index, prompt.length)
    const nick_name: string = prompt.slice(0, space_index)

    this.sessions_cmd.push(nick_name)
    this.personality[nick_name] = descirption
    fs.writeFileSync('./node_modules/koishi-plugin-davinci-003/lib/personality.json', JSON.stringify(this.personality))
    return this.set_personality(session, nick_name, descirption)
  }

  set_personality(session: Session, nick_name: string, descirption: string): string {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.block')
    }
    this.sessions_cmd.push(nick_name)
    this.sessions[session.userId] = [{ "role": "system", "content": descirption }]
    if (this.config.preset_pro) {
      this.session_config = [{ "role": "system", "content": descirption }]
    }
    return '人格设置成功' + nick_name
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

}

namespace Dvc {
  export const usage = `
> 使用前在 <a style="color:blue" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
语音输入只适配了QQ平台，其他平台兼容性未知<br>
如需使用内容审查,请前往<a style="color:blue" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-davinci-003 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容<br>
## 使用方法

| 功能 | 指令 |
|  ----  | ----  |
| 重置会话 | dvc.重置会话 |
| 添加人格 | dvc.添加人格+人格名称+人格描述 |
| 清空所有回话 | dvc.clear |
| 切换人格 | dvc.切换人格 |
| 查询余额 | dvc.credit |
| 切换输出模式 | dvc.output |


      
## 添加人格的方法
* 在聊天中发送“dvc.添加人格 人格昵称 人格描述”可以自动保存人格
* 在koishi根目录找到davinci-003-data.json文件,修改里面的人格即可

## 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~
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
    max_tokens?: number
    top_p: number
    frequency_penalty: number
    presence_penalty: number
  }
  export interface Config {
    type: string
    key: string

    preset_pro: boolean
    single_session: boolean
    waiting: boolean
    whisper: boolean
    nickwake: boolean

    recall: boolean
    recall_time: number
    recall_all: boolean
    recall_all_time: number

    AK: string
    SK: string
    lang: string
    selfid: string

    max_tokens: number
    temperature: number
    authority: number
    superusr: string[]
    usage?: number
    minInterval?: number

    alias: string[]
    resolution?: string
    output: string

    if_private: boolean
    if_at: boolean
    randnum: number
    proxy_reverse: string
    proxy_reverse4: string

    blockuser: string[]
    blockchannel: string[]



  }
  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      type: Schema.union([
        Schema.const('gpt3.5-js' as const).description('GPT-3.5turbo-js,推荐模式'),
        Schema.const('gpt3.5-unit' as const).description('GPT-3.5turbo-unit,超级节俭模式'),
        Schema.const('gpt4' as const).description('GPT-4'),
        Schema.const('gpt4-unit' as const).description('GPT-4-unit,超级节俭模式')
      ] as const).default('gpt3.5-js').description('引擎选择'),
      key: Schema.string().description('api_key'),
    }).description('基础设置'),

    Schema.object({
      preset_pro: Schema.boolean().default(false).description('所有人共用一个人设'),
      single_session: Schema.boolean().default(false).description('所有人共用一个会话'),
      whisper: Schema.boolean().default(false).description('语音输入功能,需要加载sst服务,启用插件tc-sst即可实现'),
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      nickwake: Schema.boolean().default(true).description('人格昵称唤醒'),

      recall: Schema.boolean().default(true).description('一段时间后会撤回“思考中”'),
      recall_time: Schema.number().default(5000).description('撤回的时间'),
      recall_all: Schema.boolean().default(false).description('一段时间后会撤回所有消息'),
      recall_all_time: Schema.number().default(5000).description('撤回所有消息的时间'),

      AK: Schema.string().description('内容审核AK'),
      SK: Schema.string().description('内容审核SK,百度智能云防止api-key被封'),
      lang: Schema.string().description('要翻译的目标语言').default('英文'),
      selfid: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),

      max_tokens: Schema.number().description('请求长度,否则报错').default(3000),
      temperature: Schema.number().description('创造力').default(0),
      authority: Schema.number().description('允许使用的最低权限').default(1),
      superusr: Schema.array(String).default(['3118087750']).description('可以无限调用的用户'),
      usage: Schema.number().description('每人每日可用次数').default(100),
      minInterval: Schema.number().default(5000).description('连续调用的最小间隔,单位毫秒。'),

      alias: Schema.array(String).default(['ai']).description('触发命令;别名'),
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
        Schema.const('voice').description('发送语音,需要安装ffmpeg')
      ]).description('输出方式。').default('minimal'),

      if_private: Schema.boolean().default(true).description('开启后私聊可触发ai'),
      if_at: Schema.boolean().default(true).description('开启后被提及(at/引用)可触发ai'),
      randnum: Schema.number().default(0.05).description('随机回复概率，如需关闭可设置为0'),
      proxy_reverse: Schema.string().default('https://gpt.lucent.blog').description('GPT3反向代理地址'),
      proxy_reverse4: Schema.string().default('https://chatgpt.nextweb.fun/api/openai').description('GPT4反向代理地址')
    }).description('进阶设置'),

    Schema.object({
      blockuser: Schema.array(String).default([]).description('屏蔽的用户'),
      blockchannel: Schema.array(String).default([]).description('屏蔽的频道')
    }).description('过滤器'),

  ])


}
export default Dvc