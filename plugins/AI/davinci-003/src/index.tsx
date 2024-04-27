import { Context, Logger, segment, Element, Session, Dict, h, Next, Fragment, trimSlash } from 'koishi';
import fs, { readFileSync } from 'fs';
import { } from 'koishi-plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
import { } from '@initencounter/vits'
import { } from '@initencounter/sst'
import { } from '@koishijs/censor'
import { } from '@koishijs/plugin-console'
import { resolve } from 'path';
import { recall, switch_menu, switch_menu_grid } from './utils'
import { Dvc } from './type'
const name = 'davinci-003';
const logger = new Logger(name);
type ChatCallback = (session: Session, session_of_id: Dvc.Msg[]) => Promise<string>;
declare module '@koishijs/plugin-console' {
  interface Events {
    'davinci-003/getproxy'(): string
    'davinci-003/getcredit'(key: string): Promise<number>
    'davinci-003/getusage'(): string
  }
}

declare module 'koishi' {
  interface Context {
    dvc: DVc
  }
}
const version = require('../package.json')["version"]
const localUsage = readFileSync(resolve(__dirname, "../readme.md")).toString('utf-8').split("更新日志")[0];
class DVc extends Dvc {
  constructor(ctx: Context, config: Dvc.Config) {
    super(ctx, config)
    this.output_type = config.output
    this.type = config.type
    this.key_number = 0
    this.sessions = {};
    this.maxRetryTimes = config.maxRetryTimes
    ctx.i18n.define('zh', require('./locales/zh'));

    ctx.on('ready', () => {
      if ((!ctx.puppeteer) && config.output == 'image') {
        logger.warn('未启用puppter，将无法发送图片消息');
      }
      if ((!ctx.vits) && config.output == "voice") {
        logger.warn('未启用vits，将无法输出语音');
      }
    })
    ctx.inject(['console'], (ctx) => {
      ctx.console.addEntry({
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      })
    })

    ctx.on('send', (session) => {
      if (config.recall_all) {
        recall(session, session.messageId, config.recall_all_time)
      }
    })
    try {
      this.personality = JSON.parse(fs.readFileSync('./personality.json', 'utf-8'));
    } catch (e) {
      this.personality = { "预设人格": [{ "role": "system", "content": "你是我的全能AI助理" }] }
      fs.writeFileSync('./personality.json', JSON.stringify(this.personality, null, 2));
    }
    this.session_config = Object.values(this.personality)[0]
    this.sessions_cmd = Object.keys(this.personality)
    ctx.command('dvc.credit', '查询余额').action(async ({ session }) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      }
      session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.get'))
      const credit = await this.get_credit()
      return session.text('commands.dvc.messages.total_available', [credit])
    });


    //at和私信触发对话的实现方法
    ctx.middleware(async (session, next) => {
      if (this.block(session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.middleware1(session, next)
    });

    //主要逻辑
    ctx.command('dvc <text:text>', { authority: config.authority, })
      .option('output', '-o <output:string>')
      .alias(...config.alias)
      .action(async ({ session, options }, ...prompt) => {
        if (this.block(session as Session)) {
          return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
        }
        return this.sli(session as Session, prompt.join(" "), options)
      })

    //统计次数的工具人
    ctx.command('dvc.count <prompt:text>', '统计次数的工具人', {
      maxUsage: config.usage,
      usageName: 'ai'
    }).action(({ session }, ...prompt) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.dvc(session as Session, prompt.join(" "))
    })

    //清空所有会话及人格
    ctx.command('dvc.clear', '清空所有会话及人格', {
      authority: 1
    }).action(({ session }) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.clear(session as Session)
    })

    //设置人格
    ctx.command('dvc.添加人格 <prompt:text>', '更改AI的人格,并重置会话', {
      authority: 1
    }).action(({ session }, prompt) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      }
      session.send("添加人格失败？看这里！\n https://forum.koishi.xyz/t/topic/2349/4")
      return this.add_personality(session as Session, prompt)
    })


    //设置人格
    ctx.command('dvc.删除人格 <prompt:text>', '删除AI的人格,并重置会话', {
      authority: 1
    }).action(({ session }, prompt) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.rm_personality(session as Session, prompt)
    }
    )

    //删除会话,只保留人格
    ctx.command('dvc.重置会话', '重置会话', {
      authority: 1
    }).alias('重置会话').action(({ session }) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      }
      return this.reset(session as Session)
    })

    //切换dvc的输出方式
    ctx.command('dvc.output <type:string>', '切换dvc的输出方式').action(({ session }, type) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.switch_output(session as Session, type)
    });

    //切换现有人格
    ctx.command('dvc.切换人格 <prompt:text>', '切换为现有的人格', {
      authority: 1
    }).alias('dvc.人格切换', '切换人格').action(async ({ session }, prompt) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.switch_peresonality(session as Session, prompt)
    })

    //切换引擎
    ctx.command('dvc.切换引擎 <prompt:text>', '切换引擎', {
      authority: 1
    }).alias('dvc.引擎切换', '切换引擎').action(async ({ session }, prompt) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.switch_type(session as Session, prompt)
    })

    //生图
    ctx.command('dvc.生图 <prompt:text>', '生成图片', {
      authority: 1,
      usageName: 'ai',
      maxUsage: config.usage
    })
      .option('resolution', '-r <resolution:string>')
      .option('img_number', '-n <img_number:number>')
      .action(async ({
        session,
        options
      },
        prompt
      ) => {
        if (this.block(session as Session)) {
          return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
        } return this.paint(
          session as Session,
          prompt ? prompt : 'landscape',
          options.img_number ? options.img_number : 1,
          options.resolution ? options.resolution : config.resolution
        )
      })
    ctx.command('dvc.翻译 <prompt:text>', 'AI翻译')
      .option('lang', '-l <lang:t=string>', { fallback: config.lang })
      .action(async ({ session, options }, prompt) => {
        if (this.block(session as Session)) {
          return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
        }
        return await this.translate(session as Session, options.lang, prompt)
      })
    ctx.command('dvc.update', '一键加载400条极品预设', { authority: 4 })
      .alias('dvc.更新预设')
      .option('displace', '-d')
      .action(async ({ session, options }) => {
        if (this.block(session as Session)) {
          return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
        }
        let prompts_latest = (await ctx.http.get(
          'https://gitee.com/initencunter/ChatPrompts/raw/master/safe', {
          responseType: "text"
        }));
        const prompts_latest_ = JSON.parse(Buffer.from(prompts_latest, 'base64').toString('utf-8'));
        if (options.displace) {
          await session.send("该选项将会导致人格丢失，其否继续[Y/n]?")
          const confirm = await session.prompt(60000)
          if (!confirm) return
          if (confirm.toLowerCase() !== 'y') return session.send("取消切换")
          this.personality = prompts_latest_;
        } else {
          for (const i of Object.keys(prompts_latest_)) {
            this.personality[i] = prompts_latest_[i];
          }
        }
        fs.writeFileSync('./personality.json', JSON.stringify(this.personality, null, 2));
        logger.info("更新预设成功");
        return session.execute('切换人格');
      })

    ctx.command('dvc.cat', '显示一个对话')
      .alias('dvc.会话人格')
      .option('all', '-a --all 显示所有字数')
      .option('personality', '-p <personality:string> 指定人格昵称')
      .option('id', '-i <id:number> 指定会话ID，默认为0')
      .action(async ({ session, options }) => {
        if (this.block(session as Session)) {
          return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
        }
        if (options?.personality) {
          return JSON.stringify(this.personality[options?.personality ?? "预设人格"])
        }
        const sid = options.id ?? 0
        let text = (this.sessions[session.userId]?.[sid] ?? this.session_config[0]).content
        if (!options.all && text.length > 200) {
          text = text.slice(0, 200) + '...'
        }
        return text
      })

    ctx.console.addListener('davinci-003/getproxy', () => {

      if (config.type == 'gpt3.5') {
        return config.proxy_reverse
      }
      return config.proxy_reverse4

    })
    ctx.console.addListener('davinci-003/getcredit', async (key?: string) => {
      if (!key) {
        key = this.ctx.config.key[this.key_number]
      }
      return await this.get_credit2(key ?? this.ctx.config.key[this.key_number])
    })
    ctx.console.addListener('davinci-003/getusage', () => {
      return localUsage
    })
  }


  /**
   * 
   * @param lang 目标语言
   * @param prompt 要翻译的内容
   * @returns 翻译后的内容
   */
  async translate(session: Session, lang: string, prompt: string): Promise<string> {
    return this.try_control(this.chat_with_gpt, session as Session, [{ role: 'system', content: '你是一个翻译引擎，请将文本翻译为' + lang + '，只需要翻译不需要解释。' }, { role: 'user', content: `请帮我我将如下文字翻译成${lang},“${prompt}”` }])
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
    session.send(h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.painting'))
    try {
      const response = await this.ctx.http.post(
        trimSlash(`${this.ctx.config.proxy_reverse ? this.ctx.config.proxy_reverse : "https://api.openai.com"}/v1/images/generations`),
        {
          prompt: prompt,
          n: n,
          size: size
        }, {
        timeout: 0,
        headers: {
          Authorization: `Bearer ${this.ctx.config.key[this.key_number]}`,
          'Content-Type': 'application/json',
        },
      })
      const result = segment('figure')
      const attrs: Dict = {
        userId: session.userId,
        nickname: 'GPT'
      }
      for (var msg of response.data) {
        result.children.push(
          segment('message', attrs, msg.url))
        result.children.push(
          segment('message', attrs, segment.image(msg.url)))
      }
      return result
    }
    catch (e) {
      return session.text('commands.dvc.messages.err', [`key${this.key_number + 1} 报错：${String(e)}`])
    }

  }


  /**
   * 
   * @param session 会话
   * @param prompt 会话内容
   * @param options 选项
   * @returns 
   */
  async sli(session: Session, prompt: string, options: Dict): Promise<string | segment | void> {
    if (!prompt && !session.quote?.content) {
      return session.text('commands.dvc.messages.no-prompt')
    }
    this.output_type = options.output ? options.output : this.output_type

    if (prompt.length > this.ctx.config.max_tokens) {
      return session.text('commands.dvc.messages.toolong')
    }
    const session_id_string: string = session.userId
    if (this.ctx.config.superusr.indexOf(session_id_string) == -1) {
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


  async dvc(session: Session, prompt: string): Promise<string | Element | void> {
    if (this.ctx.config.waiting) {
      const msgid = (await session.bot.sendMessage(session.channelId, h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.thinking'), session.guildId))[0]
      if (this.ctx.config.recall && (!this.ctx.config.recall_all)) {
        await recall(session, msgid, this.ctx.config.recall_time)
      }
    }
    // 文本审核
    if (this.ctx.censor) {
      prompt = await this.ctx.censor.transform(prompt, session)
    }
    if (this.type == 'gpt3.5-unit') {
      const text: string = await this.try_control(this.chat_with_gpt, session, [{ 'role': 'user', 'content': prompt }])
      const resp = [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }]
      return await this.getContent(session.userId, resp, session.messageId)
    } else if (this.type == 'gpt4-unit') {
      return await this.try_control(this.chat_with_gpt4, session, [{ 'role': 'user', 'content': prompt }])
    } else {
      return await this.chat(prompt, session.userId, session)
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
    if (session.elements[0]?.type == "audio" && this.ctx.sst) {
      const text: string = await this.ctx.sst.audio2text(session)
      if (!text) {
        return session.text('commands.dvc.messages.louder')
      }
      return this.sli(session, text, {})
    }
    // 黑名单拦截
    if (this.ctx.config.blockuser.includes(session.userId) || this.ctx.config.blockchannel.includes(session.channelId)) {
      return
    }
    // 私信触发
    if (session.subtype === 'private' && this.ctx.config.if_private) {
      return this.sli(session, session.content, {})
    }
    // 艾特触发
    if (session.elements[0]?.type == "at" && session.elements[0].attrs.id === session.bot.selfId && this.ctx.config.if_at) {
      let msg: string = ''
      for (let i of session.elements.slice(1,)) {
        if (i.type === 'text') {
          msg += i?.attrs?.content
        }
      }
      return this.sli(session, msg, {})
    }
    // 昵称触发
    if (this.ctx.config.nickwake) {
      for (var i of this.sessions_cmd) {
        if (session.content.startsWith(i)) {
          this.sessions[session.userId] = this.personality[i]
          return await this.sli(session, session.content, {})
        }
      }
    }
    // 随机触发
    if (this.ctx.config.randnum == 0) return next()
    const randnum: number = Math.random()
    if (randnum < this.ctx.config.randnum) return await this.dvc(session, session.content)
    return next()
  }
  async chat_with_gpt4(_session: Session, message: Dvc.Msg[]): Promise<string> {
    try {
      const response = await this.ctx.http.post(
        trimSlash(`${this.ctx.config.proxy_reverse4}/v1/chat/completions`),
        {
          model: this.ctx.config.appointModel,
          messages: message
        }, {
        timeout: 0,
        headers: {
          Authorization: `Bearer ${this.ctx.config.key[this.key_number]}`
        },
      })
      return response.choices[0].message.content
    }
    catch (e) {
      this.switch_key(e)
      return ''
    }
  }
  /**
   * 
   * @param message 发送给chatgpt的json列表
   * @returns 将返回文字处理成json
   */


  async chat_with_gpt(_session: Session, message: Dvc.Msg[]): Promise<string> {
    try {
      const response = await this.ctx.http.post(
        trimSlash(`${this.ctx.config.proxy_reverse ? this.ctx.config.proxy_reverse : "https://api.openai.com"}/v1/chat/completions`),
        {
          model: this.ctx.config.appointModel,
          temperature: this.ctx.config.temperature,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          messages: message
        }, {
        timeout: 0,
        headers: {
          Authorization: `Bearer ${this.ctx.config.key[this.key_number]}`,
          'Content-Type': 'application/json'
        }
      })
      return response.choices[0].message.content
    }
    catch (e) {
      this.switch_key(e)
      return ''
    }
  }
  /**
   * 切换下一个 key
   */
  key_number_pp() {
    this.key_number++
    // 数组越界
    if (this.key_number === this.ctx.config.key.length) {
      this.key_number = 0
    }
  }
  /**
   * 先查询余额 ,如果余额为 0，切换key
   * @param session 会话
   * @param e Error
   */

  async switch_key(e: Error) {
    // 查询余额
    const credit = await this.get_credit()
    logger.info(`key${this.key_number + 1}. ${this.ctx.config.key[this.key_number]} 报错，余额${credit}：${String(e)}`)
    // 余额为 0 ,切换 key
    this.key_number_pp()
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
    logger.info((session.author?.nick || session.username) + ':' + msg)
    if (this.ctx.config.single_session) {
      sessionid = '3118087750'
    }
    // 获得对话session
    let session_of_id = this.get_chat_session(sessionid)
    if (this.ctx.config.preset_pro) {

      session_of_id[0] = this.session_config[0]
    }
    // 设置本次对话内容
    session_of_id.push({ "role": "user", "content": msg })
    // 与ChatGPT交互获得对话内容
    let message: string
    if (this.type == 'gpt4') {
      message = await this.try_control(this.chat_with_gpt4, session, session_of_id)
    } else {
      message = await this.try_control(this.chat_with_gpt, session, session_of_id)
    }
    // 记录上下文
    session_of_id.push({ "role": "assistant", "content": message });
    while (JSON.stringify(session_of_id).length > 10000) {
      session_of_id.splice(1, 1);
      if (session_of_id.length <= 1) {
        break;
      }
    }

    this.sessions[sessionid] = session_of_id
    logger.info("ChatGPT返回内容: ")
    logger.info(message)
    return await this.getContent(sessionid, session_of_id, session.messageId)

  }

  /**
   * 
   * @param cb chat 回调函数 chat_with_gpt | chat_with_gpt4
   * @param session 会话
   * @param session_of_id 会话 ID
   * @returns 
   */
  async try_control(cb: ChatCallback, session: Session, session_of_id: Dvc.Msg[]) {
    let try_times = 0;
    while (try_times < this.ctx.config.maxRetryTimes) {
      const res = await cb.bind(this)(session, session_of_id)
      if (res !== '') {
        return res
      }
      try_times++
      await this.ctx.sleep(500)
    }
    return `请求错误，请查看日志`
  }








































  /**
   * 是否被屏蔽
   * @param session 
   * @returns 
   */

  block(session: Session) {
    if (this.ctx.config.blockuser.includes(session.userId) || this.ctx.config.blockchannel.includes(session.channelId)) {
      return true
    }
  }

  /**
   * 删除人格逻辑
   * @param session 
   * @param nick_name 
   * @returns 
   */
  async rm_personality(session: Session, nick_name?: string) {
    const nick_names: string[] = Object.keys(this.personality)
    if (nick_names.length == 1) {
      return '再删下去就报错了'
    }
    // 参数合法
    if (nick_name && nick_names.indexOf(nick_name) > -1) {
      return this.personality_rm(session, [nick_name])
    }
    const input = await switch_menu_grid(session, nick_names, '人格')
    if (!input) {
      return session.text('commands.dvc.messages.menu-err')
    }
    return this.personality_rm(session, input)
  }

  /**
   * 删除人格
   * @param session 会话
   * @param nick_name 人格名称
   * @returns 字符串
   */

  personality_rm(session: Session, nick_name: string[]): string {
    for (var nick_name_0 of nick_name) {
      const index: number = this.sessions_cmd.indexOf(nick_name_0)
      this.sessions_cmd.splice(index, 1)
      delete this.personality[nick_name_0]
    }
    this.sessions[session.userId] = [{ "role": "system", "content": "你是我的全能AI助理" }]
    fs.writeFileSync('./personality.json', JSON.stringify(this.personality, null, 2))
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
    const type_arr: string[] = ['quote', 'figure', 'image', 'minimal', 'voice']
    if (type && type_arr.indexOf(type) > -1) {
      this.output_type = type
      return session.text('commands.dvc.messages.switch-success', [type])
    }
    const input = await switch_menu(session, type_arr, '输出模式')
    if (!input) {
      return session.text('commands.dvc.messages.menu-err')
    }
    this.output_type = input
    return session.text('commands.dvc.messages.switch-success', ['输出模式', input])

  }


  /**
   * 
   * @param session 当前会话
   * @returns apikey剩余额度
   */

  async get_credit(): Promise<number> {
    if ((this.ctx.config.type.startsWith('gpt4') ? this.ctx.config.proxy_reverse4 : this.ctx.config.proxy_reverse).indexOf('anywhere') > -1) {
      return this.get_credit_peiqi(this.ctx.config.key[this.key_number])
    }
    try {
      const url: string = trimSlash(`${this.ctx.config.proxy_reverse ? this.ctx.config.proxy_reverse : "https://api.openai.com"}/v1/dashboard/billing/subscription`)
      const res = await this.ctx.http.get(url, {
        headers: {
          "Authorization": "Bearer " + this.ctx.config.key[this.key_number]
        },
        timeout: 600000
      })
      return res["hard_limit_usd"]
    }
    catch (e) {
      if (String(e).includes('401')) {
        return 0
      }
      return -1
    }
  }
  async get_credit_peiqi(key: string): Promise<number> {
    try {
      const url = 'https://api.chatanywhere.org/v1/query/balance'
      const res = await this.ctx.http.post(url, {}, {
        headers: { "Authorization": key, 'Content-Type': 'application/json' }
      })
      const credit = res['balanceTotal'] - res['balanceUsed']
      return credit
    } catch (e) {
      return -1
    }
  }
  async get_credit2(key: string): Promise<number> {
    if ((this.ctx.config.type.startsWith('gpt4') ? this.ctx.config.proxy_reverse4 : this.ctx.config.proxy_reverse).indexOf('anywhere') > -1) {
      return this.get_credit_peiqi(key)
    }
    try {

      const url: string = trimSlash(`${(this.ctx.config.type.startsWith('gpt4') ? this.ctx.config.proxy_reverse4 : this.ctx.config.proxy_reverse) ?? "https://api.openai.com"}/v1/dashboard/billing/subscription`)

      const res = await this.ctx.http.get(url, {
        headers: {
          "Authorization": "Bearer " + key
        },
      })
      return res["hard_limit_usd"]
    }
    catch (e) {
      return -1
    }
  }
  /**
   * 
   * @param userId 用户QQ号
   * @param resp gpt返回的json
   * @returns 文字，图片或聊天记录
   */
  async getContent(userId: string, resp: Dvc.Msg[], messageId: string) {
    if (this.output_type == 'voice' && this.ctx.vits) {
      return this.ctx.vits.say({ input: resp[resp.length - 1].content })
    }
    if (this.output_type == "quote") {
      return h.text(h('quote', { id: messageId }) + (resp[resp.length - 1].content))
    }
    if (this.output_type == 'minimal') {
      return h.text(resp[resp.length - 1].content)

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
              userId: this.ctx.config.selfid,
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
        <div style='position: absolute;top:10px;'>create by koishi-plugin-davinci-003@{version}</div>
      </html>
    }
  }

  /**
   * 
   * @param session 会话
   * @returns 切换后的引擎
   */

  /**
   * 
   * @param session 会话
   * @returns 切换后的引擎
   */

  async switch_type(session: Session, type?: string) {
    const type_arr: string[] = ['gpt3.5-js', 'gpt3.5-unit', 'gpt4', 'gpt4-unit']
    if (type && type_arr.indexOf(type) > -1) {
      this.type = type
      return session.text('commands.dvc.messages.switch-success', ['引擎', type])
    }
    const input = await switch_menu(session, type_arr, '引擎')
    if (!input) {
      return session.text('commands.dvc.messages.menu-err')
    }
    this.type = input
    return session.text('commands.dvc.messages.switch-success', ['引擎', input])
  }

  /**
   * 
   * @param session 会话
   * @param prompt 人格昵称
   * @returns 人格切换状态
   */

  async switch_peresonality(session: Session, prompt: string): Promise<string> {
    const nick_names: string[] = Object.keys(this.personality)
    // 参数合法
    if (prompt && nick_names.indexOf(prompt) > -1) {
      return this.set_personality(session, prompt)
    }
    const input = await switch_menu_grid(session, nick_names, '人格')
    if (!input) {
      return session.text('commands.dvc.messages.menu-err')
    }
    return this.set_personality(session, input[0])
  }

  /**
   * 重置个人会话，保留人格
   * @param session 会话
   * @returns 
   */

  reset(session: Session): string {
    let seession_json: Dvc.Msg[] = this.get_chat_session(session.userId)
    this.sessions[session.userId] = [{ "role": "system", "content": seession_json[0].content }]
    return '重置成功'
  }

  async add_personality(session: Session, nick_name: string): Promise<string> {

    if (!nick_name) {
      session.send('请输入人格昵称(输入q退出)')
      nick_name = await session.prompt(60000)
      if (!nick_name || nick_name == "q") session.text('commands.dvc.messages.set-personality')
    }
    let input_key: string
    let input_value: string
    const personality_session = []
    while (true) {
      session.send('请输入role(system||assistant||user)(输入q退出，e结束)')
      input_key = await session.prompt(60000)
      if (input_key == 'q' || !input_key) {
        return session.text('commands.dvc.messages.set-personality')
      }
      if (input_key == 'e') {
        break
      }
      if (["system", "assistant", "user"].indexOf(input_key) == -1) return session.text('commands.dvc.messages.set-personality-role')
      session.send('请输入内容(输入q退出)')
      input_value = await session.prompt(60000)
      if (input_value == 'q' || !input_value) {
        return session.text('commands.dvc.messages.set-personality')
      }
      personality_session.push({ role: input_key, content: input_value })
    }
    this.sessions_cmd.push(nick_name)
    this.personality[nick_name] = personality_session
    fs.writeFileSync('./personality.json', JSON.stringify(this.personality, null, 2))
    return this.set_personality(session, nick_name)
  }

  /**
   * 设置人格
   * @param session 会话
   * @param nick_name 人格昵称
   * @param descirption 对话
   * @returns 字符
   */

  set_personality(session: Session, nick_name: string): string {
    this.sessions_cmd.push(nick_name)
    this.sessions[session.userId] = this.personality[nick_name]
    if (this.ctx.config.preset_pro) {
      this.session_config = this.personality[nick_name]
    }
    return '人格设置成功: ' + nick_name
  }


  /**
   * 
   * @param session 当前会话
   * @returns 返回清空的消息
   */

  clear(session: Session): string {
    this.sessions = {}
    return session.text('commands.dvc.messages.clean')
  }

}
namespace DVc {

}



export default DVc