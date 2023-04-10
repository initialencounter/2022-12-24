import { Context, Schema, Time } from 'koishi'
import mqtt from 'mqtt';
export const name = 'mqtt'

export const usage = `
## 注意事项
本插件只用于体现 Koishi 部署者意志”。
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-mqtt 概不负责。
`


class Mqtt {
  msgs: string[]
  status: boolean
  constructor(private ctx: Context, private config: Mqtt.Config) {
    this.msgs = []
    this.status = false
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
    const client = mqtt.connect(config.mqtt_hostname, {
      clientId,
      clean: true,
      connectTimeout: config.connectTimeout,
      username: config.username,
      password: config.password,
      reconnectPeriod: config.reconnectPeriod,
    })
    const topic = config.topic
    client.on('connect', () => {
      console.log('Connected')
      client.subscribe([topic], () => {
        console.log(`Subscribe to topic '${topic}'`)
      })
    })
    client.on('message', (payload) => {
      this.status = true
      this.msgs.push(payload.toString())
    })
    ctx.on('ready', async () => {
      ctx.setInterval(async () => {
        if (this.status) {
          await this.send()
          this.status = false
        }
      }, config.interval)
    })
  }
  async send() {
    for (var msg of this.msgs) {
      for (let { channelId, platform, selfId, guildId } of this.config.rules) {
        if (!selfId) {
          const channel = await this.ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
          if (!channel || !channel.assignee) return
          selfId = channel.assignee
          guildId = channel.guildId
        }
        const bot = this.ctx.bots[`${platform}:${selfId}`]
        bot?.sendMessage(channelId, msg, guildId)
      }
    }
  }
}
namespace Mqtt {
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
    mqtt_hostname: string
    rules: Rule[]
    interval: number
    connectTimeout: number
    username: string
    password: string
    reconnectPeriod: number
    topic: string
  }
  export const Config: Schema<Config> = Schema.object({
    mqtt_hostname: Schema.string().description('mqtt服务器地址').default('mqtt://116.205.167.54:5140'),
    connectTimeout: Schema.number().default(4000).description('连接超时 (毫秒)。'),
    username: Schema.string().description('用户名').default('123456'),
    password: Schema.string().description('密码').default('123456'),
    reconnectPeriod: Schema.number().default(1000).description('重连间隔 (毫秒)。'),
    topic: Schema.string().description('订阅topic').default('koihsi/mqtt'),
    rules: Schema.array(Rule).description('推送规则。'),
    interval: Schema.number().default(1000).description('轮询间隔 (毫秒)。'),
  })
}


export default Mqtt