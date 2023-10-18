import { Context, Logger, segment, Element, Session, Service, Dict, h, Next, Fragment, Schema, trimSlash } from 'koishi';
import fs, { readFileSync } from 'fs';
import { } from 'koishi-plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
import { } from '@initencounter/vits'
import { } from '@initencounter/sst'
import { } from '@koishijs/censor'
import { DataService } from '@koishijs/plugin-console'
import { resolve } from 'path';
const name = 'davinci-003';
const logger = new Logger(name);

declare module '@koishijs/plugin-console' {
  interface Events {
    'davinci-003/getproxy'(): string
    'davinci-003/getcredit'(key: string): Promise<number>
  }
}

declare module 'koishi' {
  interface Context {
    dvc: Dvc
  }
}

class Dvc extends Service {
  static using = ['console']
  output_type: string;
  session_config: Dvc.Msg[];
  sessions: Dict;
  personality: Dict;
  sessions_cmd: string[];
  aliasMap: any;
  type: string
  l6k: boolean;
  key_number: number;
  key: string[];
  retry: Dict;
  maxRetryTimes: number;
  constructor(ctx: Context, private config: Dvc.Config) {
    super(ctx, 'dvc', true)
    this.output_type = this.config.output
    this.type = this.config.type
    this.key_number = 0
    this.key = [].concat(config.key)
    this.sessions = {};
    this.retry = {}
    this.maxRetryTimes = config.maxRetryTimes
    ctx.i18n.define('zh', require('./locales/zh'));

    ctx.on('ready', () => {
      if ((!ctx.puppeteer) && this.config.output == 'image') {
        logger.warn('未启用puppter,将无法发送图片');
      }
      if ((!ctx.vits) && this.config.output == "voice") {
        logger.warn('未启用puppter,将无法输出语音');
      }
    })
    ctx.using(['console'], (ctx) => {
      ctx.console.addEntry({
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      })
    })

    ctx.on('send', (session) => {
      if (this.config.recall_all) {
        this.recall(session, session.messageId, this.config.recall_all_time)
      }
    })
    try {
      this.personality = JSON.parse(fs.readFileSync('./personality.json', 'utf-8'));
    } catch (e) {
      this.personality = { "预设人格": [{ "role": "system", "content": "你是我的全能AI助理" }] }
      fs.writeFileSync('./personality.json', JSON.stringify(this.personality));
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
    ctx.command('dvc <text:text>', { authority: this.config.authority, })
      .option('output', '-o <output:string>')
      .alias(...this.config.alias)
      .action(async ({ session, options }) => {
        if (this.block(session as Session)) {
          return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
        }
        if (session.content.indexOf(' ') == -1) {
          return session.text('commands.dvc.messages.no-prompt')
        } return this.sli(session as Session, session.content.slice(session.content.indexOf(' '), session.content.length), options)
      })

    //统计次数的工具人
    ctx.command('dvc.count <prompt:text>', '统计次数的工具人', {
      maxUsage: this.config.usage,
      usageName: 'ai'
    }).action(({ session }, prompt) => {
      if (this.block(session as Session)) {
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.dvc(session as Session, prompt)
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
        session.send("添加人格失败？看这里！\n https://forum.koishi.xyz/t/topic/2349/4")
        return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
      } return this.add_personality(session as Session, prompt)
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
      maxUsage: this.config.usage
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
          options.resolution ? options.resolution : this.config.resolution
        )
      })
    ctx.command('dvc.翻译 <prompt:text>', 'AI翻译')
      .option('lang', '-l <lang:t=string>', { fallback: this.config.lang })
      .action(async ({ session, options }, prompt) => {
        if (this.block(session as Session)) {
          return h('quote', { id: session.messageId }, session.text('commands.dvc.messages.block'))
        }
        return await this.translate(session as Session, options.lang, prompt)
      })
    ctx.command('dvc.update', '一键加载400条极品预设')
      .alias('dvc.更新预设')
      .action(async ({ session, options }) => {
        let prompts_latest = (await ctx.http.axios({
          method: 'GET',
          url: 'https://gitee.com/initencunter/ChatPrompts/raw/master/safe',
          responseType: "json"
        })).data;
        prompts_latest = JSON.parse(Buffer.from(prompts_latest, 'base64').toString('utf-8'));
        logger.info(prompts_latest);
        for (const i of Object.keys(prompts_latest)) {
          this.personality[i] = prompts_latest[i];
        }
        fs.writeFileSync('./personality.json', JSON.stringify(this.personality));
        return session.execute('切换人格');
      })
    ctx.console.addListener('davinci-003/getproxy', () => {

      if (this.config.type == 'gpt3.5') {
        return this.config.proxy_reverse
      }
      return this.config.proxy_reverse4

    })
    ctx.console.addListener('davinci-003/getcredit', async (key?: string) => {
      if (!key) {
        key = this.key[this.key_number]
      }
      return await this.get_credit2(key ?? this.key[this.key_number])
    })
  }


  /**
   * 
   * @param lang 目标语言
   * @param prompt 要翻译的内容
   * @returns 翻译后的内容
   */
  async translate(session: Session, lang: string, prompt: string): Promise<string> {
    return this.chat_with_gpt(session as Session, [{ role: 'system', content: '你是一个翻译引擎，请将文本翻译为' + lang + '，只需要翻译不需要解释。' }, { role: 'user', content: `请帮我我将如下文字翻译成${lang},“${prompt}”` }])
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
      const response = await this.ctx.http.axios(
        {
          method: 'post',
          url: trimSlash(`${this.config.proxy_reverse ? this.config.proxy_reverse : "https://api.openai.com"}/v1/images/generations`),
          headers: {
            Authorization: `Bearer ${this.key[this.key_number]}`,
            'Content-Type': 'application/json'
          },
          data: {
            prompt: prompt,
            n: n,
            size: size
          },
          timeout: 600000
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
    catch (e) {
      this.key_number++
      if (this.key_number < this.config?.key?.length) {
        logger.info(`key${this.key_number - 1} 报错：${String(e)}`)
        return await this.paint(session, prompt, n, size)
      } else {
        return session.text('commands.dvc.messages.err', [`key${this.key_number - 1} 报错：${String(e)}`])
      }
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
    this.output_type = options.output ? options.output : this.output_type
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


  async dvc(session: Session, prompt: string): Promise<string | Element | void> {
    if (this.config.waiting) {
      const msgid = (await session.bot.sendMessage(session.channelId, h('quote', { id: session.messageId }) + session.text('commands.dvc.messages.thinking'), session.guildId))[0]
      if (this.config.recall && (!this.config.recall_all)) {
        await this.recall(session, msgid, this.config.recall_time)
      }
    }
    // 文本审核
    if (this.ctx.censor) {
      prompt = await this.ctx.censor.transform(prompt, session)
    }
    if (this.config.output == 'minimal' && this.config.stream_output) {
      if (this.type == 'gpt3.5-unit') {
        return await this.chat_with_gpt_stream(session, [{ 'role': 'user', 'content': prompt }])
      } else if (this.type == 'gpt4-unit') {
        return await this.chat_with_gpt4_stream(session, [{ 'role': 'user', 'content': prompt }])
      }
    }
    if (this.type == 'gpt3.5-unit') {
      const text: string = await this.chat_with_gpt(session, [{ 'role': 'user', 'content': prompt }])
      const resp = [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }]
      return await this.getContent(session.userId, resp, session.messageId)
    } else if (this.type == 'gpt4-unit') {
      return await this.chat_with_gpt4(session, [{ 'role': 'user', 'content': prompt }])
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
          this.sessions[session.userId] = this.personality[i]
          return await this.sli(session, session.content, {})
        }
      }
    }
    // 随机 触发
    if (this.config.randnum == 0) return next()
    const randnum: number = Math.random()
    if (randnum < this.config.randnum) return await this.dvc(session, session.content)
    return next()
  }
  /**
   * GPT4 流式输出，适用于沙盒
   * @param session 会话
   * @param message 消息列表
   */
  async chat_with_gpt4_stream(session: Session, message: Dvc.Msg[]): Promise<string | void> {
    let contents = ''
    let content = ''
    await this.ctx.http.axios(
      {
        method: 'post',
        url: trimSlash(`${this.config.proxy_reverse4}/v1/chat/completions`),
        headers: {
          Authorization: `Bearer ${this.key[this.key_number]}`
        },
        responseType: 'stream',
        data: {
          model: 'gpt-4',
          messages: message
        },
        timeout: 600000
      }).then(response => {
        response.data.on('data', async (chunk) => {
          const new_string = chunk.toString()
          const json = new_string.match(/(?<="delta":{"content":")(.*?)(?="},"finish_reason")/)
          if (json) {
            if (['。', '，', '？', '！'].includes(json[0])) {
              content += json[0]
              session.send(content)
              contents += content
              content = ''
            } else {
              content += json[0]
            }
          }
        });
        response.data.on('end', () => {
          let session_of_id = this.get_chat_session(session.userId)
          session_of_id.push({ "role": "assistant", "content": contents });
          while (JSON.stringify(session_of_id).length > 10000) {
            session_of_id.splice(1, 1);
            if (session_of_id.length <= 1) {
              break;
            }
          }
          this.sessions[session.userId] = session_of_id
          logger.info("ChatGPT返回内容: ")
          logger.info(contents)
        })
        this.retry[this.key[this.key_number]] = 0
      }).catch(async (e) => {
        if (!(await this.switch_key(e))) {
          return ''
        }
        return await this.chat_with_gpt4_stream(session, message)
      });
  }
  async chat_with_gpt4(session: Session, message: Dvc.Msg[]): Promise<string> {
    try {
      const response = await this.ctx.http.axios(
        {
          method: 'post',
          url: trimSlash(`${this.config.proxy_reverse4}/v1/chat/completions`),
          headers: {
            Authorization: `Bearer ${this.key[this.key_number]}`
          },
          data: {
            model: 'gpt-4',
            messages: message
          },
          timeout: 600000
        })
      this.retry[this.key[this.key_number]] = 0
      return response.data.choices[0].message.content
    }
    catch (e) {
      if (!(await this.switch_key(e))) {
        return ''
      }
      return await this.chat_with_gpt4(session, message)
    }
  }
  /**
   * 
   * @param message 发送给chatgpt的json列表
   * @returns 将返回文字处理成json
   */


  async chat_with_gpt(session: Session, message: Dvc.Msg[]): Promise<string> {
    try {
      const response = await this.ctx.http.axios(
        {
          method: 'post',
          url: trimSlash(`${this.config.proxy_reverse ? this.config.proxy_reverse : "https://api.openai.com"}/v1/chat/completions`),
          headers: {
            Authorization: `Bearer ${this.key[this.key_number]}`,
            'Content-Type': 'application/json'
          },
          data: {
            model: "gpt-3.5-turbo",
            temperature: this.config.temperature,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            messages: message
          },
          timeout: 0
        })
      this.retry[this.key[this.key_number]] = 0
      return response.data.choices[0].message.content
    }
    catch (e) {
      if (!(await this.switch_key(e))) {
        return ''
      }
      return await this.chat_with_gpt(session, message)
    }
  }

  /**
   * 先查询余额 ,如果余额为 0，则从内存中删除 key, 如果还有余额，则暂时切换余额
   * @param session 会话
   * @param e Error
   */

  async switch_key(e: Error) {
    // 记录重试次数
    if (this.retry[this.key[this.key_number]]) {
      this.retry[this.key[this.key_number]] = this.retry[this.key[this.key_number]] + 1
      // 如果重试次数超出最大，删除key
      if (this.retry[this.key[this.key_number]] > this.maxRetryTimes) {
        this.key.splice(this.key_number, 1)
        return false
      }
    } else {
      this.retry[this.key[this.key_number]] = 1
    }
    // 查询余额
    const credit = await this.get_credit()
    logger.info(`key${this.key_number - 1}. ${this.key[this.key_number]} 报错，余额${credit}：${String(e)}`)
    // 余额为 0 ,删除key
    if (credit === 0) {
      this.key.splice(this.key_number, 1)
    } else {
      // 切换 key
      this.key_number++
      // 如果 key 的下标超出边界
      if (this.key_number > (this?.key?.length - 1)) {
        this.retry = {}
        this.key_number = 0
        return true
      }
    }
    // 如果读取不到key，重置key
    if (this.key[this.key_number] == undefined) {
      this.resetKey()
      logger.error("未配置key或所有key都已失效")
      return false
    }

    // 如果 key 缓存池为空, 重置key
    if (this.key.length == 0) {
      this.resetKey()
      return false
    } else {
      return true
    }
  }
  async resetKey() {
    this.retry = {}
    this.key_number = 0
    this.key = this.config.key
  }
  /**
   * 
   * @param message 发送给chatgpt的json列表
   * @returns 将返回文字处理成json
   */

  async chat_with_gpt_stream(session: Session, message: Dvc.Msg[]): Promise<string | void> {
    let contents = ''
    let content = ''
    await this.ctx.http.axios(
      {
        method: 'post',
        url: `${this.config.proxy_reverse ? this.config.proxy_reverse : "https://api.openai.com"}/v1/chat/completions`,
        headers: {
          Authorization: `Bearer ${this.key[this.key_number]}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        data: {
          model: "gpt-3.5-turbo",
          temperature: this.config.temperature,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          messages: message,
          stream: true
        },
        timeout: 0
      }).then(response => {
        response.data.on('data', async (chunk) => {
          const new_string = chunk.toString()
          const json = new_string.match(/(?<="delta":{"content":")(.*?)(?="},"finish_reason")/)
          if (json) {
            if (['。', '，', '？', '！'].includes(json[0])) {
              content += json[0]
              session.send(content)
              contents += content
              content = ''
            } else {
              content += json[0]
            }
          }
        }),
          response.data.on('end', () => {
            let session_of_id = this.get_chat_session(session.userId)
            session_of_id.push({ "role": "assistant", "content": contents });
            while (JSON.stringify(session_of_id).length > 10000) {
              session_of_id.splice(1, 1);
              if (session_of_id.length <= 1) {
                break;
              }
            }
            this.sessions[session.userId] = session_of_id
            logger.info("ChatGPT返回内容: ")
            logger.info(contents)
          })
        this.retry[this.key[this.key_number]] = 0
      }).catch(async (e) => {
        if (!(await this.switch_key(e))) {
          return ''
        }
        return await this.chat_with_gpt_stream(session, message)
      });

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
    logger.info((session.author?.nickname || session.username) + ':' + msg)
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
    if (this.config.stream_output) {
      if (this.type == 'gpt4') {
        message = (await this.chat_with_gpt4_stream(session, session_of_id)) as string
      } else {
        message = (await this.chat_with_gpt_stream(session, session_of_id)) as string
      }
      return
    } else {
      if (this.type == 'gpt4') {
        message = await this.chat_with_gpt4(session, session_of_id)
      } else {
        message = await this.chat_with_gpt(session, session_of_id)
      }
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
   * 是否被屏蔽
   * @param session 
   * @returns 
   */

  block(session: Session) {
    if (this.config.blockuser.includes(session.userId) || this.config.blockchannel.includes(session.channelId)) {
      return true
    }
  }
  /**
   * 撤回消息
   * @param session 
   * @param messageId 
   * @param time 
   */
  async recall(session: Session, messageId: string, time: number) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , time));

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
      return this.personality_rm(session, nick_name)
    }
    const input = await this.switch_menu(session, nick_names, '人格')
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

  personality_rm(session: Session, nick_name: string): string {
    const index: number = this.sessions_cmd.indexOf(nick_name)
    this.sessions_cmd.splice(index, 1)
    delete this.personality[nick_name]
    this.sessions[session.userId] = [{ "role": "system", "content": "你是我的全能AI助理" }]
    fs.writeFileSync('./personality.json', JSON.stringify(this.personality))
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
    const input = await this.switch_menu(session, type_arr, '输出模式')
    if (!input) {
      return session.text('commands.dvc.messages.menu-err')
    }
    this.output_type = input
    return session.text('commands.dvc.messages.switch-success', ['输出模式', input])

  }
  /**
   * 发送选择菜单
   * @param session 
   * @param type_arr 
   * @param name 
   * @returns 
   */
  async switch_menu(session: Session, type_arr: string[], name: string): Promise<string> {
    let type_str: string = '\n'
    let count = 0
    const result = segment('figure')
    type_arr.forEach((i, id) => {
      if (count > 50) {
        count = 0
        result.children.push(
          segment('message', {
            userId: '1114039391',
            nickname: 'AI',
          }, type_str))
        type_str = ''
      }
      type_str += String(id + 1) + ' ' + i + '\n'
      count++
    })
    result.children.push(
      segment('message', {
        userId: '1114039391',
        nickname: 'AI',
      }, type_str))
    await session.send(result)
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) return ''
    const index: number = parseInt(input) - 1
    if ((index < 0) || (index > type_arr.length - 1)) return ''
    return type_arr[index]
  }


  /**
   * 
   * @param session 当前会话
   * @returns apikey剩余额度
   */

  async get_credit(): Promise<number> {
    if ((this.config.type.startsWith('gpt4') ? this.config.proxy_reverse4 : this.config.proxy_reverse).indexOf('anywhere') > -1) {
      return this.get_credit_peiqi(this.key[this.key_number])
    }
    try {
      const url: string = trimSlash(`${this.config.proxy_reverse ? this.config.proxy_reverse : "https://api.openai.com"}/v1/dashboard/billing/subscription`)
      const res = await this.ctx.http.get(url, {
        headers: {
          "Authorization": "Bearer " + this.key[this.key_number]
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
      const res = await this.ctx.http.axios({
        url: url,
        method: 'post',
        headers: { "Authorization": key, 'Content-Type': 'application/json' }
      })
      const credit = res['data']['balanceTotal'] - res['data']['balanceUsed']
      return credit
    } catch (e) {
      return -1
    }
  }
  async get_credit2(key: string): Promise<number> {
    if ((this.config.type.startsWith('gpt4') ? this.config.proxy_reverse4 : this.config.proxy_reverse).indexOf('anywhere') > -1) {
      return this.get_credit_peiqi(key)
    }
    try {

      const url: string = trimSlash(`${(this.config.type.startsWith('gpt4') ? this.config.proxy_reverse4 : this.config.proxy_reverse) ?? "https://api.openai.com"}/v1/dashboard/billing/subscription`)

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
        <div style='position: absolute;top:10px;'>create by koishi-plugin-davinci-003-v4.0.7</div>
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
    const input = await this.switch_menu(session, type_arr, '引擎')
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
    const input = await this.switch_menu(session, nick_names, '人格')
    if (!input) {
      return session.text('commands.dvc.messages.menu-err')
    }
    return this.set_personality(session, input)
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
    fs.writeFileSync('./personality.json', JSON.stringify(this.personality))
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
    if (this.config.preset_pro) {
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
    this.resetKey()
    this.sessions = {}
    return session.text('commands.dvc.messages.clean')
  }

}

namespace Dvc {
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
    key: string[]

    preset_pro: boolean
    single_session: boolean
    waiting: boolean
    whisper: boolean
    nickwake: boolean

    recall: boolean
    recall_time: number
    recall_all: boolean
    recall_all_time: number

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
    stream_output: boolean

    if_private: boolean
    if_at: boolean
    randnum: number
    proxy_reverse: string
    proxy_reverse4: string

    blockuser: string[]
    blockchannel: string[]

    maxRetryTimes: number


  }
  export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
      type: Schema.union([
        Schema.const('gpt3.5-js' as const).description('GPT-3.5turbo-js,推荐模式'),
        Schema.const('gpt3.5-unit' as const).description('GPT-3.5turbo-unit,超级节俭模式'),
        Schema.const('gpt4' as const).description('GPT-4'),
        Schema.const('gpt4-unit' as const).description('GPT-4-unit,超级节俭模式')
      ] as const).default('gpt3.5-js').description('引擎选择'),
      key: Schema.union([
        Schema.array(String),
        Schema.transform(String, value => [value]),
      ]).default([]).description('api_key'),
    }).description('基础设置'),

    Schema.object({
      preset_pro: Schema.boolean().default(false).description('所有人共用一个人设'),
      single_session: Schema.boolean().default(false).description('所有人共用一个会话'),
      whisper: Schema.boolean().default(false).description('语音输入功能,需要加载sst服务,启用插件tc-sst即可实现'),
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      nickwake: Schema.boolean().default(false).description('人格昵称唤醒'),

      recall: Schema.boolean().default(true).description('一段时间后会撤回“思考中”'),
      recall_time: Schema.number().default(5000).description('撤回的时间'),
      recall_all: Schema.boolean().default(false).description('一段时间后会撤回所有消息'),
      recall_all_time: Schema.number().default(5000).description('撤回所有消息的时间'),

      lang: Schema.string().description('要翻译的目标语言').default('英文'),
      selfid: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),

      max_tokens: Schema.number().description('请求长度,否则报错').default(3000),
      temperature: Schema.number().description('创造力').default(0),
      authority: Schema.number().description('允许使用的最低权限').default(1),
      superusr: Schema.array(String).default(['3118087750']).description('可以无限调用的用户'),
      usage: Schema.number().description('每人每日可用次数').default(100),
      minInterval: Schema.number().default(5000).description('连续调用的最小间隔,单位毫秒。'),

      alias: Schema.array(String).default(['ai', 'alowel']).description('触发命令;别名'),
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
      stream_output: Schema.boolean().default(false).description('流式输出'),

      if_private: Schema.boolean().default(true).description('开启后私聊可触发ai'),
      if_at: Schema.boolean().default(true).description('开启后被提及(at/引用)可触发ai'),
      randnum: Schema.number().default(0).description('随机回复概率，如需关闭可设置为0'),
      proxy_reverse: Schema.string().default('https://gpt.lucent.blog').description('GPT3反向代理地址'),
      proxy_reverse4: Schema.string().default('https://chatgpt.nextweb.fun/api/openai').description('GPT4反向代理地址'),
      maxRetryTimes: Schema.number().default(30).description('报错后最大重试次数')
    }).description('进阶设置'),

    Schema.object({
      blockuser: Schema.array(String).default([]).description('屏蔽的用户'),
      blockchannel: Schema.array(String).default([]).description('屏蔽的频道')
    }).description('过滤器'),
  ])
}

export default Dvc