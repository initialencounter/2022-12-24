import { Context, Schema, Logger, h } from 'koishi'
import Vits from '@initencounter/vits'
export const name = 'baidu-sst'
export const logger = new Logger(name)

class BaiduTts extends Vits {
  recall_time: number
  access_token: string
  temp_msg: string
  AK: string
  SK: string
  speaker: number
  max_length: number
  constructor(ctx: Context, config: BaiduTts.Config) {
    super(ctx)
    this.AK = config.AK_W
    this.SK = config.SK_W
    this.max_length = config.max_length
    this.speaker = config.speaker_id
    // 实例化要请求产品的client对象,clientProfile是可选的
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.on('ready', async () => {
      this.access_token = await this.getAccessToken()
    })
    ctx.command('say <input:text>', '百度智能云语音合成')
      .option('speaker', '-s <speaker:number>', { fallback: config.speaker_id })
      .action(async ({ session, options }, input) => {
        await session.send(session.text('commands.say.messages.waiting'));
        const speaker_id: number = options.speaker ? options.speaker : config.speaker_id
        const result: BaiduTts.Result = { input, speaker_id }
        return await this.say(result)
      })
  }
  /**
     * 
     * @param input 要转化的文本
     * @param speaker_id 音色id，可选
     * @returns 
     */
  async say(option: BaiduTts.Result): Promise<h> {
    let { input, speaker_id } = option
    if (!speaker_id) {
      speaker_id = this.speaker
    }
    if (input.length > this.max_length) {
      return h('字数过长');
    }
    const payload = {
      method: 'POST',
      url: 'https://tsn.baidu.com/text2audio',
      responseType: 'arraybuffer' as const,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*'
      },
      data: {
        tex: encodeURIComponent(input),
        tok: String(this.access_token),
        cuid: '1',
        ctp: '1',
        lan: 'zh',
        per: String(this.speaker),
        aue: '6'
      }
    }
    try {
      const response = (await this.ctx.http.axios(payload)) // JSON.parse(JSON.stringify(payload)) (x
      return h.audio(response.data, 'audio/wav')
    } catch (e) {
      logger.info(String(e))
      return h(String(e))
    }

  };


  /**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
  private async getAccessToken() {

    let options = {
      'method': 'POST',
      'url': 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + this.AK + '&client_secret=' + this.SK,
    }
    try {
      const res = await this.ctx.http.axios(options)
      return res.data.access_token
    } catch (e) {
      logger.error(e)
      return ''
    }

  }


}
namespace BaiduTts {
  export const usage = `
## 使用说明
启用前请前往 <a style="color:blue" href="https://console.bce.baidu.com/ai/#/ai/speech/overview/resource/getFree">领取</a>并创建应用
<a style="color:blue" href="https://console.bce.baidu.com/ai/#/ai/speech/app/list">领取</a> 进行获取密钥
只适配了QQ平台,其他平台兼容性未知
`
  export interface Result {
    input: string
    speaker_id?: number
    output?: h
  }
  export interface Form {
    tex: string
    tok: string
    cuid: string
    ctp: string
    lan: string
  }
  export interface Config {
    AK_W: string
    SK_W: string
    speaker_id: number
    max_length: number
  }

  export const Config: Schema<Config> = Schema.object({
    AK_W: Schema.string().description('语音合成AK'),
    SK_W: Schema.string().description('语音合成SK'),
    speaker_id: Schema.union([
      Schema.const(1).description('度小宇'),
      Schema.const(0).description('度小美'),
      Schema.const(4).description('度丫丫'),
      Schema.const(3).description('度逍遥')
    ]).default(0).description('标准音色'),
    max_length: Schema.number().default(256).description('最大长度')
  })

}

export default BaiduTts



