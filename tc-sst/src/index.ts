import { Context, Schema, Logger, Session, Service, h } from 'koishi'
const tencentcloud = require("tencentcloud-sdk-nodejs-asr");
const AsrClient = tencentcloud.asr.v20190614.Client;

declare module 'koishi' {
  interface Context {
    sst: Sst
  }
  class Sst {
    audio2text(sessin: Session): Promise<string>
  }
}

export const name = 'tc-sst'
export const logger = new Logger(name)

class Sst extends Service {
  if_whisper_gettoken: boolean
  whisper_token: string
  len: number
  client: any
  constructor(ctx: Context, private config: Sst.Config) {
    super(ctx, 'sst', true)
    const clientConfig = {
      credential: {
        secretId: this.config.AK_W,
        secretKey: this.config.SK_W,
      },
      region: this.config.region,
      profile: {
        httpProfile: {
          endpoint: this.config.endpoint,
        },
      },
    };
    // 实例化要请求产品的client对象,clientProfile是可选的
    this.client = new AsrClient(clientConfig);
    this.if_whisper_gettoken = false
    ctx.i18n.define('zh', require('./locales/zh'));
    if (config.auto_rcg) {
      ctx.middleware(async (session, next) => {
        if (session.elements[0].type == "audio") {
          let text: string = await this.audio2text(session)
          if (text == '') {
            text = session.text('sst.messages.louder')
          }
          return h('quote', { id: session.messageId }) + text
        }
      })
    }

  }
  async audio2text(session: Session): Promise<string> {
    if (session.elements[0].type == "audio") {
      const url: string = session.elements[0]["attrs"].url
      const taskid: string = await this.create_task(url)
      const text: string = await this.get_res(taskid)
      return text
    }
    return 'Not a audio'
  }
  private async get_res(taskid: string): Promise<string> {
    const params = {
      "TaskId": taskid
    };
    let res: Sst.Task_result = await this.client.DescribeTaskStatus(params)
    while (res.Data.StatusStr == 'waiting' || res.Data.StatusStr == 'doing') {
      await this.sleep(618)
      res = await this.client.DescribeTaskStatus(params)
    }
    const segment_text: string[] = (res.Data.Result + '\n').split('\n')
    let text: string = ''
    for (var i of segment_text) {
      const id: number = i.indexOf(' ')
      if (id > -1) {
        text += i.slice(id, i.length)
      }
    }
    return text

  }
  private sleep(ms:number) {
    return new Promise(resolve=>setTimeout(resolve, ms))
  }
  private async create_task(url: string): Promise<string> {
    const params = {
      "EngineModelType": "16k_zh",
      "ChannelNum": 1,
      "ResTextFormat": 0,
      "SourceType": 0,
      "Url": url,
      "ConvertNumMode": 1,
      "FilterDirty": 0
    };
    const res = (await this.client.CreateRecTask(params)).Data.TaskId
    return res
  }


}
namespace Sst {
  export const usage = `
## 使用说明
启用前请前往 <a style="color:blue" href="https://console.cloud.tencent.com/cam/capi">腾讯云官网控制台</a> 进行获取密钥
只适配了QQ平台,其他平台兼容性未知
`
  export interface Task_result {
    RequestId: string
    Data: {
      TaskId: number
      Status: number
      StatusStr: string
      AudioDuration: number
      Result: string
      ResultDetail: null,
      ErrorMsg: string
    }
  }
  export interface Config {
    AK_W: string
    SK_W: string
    endpoint: string
    region: string
    auto_rcg: boolean
  }

  export const Config: Schema<Config> = Schema.object({
    AK_W: Schema.string().description('语音识别AK'),
    SK_W: Schema.string().description('语音识别SK'),
    auto_rcg: Schema.boolean().default(false).description('自动语音转文字,作为服务启用时建议关闭'),
    endpoint: Schema.string().default('asr.tencentcloudapi.com').description('腾讯云域名'),
    region: Schema.string().default('ap-guangzhou').description('区域')
  })

}

export default Sst


