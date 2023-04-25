import { Context, Schema, Logger } from 'koishi'
// Depends on tencentcloud-sdk-nodejs version 4.0.3 or higher
const tencentcloud  = require("tencentcloud-sdk-nodejs-asr");
const AsrClient = tencentcloud.asr.v20190614.Client;
// 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
// 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考，建议采用更安全的方式来使用密钥，请参见：https://cloud.tencent.com/document/product/1278/85305
// 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取



export const name = 'tc-sst'
export const logger = new Logger(name)

class Sst {
  if_whisper_gettoken: boolean
  whisper_token: string
  len: number
  client : any
  constructor(private ctx: Context, private config: Sst.Config) {
    const clientConfig = {
      credential: {
        secretId: "",
        secretKey: "",
      },
      region: "ap-guangzhou",
      profile: {
        httpProfile: {
          endpoint: "asr.tencentcloudapi.com",
        },
      },
    };
    // 实例化要请求产品的client对象,clientProfile是可选的
    this.client = new AsrClient(clientConfig);
    this.if_whisper_gettoken = false
    ctx.on('ready', async () => {
      logger.info('ready')
    })

    ctx.middleware(async (session, next) => {
      if (session.elements[0].type == "audio") {
        const url: string = session.elements[0]["attrs"].url
        const taskid = await this.create_task(url)
        const text = await this.get_res(taskid)
        return text
      }
    })
  }
  async initialize() {
    if (this.config.AK_W && this.config.SK_W && this.config.whisper) {
      
    }
    if (!this.client) {
      this.config.whisper = false
    }
  }
  async get_res(taskid) {
    const params = {
        "TaskId": taskid
    };
    let res = await this.client.DescribeTaskStatus(params)
    while(res.Data.StatusStr == 'waiting'||res.Data.StatusStr == 'doing'){
      res = await this.client.DescribeTaskStatus(params)
    }
    console.log(res)
    return res.Data.Result
    
  }
  async create_task(url?:string){
    const params = {
      "EngineModelType": "16k_zh",
      "ChannelNum": 1,
      "ResTextFormat": 0,
      "SourceType": 0,
      "Url": url?url:"http://grouptalk.c2c.qq.com/?ver=0&rkey=3062020101045b30590201010201010204b9791595042439387a4f586a4d5f74434853236f347530386f4742314c344530777a3636514646324e570204644793f9041f0000000866696c6574797065000000013100000005636f64656300000001300400&filetype=1&voice_codec=0",
      "ConvertNumMode": 1,
      "FilterDirty": 0
  };
    const res =  (await this.client.CreateRecTask(params)).Data.TaskId
    return res
  }
  
  
}
namespace Sst {
  export interface Task_result{
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
    whisper: boolean
  }

  export const Config: Schema<Config> = Schema.object({
    AK_W: Schema.string().description('语音识别AK'),
    SK_W: Schema.string().description('语音识别SK'),
    whisper: Schema.boolean().default(true).description('语音输入功能'),
  })

}

export default Sst


