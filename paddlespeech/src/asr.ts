import { Context, Schema, Logger, Session, h, trimSlash } from 'koishi'
import Sst from '@initencounter/sst'
export const name = 'paddlespeech-asr'
export const logger = new Logger(name)

class PaddleSpeechAsr extends Sst {
  lang: string
  constructor(ctx: Context, private config: PaddleSpeechAsr.Config) {
    super(ctx)
    this.lang = config.lang
    ctx.i18n.define('zh', require('./locales/zh'));
    if (config.auto_rcg) {
      ctx.middleware(async (session, next) => {
        if (session.elements[0].type == "audio" && this.config.auto_rcg) {
          if (this.config.waiting) {
            const msgid = (await session.bot.sendMessage(session.channelId, h('quote', { id: session.messageId }) + session.text('commands.asr.messages.thinking'), session.guildId))[0]
            if (this.config.recall) {
              await this.recall(session, msgid)
            }
          }
          let text: string = await this.audio2text(session)
          if (text == '') {
            text = session.text('sst.messages.louder')
          }
          return h('quote', { id: session.messageId }) + text
        }
      })
    }
    ctx.command('asr [url]','语音连接转文字')
    .option('lang','-l <lang:text>',{fallback:config.lang})
    .action(async({session,options},url)=>{
      this.lang = options.lang
      url = url?url:'https://paddlespeech.bj.bcebos.com/PaddleAudio/zh.wav'
      const buffer = Buffer.from((await this.get_file(url)))
      const base64 = buffer.toString('base64')
      return await this.make_requset(
        base64
        )
    })
  }
  
  async audio2text(session: Session): Promise<string> {
    if (session.elements[0].type == "audio") {
      const url: string = session.elements[0]["attrs"].url
      let base64_str
      if (session.platform == 'wechaty') {
        base64_str = url.replace('data:audio/wav;base64,', '')
      } else {
        const buffer = Buffer.from((await this.get_file(url)))
        base64_str = buffer.toString('base64')
      }
      const text: string = await this.make_requset(base64_str)
      return text
    }
    return 'Not a audio'
  }
  async make_requset(base64): Promise<string> {
    const requset: PaddleSpeechAsr.Request = {
      audio: base64,
      audio_format: 'wav',
      sample_rate: 16000,
      lang: this.lang,
      punc: false
    }
    const res: PaddleSpeechAsr.Result = (await this.ctx.http.axios({
      url: trimSlash(this.config.endpoint + '/paddlespeech/asr'),
      method: 'POST',
      data: requset,
    })).data
    return res?.result?.transcription
  }
  private async get_file(url: string): Promise<ArrayBuffer> {
    const response = await this.ctx.http.axios({
      url,
      method: 'GET',
      responseType: "arraybuffer",
    });
    return response.data;
  }
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , this.config.recall_time));
  }
}
namespace PaddleSpeechAsr {

  export interface Result {
    success: true,
    code: number
    message: {
      description: string
    },
    result: {
      transcription: string
    }
  }
  export interface Request {
    audio: string
    audio_format: string
    sample_rate: number
    lang: string
    punc: boolean
  }

  export interface Config {
    endpoint: string
    auto_rcg: boolean
    lang: string
    waiting: boolean
    recall: boolean
    recall_time: number
  }
  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().default('http:127.0.0.1:8888').description('飞桨服务器地址'),
    auto_rcg: Schema.boolean().default(false).description('自动语音转文字,作为服务启用时建议关闭'),
    lang: Schema.union([
      Schema.const('zh').description('汉语'),
      Schema.const('en').description('英语'),
    ]).default('zh').description('语言'),
    waiting: Schema.boolean().default(true).description('消息反馈，会发送计算中...'),
    recall: Schema.boolean().default(true).description('会撤回计算中'),
    recall_time: Schema.number().default(5000).description('撤回的时间'),
  })

}

export default PaddleSpeechAsr



