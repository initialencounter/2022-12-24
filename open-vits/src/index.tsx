import { Context, Schema, h, Session, Logger, Dict } from 'koishi'
import { } from '@koishijs/translator';
import Vits from '@initencounter/vits'
export const using = ['translator']
export const name: string = 'open-vits'
export const logger: Logger = new Logger(name)

class OpenVits extends Vits {
  temp_msg: string
  speaker: number
  speaker_list: Dict[]
  max_speakers: number
  speaker_dict: Dict
  recall_time: number
  max_length: number
  endpoint: string
  constructor(ctx: Context, config: OpenVits.Config) {
    super(ctx)
    this.speaker = Number(config.speaker_id)
    this.speaker = (this.speaker < this.max_speakers && this.speaker > 0) ? this.speaker : 172
    this.recall_time = config.recall_time
    this.max_length = config.max_length
    this.endpoint = config.endpoint
    this.speaker_dict = {}
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.on('ready', async () => {
      this.speaker_list = (await this.ctx.http.get('http://api.t4wefan.pub:60254/voice/speakers'))['VITS']
      this.max_speakers = this.speaker_list.length - 1
      this.speaker_list.forEach((i, id) => {
        let speaker_name: string = Object.values(i)[0]
        const tail_id: number = Object.values(i)[0].indexOf('（')
        if (tail_id > -1) {
          speaker_name = speaker_name.slice(0, tail_id)
        }
        this.speaker_dict[String(id)] = speaker_name
      })
    })
    // 记录发送消息的messageid
    ctx.on('send', (session) => {
      this.temp_msg = session.messageId
    })
    ctx.command('say <input:text>', 'vits语音合成')
      .option('speaker', '-s <speaker:string>', { fallback: config.speaker_id })
      .option('lang', '-l <lang:string>')
      .action(async ({ session, options }, input) => {
        await session.send((String(await ctx.http.get('https://drive.t4wefan.pub/d/blockly/open-vits/help/waiting.txt', { responseType: "text" })) + String(options.lang ? options.lang : 'zh')));
        // 判断是否需要撤回
        if (config.recall) {
          this.recall(session, this.temp_msg)
        }
        if (!input) {
          return (String(h('at', { id: (session.userId) })) + String(await ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/help.txt', { responseType: "text" })));
        }

        if (input.length > config.max_length) {
          return String(h('at', { id: (session.userId) })) + (String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: "text" })));
        }
        // 判断speaker_id是否合法
        const reg: RegExp = /^\d+(\d+)?$/
        if ((!reg.test(options.speaker)) && Object.values(this.speaker_dict).indexOf(options.speaker) > -1) {
          this.speaker = Object.values(this.speaker_dict).indexOf(options.speaker)
        } else {
          this.speaker = options.speaker ? Number(options.speaker) : Number(config.speaker_id)
          this.speaker = (this.speaker < this.max_speakers && this.speaker > 0) ? this.speaker : 3
        }
        const languageCodes = ['zh', 'en', 'fr', 'jp', 'ru', 'de']
        if (options.lang) {
          if ((languageCodes.indexOf(options.lang) > -1) && config.translator && ctx.translator) {
            const zhPromptMap: string[] = input.match(/[\u4e00-\u9fa5]+/g)
            if (zhPromptMap?.length > 0) {
              try {
                const translatedMap = (await ctx.translator.translate({ input: zhPromptMap.join(','), target: options.lang })).toLocaleLowerCase().split(',')
                zhPromptMap.forEach((t, i) => {
                  input = input.replace(t, translatedMap[i]).replace('，', ',')
                })
              } catch (err) {
                logger.warn(err)
              }
            }
          }
        }
        const speaker_id: number = this.speaker
        const result: OpenVits.Result = { input, speaker_id }
        result.output = await this.say(result)
        return result.output
      })
  }
  // 撤回的方法
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      , this.recall_time));
  }

  /**
   * 
   * @param input 要转化的文本
   * @param speaker_id 音色id，可选
   * @returns 
   */
  async say(option: OpenVits.Result): Promise<h> {
    let { input, speaker_id } = option
    if (!speaker_id) {
      speaker_id = this.speaker
    }
    if (input.length > this.max_length) {
      return h(String(await this.ctx.http.get('https://drive.t4wefan.pub/d/koishi/vits/error_too_long.txt', { responseType: "text" })));
    }
    try {
      const url: string = `${this.endpoint}/voice?text=${encodeURIComponent(input)}&id=${speaker_id}&format=ogg`
      const response: Buffer = await this.ctx.http.get(url, { responseType: 'arraybuffer' });
      return h.audio(response, 'audio/mpeg')
    } catch (e) {
      logger.info(String(e))
      return h(String(e))
    }

  };
}
namespace OpenVits {
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
  export interface Result {
    input: string
    speaker_id?: number
    output?: h
  }
  export interface Config {
    endpoint: string
    max_length: number
    waiting: boolean
    recall: boolean
    recall_time: number
    speaker_id: string
    translator: boolean
  }
  export const Config =
    Schema.object({
      endpoint: Schema.string().default('https://api.vits.t4wefan.pub').description('vits服务器地址'),
      speaker_id: Schema.string().default('3').description('speaker_id'),
      max_length: Schema.number().default(256).description('最大长度'),
      waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
      recall: Schema.boolean().default(true).description('会撤回思考中'),
      recall_time: Schema.number().default(5000).description('撤回的时间'),
      translator: Schema.boolean().default(true).description('将启用翻译'),
    })

}

export default OpenVits