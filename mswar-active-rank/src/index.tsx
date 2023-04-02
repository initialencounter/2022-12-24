import { Context, Schema, Time } from 'koishi'

export const name = 'mswar-active-rank'
export const usage = `
## 注意事项
> 建议使用前玩一局[扫雷联萌](http://tapsss.com)
作者服务器经常掉线，支持<a href=https://github.com/initialencounter/mykoishi/smear_rank">自建服务器</a>
本插件只用于体现 Koishi 部署者意志”。
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-mswar-active-rank 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`

export interface Rank {
  update_time: string
  mine_rank: any
  puzzle_rank: any
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
  const url:string = `${config.api_hostname}/get`
  var bgd_img:string = config.background_img
  const v:RegExp = new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i');
  if(!v.test(config.background_img)){
    bgd_img = 'https://img0.baidu.com/it/u=2013803511,2814800709&fm=253&fmt=auto&app=138&f=JPEG?w=889&h=500'
  }
  ctx.command('扫雷活跃榜').alias('ms-ac').action(async () => {
    const json_res: Rank = await ctx.http.get(url)
    const today_rank_ms = json_res.mine_rank['今日']['高级']
    const today_rank_pz = json_res.puzzle_rank['今日']['4x4']
    const item1: any[] = [<div>扫雷联萌tapsss.com</div>, <div>扫雷高级日榜</div>, <br></br>]
    today_rank_ms.forEach((i, id) => {
      item1.push(<div>{i[0]}. {i[1]} {i[3]}</div>)
    })
    const item2: any[] = [<div>{json_res.update_time}</div>, <div>15p日榜</div>, <br></br>]
    today_rank_pz.forEach((i, id) => {
      item2.push(<div>|{config.border}|{i[0]}. {i[1]} {i[3]}</div>)
    })
    return <html>
    <img src={bgd_img}style = 'width:400px;height:550px'/>
      <div style='position: absolute;top:20px;left:20px;width:200px;'>{item1}</div>
      <div style='position: absolute;top:20px;left:220px;width:200px;'>{item2}</div>

  </html>
  })
  ctx.on('ready', async () => {
    ctx.setInterval(async () => {
      const json_res: Rank = await ctx.http.get(url)
      const today_rank_ms = json_res.mine_rank['今日']['高级']
      const today_rank_pz = json_res.puzzle_rank['今日']['4x4']
      const item1: any[] = [<div>扫雷联萌tapsss.com</div>, <div>扫雷高级日榜</div>, <br></br>]
      today_rank_ms.forEach((i, id) => {
        item1.push(<div>{i[0]}. {i[1]} {i[3]}</div>)
      })
      const item2: any[] = [<div>|{config.border}|{json_res.update_time}</div>, <div>|{config.border}|15p日榜</div>, <br></br>]
      today_rank_pz.forEach((i, id) => {
        item2.push(<div>|{config.border}|{i[0]}. {i[1]} {i[3]}</div>)
      })
      for (let { channelId, platform, selfId, guildId } of config.rules) {
        if (!selfId) {
          const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
          if (!channel || !channel.assignee) return
          selfId = channel.assignee
          guildId = channel.guildId
        }
        const bot = ctx.bots[`${platform}:${selfId}`]
        bot?.sendMessage(channelId,<html>
          <img src={bgd_img} style = 'width:400px;height:550px'/>
            <div style='position: absolute;top:20px;left:20px;width:200px;'>{item1}</div>
            <div style='position: absolute;top:20px;left:220px;width:200px;'>{item2}</div>
    
        </html>, guildId)
      }
    }, config.interval)
  })
}