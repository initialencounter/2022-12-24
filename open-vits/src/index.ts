import { Context, Schema, h, Service, Session, Logger } from 'koishi'
export const name: string = 'open-vits'
export const logger: Logger = new Logger(name)
declare module 'koishi' {
  interface Context {
    vits: Vits
  }
  interface Vits {
    say(prompt: string, speaker_id?: number): Promise<string | h>
  }

}
class Vits extends Service {
  temp_msg: string
  speaker: number
  constructor(ctx: Context, private config: Vits.Config) {
    super(ctx, 'vits', true)
    this.speaker = 3
    ctx.i18n.define('zh', require('./locales/zh'));

    // 记录发送消息的messageid
    ctx.on('send', (session) => {
      this.temp_msg = session.messageId
    })
    ctx.command('say <prompt:text>', 'vits文字转语音')
      .option('speaker', '-s <speaker:number>', { fallback: config.speaker_id })
      .action(async ({ session, options }, prompt) => {
        // 判断speaker_id是否合法
        this.speaker = options.speaker ? options.speaker : config.speaker_id
        this.speaker = (this.speaker < this.config.max_speakers && this.speaker > 0) ? this.speaker : 3
        await session.send(config.waiting_text)
        // 判断是否需要撤回
        if (config.recall) {
          this.recall(session, this.temp_msg)
        }
        return await this.say(prompt, this.speaker)
      })
  }
  // 撤回的方法
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , this.config.recall_time));
  }

  /**
   * 
   * @param prompt 要转化的文本
   * @param speaker_id 音色id，可选
   * @returns 
   */
  async say(prompt: string, speaker_id: number = this.config.max_speakers): Promise<string | h> {
    if (prompt.length > this.config.max_length) {
      return '文本过长'
    }
    try {
      const url: string = `${this.config.endpoint}/voice?text=${encodeURIComponent(prompt)}&id=${speaker_id}&format=ogg`
      const response: Buffer = await this.ctx.http.get(url, { responseType: 'arraybuffer' });
      return h.audio(response, 'audio/mpeg')
    } catch (e) {
      logger.info(String(e))
      return String(e)
    }

  };
}
namespace Vits {
  export const usage = `
## 注意事项
>对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-open-vits 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
后端搭建教程<a style="color:blue" href="https://github.com/Artrajz/vits-simple-api">vits-simple-api</a>
## 使用方法
* say 要转化的文本

## 问题反馈群: 
399899914
`
  export interface Config {
    endpoint: string
    max_length: number
    waiting: boolean
    waiting_text: string
    recall: boolean
    recall_time: number
    speaker_id: number
    max_speakers: number
  }
  export const Config =
    Schema.object({
      endpoint: Schema.string().required().description('vits服务器地址'),
      speaker_id: Schema.number().default(3).description('speaker_id'),
      max_length: Schema.number().default(256).description('最大长度'),
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      waiting_text: Schema.string().default('思考中...').description('等待时发送的文本'),
      recall: Schema.boolean().default(true).description('会撤回思考中'),
      recall_time: Schema.number().default(5000).description('撤回的时间'),
      max_speakers: Schema.number().default(3).description('max_speakers')
    })

}

export default Vits