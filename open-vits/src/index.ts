import { Context, Schema,h,Service,Session } from 'koishi'
export const name = 'open-vits'
declare module 'koishi' {
  interface Context {
    vits: Vits
  }
  interface Vits {
    say(prompt:string): Promise<string | h>
  }

}
class Vits extends Service {
  temp_msg: string
  constructor(ctx:Context,private config:Vits.Config){
    super(ctx,'vits',true)
    ctx.i18n.define('zh', require('./locales/zh'));
    ctx.on('send', (session) => {
      this.temp_msg = session.messageId
    })
    ctx.command('say').action(async ({session},prompt)=>{
      await session.send(config.waiting_text)
      if(config.recall){
        this.recall(session,this.temp_msg)
      }
      return await this.say(prompt)
    })
  }
  async recall(session: Session, messageId: string) {
    new Promise(resolve => setTimeout(() => {
      session.bot.deleteMessage(session.channelId, messageId)
    }
      ,this.config.recall_time ));
  }
  async say(prompt:string): Promise<string | h>{
    if(prompt.length>this.config.max_length){
      return '文字过长'
    }
    const response:Buffer = await this.ctx.http.get(this.config.endpoint+prompt+'&format=ogg&id=3', { responseType: 'arraybuffer' });
    return h.audio(response, 'audio/mpeg')
  };
}
namespace Vits{
  export const usage = `
## 注意事项
>对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-open-vits 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
后端搭建教程<a style="color:blue" href="https://github.com/Artrajz/vits-simple-api">vits-simple-api</a>
## 使用方法
* say 要转化的文本

## 问题反馈群: 
39989991
`
  export interface Config {
    endpoint: string
    max_length: number
    waiting: boolean
    waiting_text: string
    recall: boolean
    recall_time: number
  }
  export const Config: Schema<Config> = Schema.object({
    endpoint: Schema.string().default('https://api.vits.t4wefan.pub/voice?text=').description('服务器地址'),
    max_length: Schema.number().default(256).description('最大长度'),
    waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
    waiting_text: Schema.string().default('思考中...').description('等待时发送的文本'),
    recall: Schema.boolean().default(true).description('会撤回思考中'),
    recall_time: Schema.number().default(5000).description('撤回的时间')
  })
}

export default Vits