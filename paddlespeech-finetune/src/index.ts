import { Context, Session, Schema, Logger, h, trimSlash, base64ToArrayBuffer } from 'koishi'
import Vits from '@initencounter/vits'
export const name = 'paddlespeech-finetune'
export const logger = new Logger(name)

class PaddleSpeechFinetune extends Vits {
  access_token: string
  temp_msg: string
  speaker: number
  max_length: number
  constructor(ctx: Context, private config: PaddleSpeechFinetune.Config) {
    super(ctx)
    this.max_length = this.config.max_length
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.command('say [input:text]', 'PaddleSpeech-Finetune')
      .action(async ({ session, options }, input) => {
        input = input ? input : '您好，欢迎使用百度飞桨语音合成服务。'
        this.speaker = 0
        if (this.config.waiting) {
          const msgid = (await session.bot.sendMessage(session.channelId, h('quote', { id: session.messageId }) + session.text('commands.tts.messages.thinking'), session.guildId))[0]
          if (this.config.recall) {
            await this.recall(session, msgid)
          }
        }
        const result: Vits.Result = { input, speaker_id: this.speaker }
        return await this.say(result)
      })
  }
  /**
     * 
     * @param input 要转化的文本
     * @param speaker_id 音色id，可选
     * @returns 
     */
  async say(option: Vits.Result): Promise<h> {
    let { input, speaker_id } = option
    if (!speaker_id) {
      speaker_id = this.speaker
    }

    if (input.length > this.max_length) {
      return h('字数过长');
    } else if (input.length == 0) {
      return h('字数为0');
    }
    const sentence: string[] = (() => {
      const sentences_arr = input.split(/[.|,|!|?|。|，|！|？]+/);
      const target_arr = []
      for (var i of sentences_arr) {
        if (i.length > 0) {
          target_arr.push(i)
        }
      }
      return target_arr
    })()
    if (sentence.length == 0) return h('Text ValueError')
    const body: PaddleSpeechFinetune.Request = {
      sentences: this.config.split_sentence ? sentence : [input]
    }
    const payload = {
      method: 'POST',
      url: trimSlash(this.config.endpoint + '/finetune_tts'),
      data: body
    }
    try {
      const response: PaddleSpeechFinetune.Result = (await this.ctx.http.axios(payload)).data
      return h.audio(base64ToArrayBuffer(response.audio), 'audio/wav')
    } catch (e) {
      logger.info(String(e))
      return h(String(e))
    }

  };
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , this.config.recall_time));
  }


}
namespace PaddleSpeechFinetune {
  export const usage = `
## 使用说明
[教程](https://github.com/initialencounter/PaddleSpeech)

## 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~

`
  export interface Result {
    audio: string
  }
  export interface Request {
    sentences: string[]
  }
  export interface Config {
    endpoint: string
    waiting: boolean
    recall: boolean
    recall_time: number
    max_length: number
    split_sentence: boolean
  }
  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().default('http://127.0.0.1:7861').description('finetune接口地址'),
    waiting: Schema.boolean().default(true).description('消息反馈，会发送计算中...'),
    recall: Schema.boolean().default(true).description('会撤回计算中'),
    recall_time: Schema.number().default(5000).description('撤回的时间'),
    max_length: Schema.number().default(1024).description('字数限制'),
    split_sentence: Schema.boolean().default(true).description('逐句合成'),
  })

}

export default PaddleSpeechFinetune



