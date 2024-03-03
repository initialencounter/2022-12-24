import { Context, Schema, Logger, Session, h, trimSlash } from 'koishi'
import Sst from '@initencounter/sst'
export const name = 'paddlespeech-asr'
export const logger = new Logger(name)
import fs from 'fs';
import { exec } from 'child_process';
type CallbackFunction = (error: Error | null, result: Buffer | null) => void;


class PaddleSpeechAsr extends Sst {
  lang: string
  constructor(ctx: Context) {
    super(ctx)
    this.lang = this.ctx.config.lang
    ctx.i18n.define('zh', require('./locales/zh'));
    if (ctx.config.auto_rcg) {
      ctx.middleware(async (session, next) => {
        if (session.elements[0].type == "audio" && this.ctx.config.auto_rcg) {
          if (this.ctx.config.waiting) {
            const msgid = (await session.bot.sendMessage(session.channelId, h('quote', { id: session.messageId }) + session.text('commands.asr.messages.thinking'), session.guildId))[0]
            if (this.ctx.config.recall) {
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
    ctx.command('asr [url]', '语音连接转文字')
      .option('lang', '-l <lang:text>', { fallback: ctx.config.lang })
      .action(async ({ session, options }, url) => {
        this.lang = options.lang
        url = url ? url : 'https://paddlespeech.bj.bcebos.com/PaddleAudio/zh.wav'
        url = url.replace(/&amp;/g, "&")
        // url = 'http://grouptalk.c2c.qq.com/?ver=0&rkey=3062020101045b3059020101020101020465cb26a2042439387a4f765a334274434853236f5174586730495070666749577a62743433674f4c38780204648b2d74041f0000000866696c6574797065000000013100000005636f64656300000001300400&filetype=1&voice_codec=0'
        const buffer = Buffer.from((await this.get_file(url)))
        let res = ''
        await this.convertBase64AMRtoWAV(buffer, async (error, result) => {
          if (error) {
            res = 'Not a audio'
          } else {
            const base64_str = result.toString('base64')
            res = await this.make_requset(base64_str)
          }
        })
        while (!res) {
          await this.sleep(1000)
        }
        return res
      })
  }

  async audio2text(session: Session): Promise<string> {
    if (session.elements[0].type == "audio") {
      let url: string = session.elements[0]["attrs"].url
      let res = ''
      if (session.platform == 'wechaty') {
        const base64_str = url.replace('data:audio/wav;base64,', '')
        res = await this.make_requset(base64_str)
        return res
      } else {
        url = url.replace(/&amp;/g, "&")
        const buffer = Buffer.from((await this.get_file(url)))
        await this.convertBase64AMRtoWAV(buffer, async (error, result) => {
          if (error) {
            res = 'Not a audio'
          } else {
            const base64_str = result.toString('base64')
            res = await this.make_requset(base64_str)
          }
        })
        while (!res) {
          await this.sleep(1000)
        }
        return res
      }
    }
    return 'Not a audio'
  }
  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  async make_requset(base64): Promise<string> {
    const requset: PaddleSpeechAsr.Request = {
      audio: base64,
      audio_format: 'wav',
      sample_rate: 16000,
      lang: this.lang,
      punc: false
    }
    const res: PaddleSpeechAsr.Result = await this.ctx.http.post(
      trimSlash(this.ctx.config.endpoint + '/paddlespeech/asr'),
      requset
    )
    return res?.result?.transcription
  }
  async convertBase64AMRtoWAV(bufferData: Buffer, callback: CallbackFunction) {
    // 将Base64数据保存到临时文件
    const tempAMRFile = 'temp.amr';
    fs.writeFileSync(tempAMRFile, Buffer.from(bufferData));
    // 使用ffmpeg将AMR文件转换为WAV文件
    const command = `ffmpeg -i ${tempAMRFile} output.wav`;
    exec(command, async (error) => {
      callback(error, fs.readFileSync('output.wav'))
      fs.unlinkSync(tempAMRFile);
      fs.unlinkSync('output.wav');
    });
    ;
  }
  private async get_file(url: string): Promise<ArrayBuffer> {
    const response = await this.ctx.http.get(url,{
      responseType: "arraybuffer",
    });
    return response;
  }
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , this.ctx.config.recall_time));
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
    lang: Schema.string().default('zh').description('语言'),
    waiting: Schema.boolean().default(true).description('消息反馈，会发送计算中...'),
    recall: Schema.boolean().default(true).description('会撤回计算中'),
    recall_time: Schema.number().default(5000).description('撤回的时间'),
  })

}

export default PaddleSpeechAsr



