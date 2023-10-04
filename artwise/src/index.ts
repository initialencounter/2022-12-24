import { Context, Schema, Session, h, Dict, Next, Logger } from 'koishi'
export const name = 'artwise'
export const logger = new Logger(name)
export const midjourney_action_dict: Dict = {
  '1': 'upsample1',
  '2': 'upsample2',
  '3': 'upsample3',
  '4': 'upsample4',
  '5': 'variation1',
  '6': 'variation2',
  '7': 'variation3',
  '8': 'variation4'
}
export const chatgpt3_conversation_id_dict: Dict = {}
export const chatgpt4_conversation_id_dict: Dict = {}
export const midjourney_image_dict: Dict = {}
const BASEURL: string = 'https://api.zhishuyun.com'

class Zsy {
  constructor(private ctx: Context, private config: Zsy.Config) {
    ctx.i18n.define('zh', require('./locales/zh'))
    ctx.command('mj', 'Midjourney Imagine API').action(async ({ session }, prompt) => this.midjourney(session, session.content.slice(3,)))
    ctx.command('mai', 'ChatGPT 4 API').action(async ({ session }, prompt) => this.chatgpt4(session, prompt))
    ctx.command('wai', 'ChatGPT 3.5 API').action(async ({ session }, prompt) => this.chatgpt3(session, prompt))
    // ctx.command('uai', '网页详情内容解析').action(async ({ session }, prompt) => this.article(session, prompt))
    ctx.middleware(async (session, next) => this.middleware(session, next))
  }
  async middleware(session: Session, next: Next) {
    if (!session.parsed.appel) {
      return next()
    }

    if (!session.quote) {
      return next()
    }
    if (Object.keys(midjourney_image_dict).includes(session.quote.messageId)) {
      const { image_id, prompt } = midjourney_action_dict[session.quote.messageId]
      let msg: string
      msg = msg.replace(`<at id="${session.bot.selfId}"/> `, '')
      msg = msg.replace(`<at id="${session.bot.selfId}"/> `, '')
      return this.secondary_request(session, image_id, midjourney_action_dict[msg], prompt)
    }
  }
  async midjourney(session: Session, prompt: string) {
    const payload = {
      prompt: prompt
    };
    const url = `${BASEURL}/midjourney/imagine?token=${this.config.midjourney_token}`;
    let res: Zsy.MidjourneyRes
    try{
      res = await this.midjourney_request(session, url, payload)
    }catch(e){
      logger.error('出错了，正在重试')
      res = await this.midjourney_request(session, url, payload)
    }
    const messageId = (await session.bot.sendMessage(session.channelId, h.image(res.image_url), session.guildId))[0]
    midjourney_image_dict[messageId] = { image_id: res.image_id, prompt: prompt }
    let msg: string = '请输入后续操作编号:\n'
    res.actions.forEach((i, id) => {
      msg += String(id + 1) + ' ' + i + '\n'
    })
    await session.send(msg)
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) return
    const action: string = res.actions[+input - 1]
    try{
      return await this.secondary_request(session, res.image_id, action, prompt)
    }catch(e){
      logger.error('出错了，正在重试')
      return await this.secondary_request(session, res.image_id, action, prompt)
    }
    
  }
  async midjourney_request(session: Session, url: string, option: Zsy.MidjourneyReq) {
    if (this.config.waiting) await session.send(session.text('commands.mj.messages.waiting'))
    const payload = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...option
    }
    return await this.ctx.http.post(url, payload)
  }
  async secondary_request(session: Session, image_id: string, action_: string, prompt: string) {
    const payload: Zsy.MidjourneyReq = {
      action: action_,
      prompt,
      image_id
    };
    const url = `${BASEURL}/midjourney/imagine?token=${this.config.midjourney_token}`;
    const res: Zsy.MidjourneyRes = await this.midjourney_request(session, url, payload)
    const messageId = (await session.bot.sendMessage(session.channelId, h.image(res.image_url), session.guildId))[0]
    midjourney_image_dict[messageId] = { image_id: res.image_id, prompt: prompt }
    let msg: string = '请输入后续操作编号:\n'
    res.actions.forEach((i, id) => {
      msg += String(id + 1) + ' ' + i + '\n'
    })
    await session.send(msg)
    const input = await session.prompt()
    if (!input || Number.isNaN(+input)) return
    const action: string = res.actions[+input - 1]
    return await this.secondary_request(session, res.image_id, action, prompt)
  }
  async chatgpt4(session: Session, prompt: string) {
    let conversation_id: string
    if (this.config.stateful) {
      conversation_id = chatgpt4_conversation_id_dict[session.userId]
    }
    const url = `${BASEURL}/chatgpt4?token=${this.config.gpt4_token}`;
    const payload: Zsy.MidjourneyReq = {
      question: prompt,
      stateful: this.config.stateful,
      conversation_id
    };

    const res = await this.midjourney_request(session, url, payload)
    if (res.conversation_id) {
      chatgpt4_conversation_id_dict[session.userId] = res.conversation_id
    }
    return res.answer
  }
  async chatgpt3(session: Session, prompt: string) {
    let conversation_id: string
    if (this.config.stateful) {
      conversation_id = chatgpt3_conversation_id_dict[session.userId]
    }
    const url = `${BASEURL}/chatgpt?token=${this.config.gpt3_token}`;
    const payload: Zsy.MidjourneyReq = {
      question: prompt,
      stateful: this.config.stateful,
      conversation_id
    };

    const res = await this.midjourney_request(session, url, payload)
    if (res.conversation_id) {
      chatgpt3_conversation_id_dict[session.userId] = res.conversation_id
    }
    return res.answer
  }
  // async article(session: Session, target_url: string) {
  //   const url = `${BASEURL}/extract/article?token=${this.config.article_token}`;
  //   const payload: Zsy.MidjourneyReq = {
  //     'js': true,
  //     'url': target_url
  //   };
  //   const res: Zsy.MidjourneyRes = await this.midjourney_request(session,url, payload)
  //   return JSON.stringify(res)
  // }
}
namespace Zsy {
  export const usage = `

## 注意事项

> 使用前在 <a style="color:blue" href="https://data.zhishuyun.com/documents">知数云</a> 中获取token<br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-artwise 概不负责。<br>
## 使用方法
![alt 示例](https://raw.githubusercontent.com/initialencounter/mykoishi/master/screenshot/16.png)
| 功能 | 指令 |
|  ----  | ----  |
| midjourney | mj |
| ChatGPT 4 | mai |
| ChatGPT 3.5 | wai |

## 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~
`
  export interface Article_Res {

  }
  export interface GptRes {
    answer: string
    conversation_id?: string
  }
  export interface MidjourneyReq {
    prompt?: string
    action?: string
    image_id?: string
    question?: string
    stateful?: boolean
    conversation_id?: string
    js?: boolean
    url?: string
  }
  export interface MidjourneyRes {
    task_id: string
    image_id: string
    image_url: string
    actions: string[]
  }

  export interface Config {
    waiting: boolean
    midjourney_token: string
    gpt4_token: string
    stateful: boolean
    gpt3_token: string
    // article_token: string
    // js: boolean
  }

  export const Config: Schema<Config> = Schema.object({
    midjourney_token: Schema.string().default('').description('midjourney令牌'),
    waiting: Schema.boolean().default(true).description('消息反馈'),
    gpt4_token: Schema.string().default('').description('gpt4_token令牌'),
    stateful: Schema.boolean().default(false).description('是否开启多轮对话功能。'),
    gpt3_token: Schema.string().default('').description('gpt3.5_token令牌'),
    // article_token: Schema.string().default('').description('文章识别令牌'),
    // js: Schema.boolean().default(true).description('是否进行 JavaScript 渲染'),

  })
}
export default Zsy