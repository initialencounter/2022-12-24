import { Context, Schema, Logger, segment, Element, Session, Service, Dict, h } from 'koishi';
import fs from 'fs';
import { } from '@koishijs/plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
export const name = 'davinci-003';
export const logger = new Logger(name);

/**
 * chat_with_gpt|message: [{role:'user',content:<text>}] 
 * get_credit | 获取余额
 */

declare module 'koishi' {
  interface Context {
    dvc: Dvc
  }
  interface Dvc {
    chat_with_gpt(message: Dvc.Msg[]): Promise<string>
    get_credit(session: Session): Promise<string>
  }

}

class Dvc extends Service {
  output_type: string;
  session_config: { "msg": Dvc.Msg[] };
  sessions: Dict;
  personality: string;
  sessions_cmd: Dict;
  reg: RegExp;
  openai: OpenAI;
  access_token: string;
  ifgettoken: boolean;
  key: number[];
  aliasMap: any;
  charMap: any;
  g_voice_name: string;
  bg_base64: string
  proxy_reverse: string
  type: string
  constructor(ctx: Context, private config: Dvc.Config) {
    super(ctx, 'dvc', true)
    this.key = [5, 188, 209, 154, 2, 90, 41, 129, 174, 177, 125, 55, 77, 165, 40, 97];
    this.output_type = config.output
    this.g_voice_name = config.g_voice_name
    this.proxy_reverse = config.proxy_reverse
    this.type = config.type
    this.aliasMap = {
      埃洛伊: [],
      安柏: [],
      丽莎: [],
      菲谢尔: ['皇女'],
      凯亚: [],
      迪卢克: ['卢姥爷', '姥爷'],
      琴: [],
      诺艾尔: ['女仆'],
      芭芭拉: [],
      阿贝多: [],
      班尼特: ['班尼哥'],
      迪奥娜: [],
      罗莎莉亚: [],
      莫娜: [],
      砂糖: [],
      雷泽: [],
      温迪: ['巴巴托斯', '风神'],
      优菈: [],
      可莉: [],
      重云: [],
      七七: [],
      烟绯: [],
      甘雨: [],
      香菱: [],
      北斗: [],
      辛焱: [],
      行秋: [],
      胡桃: [],
      刻晴: [],
      凝光: [],
      云堇: [],
      钟离: ['岩神'],
      夜兰: [],
      申鹤: [],
      达达利亚: ['公子', '鸭鸦'],
      魈: [],
      宵宫: [],
      托马: [],
      早柚: [],
      五郎: [],
      久岐忍: ['97忍', '97'],
      九条裟罗: ['裟罗'],
      枫原万叶: ['万叶'],
      雷电将军: ['雷神'],
      神里绫华: ['绫华'],
      神里绫人: ['绫人'],
      珊瑚宫心海: ['心海'],
      鹿野院平藏: ['平藏', '小鹿'],
      荒泷一斗: ['一斗'],
      八重神子: ['神子'],
      提纳里: [],
      赛诺: [],
      柯莱: [],
      多莉: [],
      坎蒂丝: [],
      妮露: [],
      珐露珊: [],
      莱依拉: [],
      纳西妲: ['草神'],
      流浪者: ['散兵'],
    };
    this.charMap = {};
    for (const name of Object.keys(this.aliasMap)) {
      this.charMap[name] = name;
      for (const item of this.aliasMap[name]) {
        this.charMap[item] = name;
      }
    }

    this.openai = new OpenAI(config.key, ctx, this.config.proxy_reverse);
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
    try {
      JSON.parse(fs.readFileSync('./davinci-003-data.json').toString());
    } catch (e) {
      fs.writeFileSync('./davinci-003-data.json', '{"派蒙":"你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"}');
    }
    this.personality = JSON.parse(fs.readFileSync('./davinci-003-data.json').toString());
    ctx.command('dvc.credit', '查询余额').action(async ({ session }) => this.get_credit(session));
    ctx.i18n.define('zh', require('./locales/zh'));

    //at和私信触发对话的实现方法
    ctx.middleware(async (session, next) => this.middleware1(session, next));

    //主要逻辑
    ctx.command('dvc <text:text>', { authority: config.authority,})
      .option('output', '-o <output:string>')
      .alias(...config.alias)
      // .action(async ({ session, options }, text) =>  this.sli(session, text, options))
      .action(async ({ session, options }) => this.sli(session, session.content.slice(session.content.indexOf(' '),session.content.length), options))

    //统计次数的工具人
    ctx.command('dvc.count <prompt:text>', '统计次数的工具人', {
      maxUsage: config.usage,
      usageName: 'ai'
    }).action(({ session }) => this.dvc(session, session.content.slice(session.content.indexOf(' '))))

    //清空所有会话及人格
    ctx.command('dvc.clear', '清空所有会话及人格', {
      authority: 1
    }).action(({ session }) => this.clear(session))

    //切换语言输出的音色
    ctx.command('dvc.gvc <name>', '切换dvc的原神语音角色')
      .action(async (_, name) => this.switch_gvc(name));
    ctx.command('dvc.output <type:string>', '切换dvc的输出方式').action(({ session }, type) => this.switch_output(session, type));

    //设置人格
    ctx.command('dvc.设置人格 <prompt:text>', '更改AI的人格,并重置会话', {
      authority: 1
    }).alias('dvc.人格设置').action(({ session }, prompt) => this.set_personality(session, prompt))

    //清空所有会话及人格
    ctx.command('dvc.重置会话', '重置会话', {
      authority: 1
    }).action(({ session }) => this.reset(session))

    //切换现有人格
    ctx.command('dvc.切换人格', '切换为现有的人格', {
      authority: 1
    }).alias('dvc.人格切换').action(async ({ session }, prompt) => this.switch_peresonality(session, prompt))

    //切换模式
    ctx.command('dvc.切换模式', '切换模式', {
      authority: 1
    }).alias('dvc.模式切换').action(async () => this.switch_type())

    //生图
    ctx.command('dvc.paint, <prompt:text>', '生成图片', {
      authority: 1,
      usageName: 'ai',
      maxUsage: config.usage
    })
      .option('resolution', '-r <resolution:string>')
      .option('img_number', '-n <img_number:number>')
      .alias('dvc.生图').action(async ({
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
  }
  async paint(session: Session, prompt: string, n: number, size: string) {
    session.send(session.text('commands.dvc.messages.painting'))
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


  switch_type() {
    this.type = (this.type == 'gpt3.5-js') ? 'gtp3.5-unit' : 'gpt3.5-js'
    return `模式切换成功:${this.type}`
  }


  async switch_peresonality(session: Session, prompt: string) {
    if (prompt) {
      if (Object.keys(this.personality).length == 0) {
        console.log(session.text('commands.dvc.messages.switch-errr'))
        return String(session.text('commands.dvc.messages.switch-errr'))
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
        this.sessions_cmd[session.userId] = Object.keys(this.personality)[index]

        this.set_personality(session, Object.keys(this.personality)[index])
        return '人格切换成功'
      } else {

        this.sessions_cmd[session.userId] = Object.keys(this.personality)[0]
        this.set_personality(session, Object.values(this.personality)[0])
        return '人格切换成功'

      }
    } else {
      let nickname_str: string = '\n'
      Object.keys(this.personality).forEach((i, id) => {
        nickname_str += String(id + 1) + ' ' + i + '\n'
      })
      session.send(session.text('commands.dvc.messages.switch', [nickname_str]))
      const input = await session.prompt()
      if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
      const index: number = +input - 1
      if (!Object.keys(this.personality)[index]) return '请输入正确的序号。'
      if (this.personality[Object.keys(this.personality)[index]]) {
        this.sessions_cmd[session.userId] = Object.keys(this.personality)[index]
        this.set_personality(session, Object.values(this.personality)[0])
      }
      return '人格切换成功'
    }
  }


  reset(session: Session) {
    let seession_json = this.get_chat_session(session.userId)
    seession_json['msg'] = [{ "role": "system", "content": this.config.preset }]
    this.sessions[session.userId] = seession_json
    delete this.sessions_cmd[session.userId]
    return '重置成功'
  }


  set_personality(session: Session, prompt: string) {
    if (!prompt) {
      return session.text('commands.dvc.messages.set-personality')
    }
    let nick_name: string = '小猪'
    try {
      nick_name = prompt.match(this.reg)[0].slice(4, -1)
    }
    catch (err) {
      logger.info('未设置Ai的昵称，可忽略')
    }
    if (Object.keys(this.sessions_cmd).indexOf(session.userId) > -1) {
      Object.keys(this.sessions_cmd).forEach((i, id) => {
        if (i.indexOf(session.userId) == -1) {
          this.sessions_cmd[id] = nick_name
        }
      })
    } else {
      this.sessions_cmd[session.userId] = nick_name
    }
    if (!(nick_name == '小猪')) {
      this.personality[String(nick_name)] = prompt
      try {
        fs.writeFileSync('./davinci-003-data.json', JSON.stringify(this.personality));
      } catch (e) {
        logger.warn(e);
      }
    }
    let seession_json = this.get_chat_session(session.userId)
    seession_json['msg'] = [{ "role": "system", "content": prompt }]
    this.sessions[session.userId] = seession_json
    return '人格设置成功'
  }


  /**
   * 
   * @param name 角色昵称
   * @returns 角色名字
   */


  switch_gvc(name: string) {
    if (!name)
      return '请输入角色名。';
    name = this.charMap[name];
    if (!name)
      return '无法识别角色名。';
    this.g_voice_name = name
    this.output_type = 'voice'
    return `更换${name}声音成功！`;

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
    } else {
      return ''
    }
  }

  async sli(session: Session, prompt: string, options) {
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
      session.execute(`dvc.count ${prompt}`)
    } else {
      return this.dvc(session, prompt)
    }
  }

  /**
   * 对话主要逻辑
   */



  async dvc(session: Session, prompt: string) {
    if (this.config.waiting) {
      session.send(session.text('commands.dvc.messages.thinking'))
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
        logger.warn(err);
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }

    }
    else if (this.type == 'gpt3.5-unit') {
      try {
        const text = await this.chat_with_gpt([{ 'role': 'user', 'content': prompt }])
        const resp = { 'msg': [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }], 'id': 0 }
        return await this.getContent(session.userId, resp)
      }
      catch (err) {
        logger.warn(err);
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
        const resp: Dvc.Resp = { 'msg': [{ "role": "user", "content": prompt }, { "role": "assistant", "content": text }], 'id': 0 }
        return await this.getContent(session.userId, resp)
      }
      catch (err) {
        logger.warn(err);
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

  async middleware1(session: Session, next) {
    if (session.channelId.indexOf('private:') > -1) {
      if (this.config.if_private) {
        session.execute(`dvc ${session.content}`)
        return next()
      }
    }
    if (session.content.indexOf(`<at id="${this.config.selfid}"/>`) > -1) {
      session.execute(`dvc ${session.content.replace(`<at id="${this.config.selfid}"/> `, '')}`)
      return next()
    }
    const session_id_string: string = session.userId
    if (Object.keys(this.sessions_cmd).indexOf(session_id_string) == -1) {
      return next()
    }
    Object.keys(this.sessions_cmd).forEach((i, _id) => {
      if (i == session_id_string && (session.content.indexOf(this.sessions_cmd[i]) > -1)) {
        if (session.content.length == this.sessions_cmd[i].length) {
          console.log('112312314', session.content, i)
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
  async switch_output(session: Session, type: string) {
    const type_arr: string[] = ['voice', 'default', 'verbose', 'minimal']
    if (!type) {
      let type_str: string = '\n'
      type_arr.forEach((i, id) => {
        type_str += String(id + 1) + ' ' + i + '\n'
      })
      session.send(session.text('commands.dvc.messages.switch-output', [type_str]))
      const input = await session.prompt()
      if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
      const index: number = parseInt(input) - 1
      if (0 > index && index > type_arr.length - 1) return '请输入正确的序号。'
      this.output_type = type_arr[index]
      return '输出模式切换成功: ' + this.output_type
    } else {
      if (type_arr.includes(type)) {
        this.output_type = type
        return '输出模式切换成功: ' + this.output_type
      } else {
        let type_str: string = '\n'
        type_arr.forEach((i, id) => {
          type_str += String(id + 1) + ' ' + i + '\n'
        })
        session.send(session.text('commands.dvc.messages.switch-output', [type_str]))
        const input = await session.prompt()
        if (!input || Number.isNaN(+input)) return '请输入正确的序号。'
        const index: number = parseInt(input) - 1

        if (0 > index && index > type_arr.length - 1) return '请输入正确的序号。'
        this.output_type = type_arr[index]
        return '输出模式切换成功: ' + this.output_type
      }
    }

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
      const url: string = `${this.config.proxy_reverse}/dashboard/billing/credit_grants`
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
  async getContent(userId: string, resp: Dvc.Resp) {

    if (this.output_type == 'voice') {
      const data = await this.ctx.http.get(`https://ai-api.baimianxiao.cn/api/${this.encode(this.g_voice_name)}/${this.encode(resp.msg[resp.msg.length - 1].content)}/0.4/0.6/1.12/${this.encode(Math.floor(Date.now() / 1000).toString())}.ai`, { responseType: 'arraybuffer' });
      return h.audio(data, 'audio/x-wav');
    }
    if (this.output_type == 'minimal') {
      return resp.msg[resp.msg.length - 1].content
    } else if (this.output_type == 'default') {
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
        <div style='position: absolute;top:10px;'>create by koishi-plugin-davinci-003_v1.5.6</div>
      </html>
    }
  }

  /**
   * 
   * @param text 要hex编码的文本
   * @returns hex字符串
   */

  encode(text: string) {
    return (Buffer.from(text).map((n, i) => n + (15 % (this.key[i % this.key.length] + i))) as Buffer).toString('hex');
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

  async chat(msg: string, sessionid: string, sender: Session) {
    ///逻辑段参考自<a style="color:blue" href="https://lucent.blog">Lucent佬</a><br></br>
    try {
      if (msg == '') {
        return '您好，我是人工智能助手，如果您有任何问题，请随时告诉我，我将尽力回答。\n如果您需要重置我们的会话，请回复`重置会话`'
      }
      // 获得对话session
      let session = this.get_chat_session(sessionid)
      // 设置本次对话内容
      session['msg'].push({ "role": "user", "content": msg })
      let fix_msg = session['msg']
      // 修剪会话,节省token
      if (session['msg'].length > 21) {
        sender.send('会话过长，已自动重置会话，')
        fix_msg = [session['msg'][0]].concat([session['msg'][session['msg'].length - 1]])
      }

      // 与ChatGPT交互获得对话内容

      let message = await this.chat_with_gpt(fix_msg)
      // 查看是否出错
      if (message.indexOf("This model's maximum context length is 4096 token") > -1) {
        if (session['msg'].length < 2) {
          // 出错就清理一条
          session['msg'] = [session['msg'].slice(0, 1).concat(session['msg'].slice(2, session['msg']).length - 1)]
          // 重新交互
          message = await this.chat(msg, sessionid, sender)
        }
      }
      // 记录上下文
      session['msg'].push({ "role": "assistant", "content": message })
      this.sessions[sessionid] = session
      console.log("会话ID: " + sessionid)
      console.log("ChatGPT返回内容: ")
      console.log(message)
      return await this.getContent(sessionid, session)

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
> 使用前在 <a style="color:blue" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
如需使用内容审查,请前往<a style="color:blue" href="https://ai.baidu.com/solution/censoring?hmsr=aibanner&hmpl=censoring">百度智能云</a> 获取AK和SK</br>
逻辑端参考自<a style="color:blue" href="https://lucent.blog">Lucent佬(呆呆木)</a><br>
反代使用的也是呆呆木的！，再次感谢！<br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-davinci-003 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
问题反馈群:399899914
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
    g_voice_name: string
    if_private: boolean
    proxy_reverse: string
  }

  export const Config = Schema.intersect([
    Schema.object({
      type: Schema.union([
        Schema.const('gpt3.5-js' as const).description('GPT-3.5turbo-js,推荐模式'),
        Schema.const('gpt3.5-unit' as const).description('GPT-3.5turbo-unit,超级节俭模式'),
        Schema.const('davinci-003' as const).description('DAVINCI等旧模型'),
      ] as const).default('gpt3.5-unit').description('模型选择'),
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
      selfid: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),
      preset: Schema.string().description('预设人格').default("你是提瓦特大陆最优秀的旅行向导，名字叫“派蒙”,爱好是美食，我是来自异世界旅行者。你将为我的旅程提供向导。"),
      reg: Schema.string().default('名字[是|叫]“[^,]+”').description('匹配人格的正则表达式'),
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      max_tokens: Schema.number().description('请求长度').default(1024),
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
        Schema.const('default').description('以聊天记录形式发送'),
        Schema.const('verbose').description('将对话转成图片'),
        Schema.const('voice').description('发送语音')
      ]).description('输出方式。').default('default'),
      if_private: Schema.boolean().default(true).description('开启后私聊可触发ai'),
      proxy_reverse: Schema.string().default('https://gpt.lucent.blog').description('反向代理地址')
    }).description('进阶设置')
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