import { Context, Schema, Logger, segment, Element } from 'koishi';
import { } from '@koishijs/plugin-rate-limit';
import { } from 'koishi-plugin-puppeteer';
export const name = 'davinci-003';
export const logger = new Logger(name);
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
  type: string
  endpoint: string
  alias: string[]
  key: string
  temperature: number
  max_tokens: number
  authority: number
  waiting: boolean
  usage: number
  mode: string
  output: string
  selfid: string
  reg: string
}
export const usage = `
## 注意事项
> 新版本GPT-3.5turbo模式下，服务端需要同步更新，否则会报错<br>
由于 OpenAi被墙,使用davinci-003时需要在<a style="color:yellow" href="/plugins/">全局设置</a>最底下->请求设置->代理服务器地址<br>
使用前在 <a style="color:yellow" href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key<br>
GPT-3.5turbo后端参考自<a style="color:yellow" href="https://lucent.blog/?p=118">Lucent佬</a><br>
<a style="color:yellow" href="https://github.com/initialencounter/mykoishi/blob/main/davinci-003#readme.md">自建GPT-3.5turbo后端教程</a><br>
对于部署者行为及所产生的任何纠纷， Koishi 及 <a style="color:yellow" href="https://github.com/initialencounter/mykoishi">koishi-plugin-davinci-003</a>概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:yellow" href="/locales">本地化</a>中修改 zh 内容
`
export const Config = Schema.intersect([
  Schema.object({
    type: Schema.union([
      Schema.const('gpt3.5' as const).description('GPT-3.5turbo无需代理，有上下文功能，但需要自建服务端'),
      Schema.const('davinci-003' as const).description('davinci-003需要代理，无上下文功能'),
    ] as const).default('davinci-003').description('后端选择'),
  }).description('基础设置'),
  Schema.union([
    Schema.object({
      type: Schema.const('gpt3.5'),
      endpoint: Schema.string().description('API 服务器地址。').required()
    }),
    Schema.object({
      type: Schema.const('davinci-003'),
      temperature: Schema.number().description('偏题程度').default(0),
      max_tokens: Schema.number().description('请求长度').default(1024),
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
    selfid: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),
    key: Schema.string().description('api_key').required(),
    reg: Schema.string().default('/名字[是|叫]“[^,]+”/').description('匹配人格的正则表达式'),
    waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
    authority: Schema.number().description('允许使用的最低权限').default(1),
    usage: Schema.number().description('每人每日可用次数').default(100),
    alias: Schema.array(String).default(['davinci', '达芬奇', 'ai']).description('触发命令;别名'),
    output: Schema.union([
      Schema.const('minimal').description('只发送文字消息'),
      Schema.const('default').description('以聊天记录形式发送'),
      Schema.const('verbose').description('将对话转成图片'),
    ]).description('输出方式。').default('default')
  }).description('进阶设置')
])

export function getContent(userId: string, bot_id: string, resp: Resp, output: string) {
  if (output == 'minimal') {
    return resp.msg[resp.msg.length - 1].content
  } else if (output == 'default') {
    const result = segment('figure')
    for (var msg of resp.msg) {
      console.log(msg.role)
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
            userId: bot_id,
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
  } else {
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
        <ftooter>create by koishi-plugin-davinci-003__v1.3.1</ftooter>
      </div>

    </html>
  }
}

export function apply(ctx: Context, config: Config) {
  const reg=new RegExp(config.reg)
  if (!ctx.puppeteer&&config.output=='verbose') {
    logger.warn('未启用puppter,将无法发送图片')
  }
  const sessions: Array<string> = []
  const sessions_cmd: Array<string> = []
  const openai = new OpenAI(config.key, ctx);
  let num: number = 1;
  while (config.alias.length < 5) {
    config.alias.push(`davinci${num}`);
    num++;
  }
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.middleware(async (session, next) => {
    const session_id_string: string = session.channelId + session.userId
    if (!sessions.includes(session_id_string)) {
      return next()
    }
    sessions_cmd.forEach((i, _id) => {
      const i_len: number = i.length
      if (session.content.includes(i)) {
        session.execute(`dvc ${session.content.replace(i, '')}`)
        return
      }
    })
    return next()
  })
  ctx.command('dvc <prompt:text>', {
    authority: config.authority,
    maxUsage: config.usage,
    usageName: 'ai'
  })
    .alias(config.alias[0], config.alias[1], config.alias[2], config.alias[3], config.alias[4])
    .action(async ({ session }, prompt) => {
      if (!prompt) {
        return session.text('commands.dvc.messages.no-prompt')
      }
      if (config.waiting) {
        session.send(session.text('commands.dvc.messages.thinking'))
      }
      if (config.type == 'gpt3.5') {
        const session_id_string: string = session.channelId + session.userId

        let session_id_num: number = sessions.indexOf(session_id_string)
        if (session_id_num > -1 && session.content.includes('设置人格')) {
          let nick_name = '小猪'
          try {
            nick_name = prompt.match(reg)[0].slice(4, -1)
          }
          catch (err) {
            logger.warn('未设置nickname，可忽略')
          }
          sessions_cmd[session_id_num] = nick_name
        }
        if (session_id_num == -1) {
          let nick_name = '小猪'
          try {
            nick_name = prompt.match(reg)[0].slice(4, -1)
          }
          catch (err) {
            logger.warn('未设置nickname，可忽略')
          }
          sessions.push(session_id_string)
          sessions_cmd.push(nick_name)
          session_id_num = sessions.length
        }
        try {
          const resp: Resp = await ctx.http.post(config.endpoint, {
            'msg': prompt,
            'id': session_id_string,
            'api_key': config.key
          })
          return getContent(session.userId, config.selfid, resp, config.output)
        }
        catch (err) {
          logger.warn(err);
          return `${session.text('commands.dvc.messages.err')}${String(err)}`
        }

      }
      const opts: Payload = {
        engine: config.mode,
        prompt: prompt,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }
      try {
        const text: string = await openai.complete(opts);
        const resp:Resp = {'msg':[{"role":"user","content":prompt},{"role":"assistant","content":text}],'id':0}
        return getContent(session.userId, config.selfid, resp, config.output)
      }
      catch (err) {
        logger.warn(err);
        return `${session.text('commands.dvc.messages.err')}${String(err)}`
      }
    })
  ctx.command('余额').action(async ({ session }) => {
    try {
      const url = "https://chat-gpt.aurorax.cloud/dashboard/billing/credit_grants"
      const res = await ctx.http.get(url, {
        headers: {
          "Authorization": "Bearer " + config.key
        }
      })
      return session.text('commands.dvc.messages.total_available', [res["total_available"]])
    }
    catch (err) {
      logger.warn(err);
      return `${session.text('commands.dvc.messages.err')}${String(err)}`
    }
  })
}


class OpenAI {
  _api_key: string
  ctx: Context
  constructor(api_key: string, ctx: Context,) {
    this._api_key = api_key;
    this.ctx = ctx;
  }
  async _send_request(url: string, method: string, opts: Payload) {
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

  async complete(opts: Payload) {
    const url = `https://api.openai.com/v1/engines/${opts.engine}/completions`;
    delete opts.engine;
    return await this._send_request(url, 'post', opts);
  }
}