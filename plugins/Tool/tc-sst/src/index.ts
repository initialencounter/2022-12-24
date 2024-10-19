import { Context, Schema, Logger, Session } from 'koishi'
import Sst from '@initencounter/sst'
import { } from 'koishi-plugin-adapter-onebot'
import * as tencentcloud from "tencentcloud-sdk-nodejs-asr";
const AsrClient = tencentcloud.asr.v20190614.Client;

export const name = 'tc-sst'
export const logger = new Logger(name)

class TcSst extends Sst {
  client: any
  pluginConfig: TcSst.Config
  constructor(ctx: Context, config: TcSst.Config) {
    super(ctx)
    this.pluginConfig = config
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
    this.client = new AsrClient(clientConfig);
    ctx.i18n.define('zh', require('./locales/zh'));
    if (!config.auto_rcg) return
    ctx.middleware(async (session, next) => {
      if (session.elements[0].type == "audio") {
        let text: string = await this.audio2text(session)
        if (text == '') {
          text = session.text('sst.messages.louder')
        }
        return text
      }
      return next()
    })
  }
  async audio2text(session: Session): Promise<string> {
    if (session.elements[0].type == "audio") {
      console.log(session.elements[0])
      const record = await this.getRecordBase64(session)
      if (record.reason) {
        return record.reason
      }
      const text: string = await this.callAsrAPI(record)
      return text
    }
    return 'Not a audio'
  }

  private async callAsrAPI(record: TcSst.RecordResult): Promise<string> {
    const params = {
      EngSerViceType: this.pluginConfig.EngSerViceType,
      SourceType: 1,
      VoiceFormat: record.format,
      Data: record.base64
    };
    const res: TcSst.ASRResponse = await this.client.SentenceRecognition(params)
    return res.Result
  }
  private async getRecordBase64(session: Session): Promise<TcSst.RecordResult> {
    if (session.platform == 'onebot') {
      const file = await session.onebot.getRecord(session.elements[0].attrs.file, 'wav') as TcSst.RecordOneBot
      if (!file.base64) {
        return { reason: 'onebot 平台未开启 enableLocalFile2Url' }
      }
      return { base64: file.base64, format: 'wav' }
    }
    return { reason: '暂未支持该平台，请拷打开发者' }
  }
}
namespace TcSst {
  export const usage = `
## 使用说明
启用前请前往 <a style="color:blue" href="https://cloud.tencent.com/product/asr">腾讯云</a>创建应用，<br>
再到<a style="color:blue" href="https://console.cloud.tencent.com/cam/capi">腾讯云控制台</a> 进行获取密钥
只适配了QQ平台,其他平台兼容性未知
`
  export interface Config {
    AK_W: string
    SK_W: string
    endpoint: string
    region: string
    auto_rcg: boolean
    EngSerViceType: '8k_zh' | '8k_en' | '16k_zh' | '16k_zh-PY' | '16k_zh_medical' | '16k_en' | '16k_yue' | '16k_ja' | '16k_ko' | '16k_vi' | '16k_ms' | '16k_id' | '16k_fil' | '16k_th' | '16k_pt' | '16k_tr' | '16k_ar' | '16k_es' | '16k_hi' | '16k_fr' | '16k_de' | '16k_zh_dialect'
  }

  export interface RecordOneBot {
    file: string
    url: string
    file_size: string
    file_name: string
    base64?: string
  }

  export interface RecordResult {
    reason?: string
    base64?: string
    format?: string
  }

  export interface ASRResponse {
    AudioDuration: number
    RequestId: string
    Result: string
    WordList: null
    WordSize: number
  }

  export const Config: Schema<Config> = Schema.object({
    AK_W: Schema.string().description('语音识别AK'),
    SK_W: Schema.string().description('语音识别SK'),
    auto_rcg: Schema.boolean().default(false).description('自动语音转文字,作为服务启用时建议关闭'),
    endpoint: Schema.string().default('asr.tencentcloudapi.com').description('腾讯云域名'),
    region: Schema.string().default('ap-guangzhou').description('区域'),
    EngSerViceType: Schema.union(
      [
        Schema.const('8k_zh').description('中文电话通用'),
        Schema.const('8k_en').description('英文电话通用'),
        Schema.const('16k_zh').description('中文通用'),
        Schema.const('16k_zh-PY').description('中英粤'),
        Schema.const('16k_zh_medical').description('中文医疗'),
        Schema.const('16k_en').description('英语'),
        Schema.const('16k_yue').description('粤语'),
        Schema.const('16k_ja').description('日语'),
        Schema.const('16k_ko').description('韩语'),
        Schema.const('16k_vi').description('越南语'),
        Schema.const('16k_ms').description('马来语'),
        Schema.const('16k_id').description('印度尼西亚语'),
        Schema.const('16k_fil').description('菲律宾语'),
        Schema.const('16k_th').description('泰语'),
        Schema.const('16k_pt').description('葡萄牙语'),
        Schema.const('16k_tr').description('土耳其语'),
        Schema.const('16k_ar').description('阿拉伯语'),
        Schema.const('16k_es').description('西班牙语'),
        Schema.const('16k_hi').description('印地语'),
        Schema.const('16k_fr').description('法语'),
        Schema.const('16k_de').description('德语'),
        Schema.const('16k_zh_dialect').description('多方言，支持23种方言（上海话、四川话、武汉话、贵阳话、昆明话、西安话、郑州话、太原话、兰州话、银川话、西宁话、南京话、合肥话、南昌话、长沙话、苏州话、杭州话、济南话、天津话、石家庄话、黑龙江话、吉林话、辽宁话）'),
      ]
    ).default('16k_zh').description('引擎模型类型'),
  })

}

export default TcSst


