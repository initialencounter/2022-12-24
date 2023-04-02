import { Context, Schema, Time } from 'koishi'
export const name = 'hok-rank'
export const usage = `
## 注意事项
作者服务器经常掉线，支持<a href=https://github.com/initialencounter/mykoishi/hok-rank">自建服务器</a>
本插件只用于体现 Koishi 部署者意志”。
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-hok-rank 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`

export interface Rank {
  update_time: string
  rank_IOS: any
  rank_Android: any
}
export interface Rule {
  platform: string
  channelId: string
  selfId?: string
  guildId?: string
}

export const Rule: Schema<Rule> = Schema.object({
  platform: Schema.string().description('平台名称。').required(),
  channelId: Schema.string().description('频道 ID。').required(),
  guildId: Schema.string().description('群组 ID。'),
  selfId: Schema.string().description('机器人 ID。'),
})
export interface Config {
  api_hostname: string
  rules: Rule[]
  interval: number
  background_img: string
  border: string
}

export const Config: Schema<Config> = Schema.object({
  api_hostname:Schema.string().description('自建服务器地址').default('http://116.205.167.54:5140'),
  rules: Schema.array(Rule).description('推送规则。'),
  interval: Schema.number().default(Time.minute * 30).description('轮询间隔 (毫秒)。'),
  background_img: Schema.string().default('https://img0.baidu.com/it/u=2013803511,2814800709&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500').description('背景图片url,http开头:'),
  border: Schema.string().default('&').description('边界')
})
export function apply(ctx: Context, config: Config) {
  var bgd_img: string = config.background_img
  const v: RegExp = new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i');
  if (!v.test(config.background_img)) {
    bgd_img = 'https://img0.baidu.com/it/u=2013803511,2814800709&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500'
  }
  ctx.command('巅峰赛').alias('巅峰榜','hok-rank').action(async () => {
    const json_res: Rank = await ctx.http.get(`${config.api_hostname}/get-hok`)
    const rank_IOS = json_res.rank_IOS
    const rank_Android = json_res.rank_Android
    const item1: any[] = [<div>{json_res.update_time}</div>,<div>王者荣耀IOS-qq区巅峰榜</div>, <br></br>]
    console.log(rank_IOS)
    rank_IOS.forEach((i, id) => {
      item1.push(<div>{i[0]}. 【{i[3].split(' ')[0]}】^{i[3].split(' ')[1]} {i[2].split('|')[0]}</div>)
    })
    const item2: any[] = [<div>王者荣耀Android-qq区巅峰榜</div>, <br></br>]
    rank_Android.forEach((i, id) => {
      item2.push(<div>{i[0]}. 【{i[3].split(' ')[0]}】^{i[3].split(' ')[1]} {i[2].split('|')[0]}</div>)
    })
    return <html>
      <img src={bgd_img} style='width:600px;height:550px' />
      <div style='position: absolute;top:20px;left:20px;width:280px;'>{item1}</div>
      <div style='position: absolute;top:20px;left:300px;width:280px;'>{item2}</div>
    </html>
  })
  ctx.on('ready', async () => {
    ctx.setInterval(async () => {
      const json_res: Rank = await ctx.http.get(`${config.api_hostname}/get-hok`)
      const rank_IOS = json_res.rank_IOS
      const rank_Android = json_res.rank_Android
      const item1: any[] = [<div>{json_res.update_time}</div>,<div>王者荣耀IOS-qq区巅峰榜</div>, <br></br>]
      console.log(rank_IOS)
      rank_IOS.forEach((i, id) => {
        item1.push(<div>{i[0]}. 【{i[3].split(' ')[0]}】^{i[3].split(' ')[1]} {i[2].split('|')[0]}</div>)
      })
      const item2: any[] = [<div>王者荣耀Android-qq区巅峰榜</div>, <br></br>]
      rank_Android.forEach((i, id) => {
        item2.push(<div>{i[0]}. 【{i[3].split(' ')[0]}】^{i[3].split(' ')[1]} {i[2].split('|')[0]}</div>)
      })
      for (let { channelId, platform, selfId, guildId } of config.rules) {
        if (!selfId) {
          const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
          if (!channel || !channel.assignee) return
          selfId = channel.assignee
          guildId = channel.guildId
        }
        const bot = ctx.bots[`${platform}:${selfId}`]
        bot?.sendMessage(channelId, <html>
          <img src={bgd_img} style='width:600px;height:550px' />
          <div style='position: absolute;top:20px;left:20px;width:280px;'>{item1}</div>
          <div style='position: absolute;top:20px;left:300px;width:280px;'>{item2}</div>
        </html>, guildId)
      }
    }, config.interval)
  })
}