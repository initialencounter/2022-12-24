import { Context, Schema, h, Session, Logger} from 'koishi'
import Vits from '@initencounter/vits'
const tencentcloud = require("tencentcloud-sdk-nodejs-tts");
const AsrClient = tencentcloud.tts.v20190823.Client;

export const name: string = 'tencent-tts'
export const logger: Logger = new Logger(name)

class TencentTts extends Vits {
  temp_msg: string
  speaker: number
  recall_time: number
  max_length: number
  endpoint: string
  client: any
  PrimaryLanguage: number
  constructor(ctx: Context, config: TencentTts.Config) {
    super(ctx)
    this.speaker = config.speaker_id
    this.recall_time = config.recall_time
    this.max_length = config.max_length
    this.PrimaryLanguage = 1
    if (this.speaker == (1050 || 1051)) {
      this.PrimaryLanguage = 2
    }
    const clientConfig = {
      credential: {
        secretId: config.AK_W,
        secretKey: config.SK_W,
      },
      region: config.region,
      profile: {
        httpProfile: {
          endpoint: config.endpoint,
        },
      },
    };
    // 实例化要请求产品的client对象,clientProfile是可选的
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.on('ready', async () => {
      this.client = new AsrClient(clientConfig);
    })
    // 记录发送消息的messageid
    ctx.on('send', (session) => {
      this.temp_msg = session.messageId
    })
    ctx.command('say <input:text>', 'vits语音合成')
      .option('speaker', '-s <speaker:number>', { fallback: config.speaker_id })
      .action(async ({ session, options }, input) => {
        await session.send(session.text('commands.say.messages.waiting'));
        // 判断是否需要撤回
        if (config.recall) {
          this.recall(session, this.temp_msg)
        }
        const speaker_id: number = options.speaker?options.speaker:config.speaker_id
        const result: TencentTts.Result = { input, speaker_id }
        return await this.say(result)
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
  async say(option: TencentTts.Result): Promise<h> {
    let { input, speaker_id } = option
    if (!speaker_id) {
      speaker_id = this.speaker
    }
    if (input.length > this.max_length) {
      return h('字数过长');
    }
    const params: TencentTts.Params = {
      Text: input,
      SessionId: "1",
      VoiceType: speaker_id,
      PrimaryLanguage: this.PrimaryLanguage
    }
    try {
      const response_base64 = (await this.client.TextToVoice(params)).Audio
      const response_buffer: Buffer = Buffer.from(response_base64,'base64')
      return h.audio(response_buffer, 'audio/mpeg')
    } catch (e) {
      logger.info(String(e))
      return h(String(e))
    }

  };
}
namespace TencentTts {
  export const usage = `
## 注意事项
>启用前请前往 <a style="color:blue" href="https://cloud.tencent.com/product/asr">腾讯云</a>创建应用，<br>
再到<a style="color:blue" href="https://console.cloud.tencent.com/cam/capi">腾讯云控制台</a> 进行获取密钥
## 使用方法
* say 要转化的文本

## 问题反馈群: 
399899914
`
  export interface Params {
    Text?: string
    SessionId?: string
    VoiceType: number
    PrimaryLanguage?: number
  };
  export interface Result {
    input: string
    speaker_id?: number
    output?: h
  }
  export interface Config {
    AK_W: string
    SK_W: string
    max_length: number
    waiting: boolean
    recall: boolean
    recall_time: number
    speaker_id: number
    region: string
    endpoint: string
  }
  export const Config =
    Schema.object({
      AK_W: Schema.string().description('语音合成AK'),
      SK_W: Schema.string().description('语音合成SK'),
      speaker_id: Schema.number().default(101007).description('标准音色'),
      max_length: Schema.number().default(256).description('最大长度'),
      waiting: Schema.boolean().default(false).description('消息反馈，会发送思考中...'),
      recall: Schema.boolean().default(true).description('会撤回思考中'),
      recall_time: Schema.number().default(5000).description('撤回的时间'),
      region: Schema.union([
        Schema.const('ap-beijing').description('华北地区(北京) '),
        Schema.const('ap-chengdu').description('西南地区(成都)'),
        Schema.const('ap-chongqing').description('西南地区(重庆'),
        Schema.const('ap-guangzhou').description('华南地区(广州)'),
        Schema.const('ap-hongkong').description('港澳台地区(中国香港)'),
        Schema.const('ap-shanghai').description('华东地区(上海)'),
        Schema.const('ap-nanjing').description('华东地区(南京)'),
        Schema.const('ap-shanghai-fsi').description('金融区华东地区(上海金融)'),
        Schema.const('ap-shenzhen-fsi').description('华南地区(深圳金融)'),
      ]).default('ap-shanghai').description('语音合成SK'),
      endpoint: Schema.string().default('tts.tencentcloudapi.com').description('腾讯云域名')
    })
}

export default TencentTts