import { Context, Schema, Logger, segment } from 'koishi';
import { } from '@koishijs/plugin-rate-limit';
export const name = 'davinci-003';
export const logger = new Logger(name);
export interface Msg{
  role:string
  content:string
}
export interface Resp{
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
  waitinng: boolean
  usage: number
  mode: string
  flod: boolean
  selfid: string
}
export const usage = `
## 注意事项
> 使用前在 <a href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key
由于 OpenAi被墙，使用davinci-003时需要在基础设置里面设置代理服务器地址
gpt后端参考自<a href="https://lucent.blog/?p=118">Lucent</a>
自建gpt后端<a href="https://github.com/initialencounter/mykoishi/blob/main/davinci-003#readme.md">教程</a>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-davinci-003 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`
export const Config = Schema.intersect([
  Schema.object({
    type: Schema.union([
      Schema.const('gpt3.5' as const).description('自建服务端带人格版'),
      Schema.const('davinci-003' as const).description('达芬奇'),
    ] as const).default('gpt3.5').description('后端选择'),
  }).description('基础设置'),
  Schema.union([
    Schema.object({
      type: Schema.const('gpt3.5'),
      endpoint: Schema.string().description('API 服务器地址。').required()
    }),
    Schema.object({
      type: Schema.const('davinci-003'),
      key: Schema.string().description('api_key').required(),
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
    waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
    authority: Schema.number().description('允许使用的最低权限').default(1),
    usage: Schema.number().description('每人每日可用次数').default(100),
    alias: Schema.array(String).default(['davinci', '达芬奇', 'ai']).description('触发命令;别名'),
    flod: Schema.boolean().default(false).description('会发送聊天记录'),
    selfid: Schema.string().default('3118087750').description('机器人的头像'),
  }).description('进阶设置')
])

export function getContent(userId: string, bot_id: string, resp: Resp,flod:boolean) {
  if(!flod){
    return resp.msg[resp.msg.length-1].content
  }
  const result = segment('figure')
  let usrid: string = userId
  let count: number = 0
  for (var msg of resp.msg) {
    if (count % 2 == 0) {
      usrid = bot_id
    }
    result.children.push(
      segment('message', {
        userId: usrid,
        nickname: msg.role,
      }, msg.content))
  }
  return result
}

export function apply(ctx: Context, config: Config) {
  const sessions:Array<string> = []
  const openai = new OpenAI(config.key, ctx);
  let num: number = 1;
  while (config.alias.length < 5) {
    config.alias.push(`davinci${num}`);
    num++;
  }
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.command('dvc <prompt:string>', {
    authority: config.authority,
    maxUsage: config.usage,
    usageName: 'ai'
  })
    .alias(config.alias[0], config.alias[1], config.alias[2], config.alias[3], config.alias[4])
    .action(async ({ session }, prompt) => {
      if (!prompt) {
        return session.text('commands.dvc.messages.no-prompt')
      }
      if (config.waitinng) {
        session.send(session.text('commands.dvc.messages.thinking'))
      }
      if (config.type == 'gpt3.5') {
        const session_id_string: string = session.channelId + session.userId
        let session_id_num:number = sessions.indexOf(session_id_string)
        if (session_id_num == -1) {
          sessions.push(session_id_string)
          session_id_num = sessions.length
        }
        try {
          const resp: Resp = await ctx.http.post(config.endpoint, {
            'msg': prompt,
            'id': session_id_num
          })
          return getContent(session.userId,config.selfid,resp,config.flod)
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
        return text
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
