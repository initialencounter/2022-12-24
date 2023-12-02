import { Context, Schema, Logger, Session, h } from 'koishi'
import Sst from '@initencounter/sst'

export const name = 'baidu-sst'
export const logger = new Logger(name)

class BaiduSst extends Sst {
  if_whisper_gettoken: boolean
  access_token: string
  AK: string
  SK: string
  constructor(ctx: Context, config: BaiduSst.Config) {
    super(ctx)
    this.AK = config.AK_W
    this.SK = config.SK_W
    this.if_whisper_gettoken = true
    // 获取access token
    ctx.on('ready',async()=>{
      this.access_token = await this.getAccessToken()
      if(this.access_token==''){
        this.if_whisper_gettoken = false
      }
    })
    
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
    if(!this.if_whisper_gettoken){
      return 'AK 或 SK配置失败'
    }
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
      'method': 'POST',
      'url': 'https://aip.baidubce.com/rpc/2.0/aasr/v1/query?access_token=' + this.access_token,
      'headers': {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
      },
      data: {
              "task_ids": [
                      taskid
              ]
      }

  };
    let res = await this.ctx.http.axios(params)
    while (res.data.tasks_info[0].task_status == 'Running') {
      await this.sleep(618)
      res = await this.ctx.http.axios(params)
    }
    const text_segmet: string[] = (res.data.tasks_info[0].task_result.result)?(res.data.tasks_info[0].task_result.result):[]
    let text: string = ''
    for(var i of text_segmet){
      text+=i
    }
    return text

  }
  private sleep(ms:number) {
    return new Promise(resolve=>setTimeout(resolve, ms))
  }
  private async create_task(url: string): Promise<string> {
    const params = {
      'method': 'POST',
      'url': 'https://aip.baidubce.com/rpc/2.0/aasr/v1/create?access_token=' + this.access_token,
      'headers': {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      "data": {
        "speech_url": url,
        "format": "amr",
        "pid": 80001,
        "rate": 16000
      }

    };
    const res = await this.ctx.http.axios(params)
    return res.data.task_id
  }
  /**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
  private async getAccessToken() {

    let options = {
      'method': 'POST',
      'url': 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + this.AK + '&client_secret=' + this.SK,
    }
    try{
      const res = await this.ctx.http.axios(options)
    return res.data.access_token
    }catch(e){
      logger.error(e)
      return ''
    }
    
  }


}
namespace BaiduSst {
  export const usage = `
## 使用说明
启用前请前往 <a style="color:blue" href="https://console.bce.baidu.com/ai/#/ai/speech/app/list">百度智能云官网控制台</a> 进行获取密钥
只适配了QQ平台,其他平台兼容性未知
`
  export interface Config {
    AK_W: string
    SK_W: string
    auto_rcg: boolean
  }

  export const Config: Schema<Config> = Schema.object({
    AK_W: Schema.string().description('语音识别AK'),
    SK_W: Schema.string().description('语音识别SK'),
    auto_rcg: Schema.boolean().default(false).description('自动语音转文字,作为服务启用时建议关闭')
  })

}

export default BaiduSst



