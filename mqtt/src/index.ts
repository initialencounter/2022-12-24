import { Context, Schema, Session, Logger,Service } from 'koishi'
import { Client, connect, QoS } from 'mqtt';
export const name = 'mqtt'
export const logger = new Logger(name)

declare module 'koishi' {
  interface Context {
    mqtt: Mqtt
  }
}

class Mqtt extends Service{
  msgs: string[]
  status: boolean
  topic: string
  client: Client
  constructor(ctx: Context, private config: Mqtt.Config) {
    super(ctx,'mqtt',true)
    this.msgs = []
    this.status = false
    this.topic = config.topic
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

    // create a client
    this.client = connect(config.mqtt_hostname, {
      clientId,
      clean: true,
      connectTimeout: config.connectTimeout,
      username: config.username,
      password: config.password,
      reconnectPeriod: config.reconnectPeriod,
    })

    // 建立连接
    this.client.on('connect', () => {
      logger.info('Connected')
      this.client.subscribe([this.topic], () => {
        logger.info(`Subscribe to topic '${this.topic}'`)
      })
    })
    this.client.on('message', (topic, payload) => {
      this.status = true
      let mark_topic:string = ''
      if(config.mark_topic){
        mark_topic+= `${topic}: `
      }
      const msg:string = `${mark_topic}${String(payload)}`
      this.msgs.push(msg)
      logger.info(msg)
    })

    ctx.i18n.define('zh', require('./locales/zh'));
    // 推送
    ctx.on('ready', async () => {
      ctx.setInterval(async () => {
        if (this.status) {
          await this.send(this.msgs)
          this.msgs = []
          this.status = false
        }
      }, config.interval)
    })
    // 指令触发
    ctx.command('mqtt <prompt:text>', 'publish msg for mqtt')
      .alias('mq')
      .option('topic', '-t <topic:string>', { fallback: config.publish_topic })
      .action(({ session, options }, prompt) => {
        return this.publish(prompt, options)
      })

    // 引用触发
    ctx.middleware(async (session, next) =>{
      if (session.parsed.appel) {
        const msg1:string = String(session.content)
        const msg:string = msg1.replace(`<at id="${session.bot.selfId}"/> `,'')
        return this.publish(msg, {topic:config.publish_topic})
      }
      return next()
    })
  }

  /**
   * publish msg form platform
   * @param prompt msg
   * @param options {topic: 'aim topic'}
   * @returns status_string
   */

  async publish(prompt: string | Buffer, options: Mqtt.Options): Promise<string> {
    this.client.publish(options.topic, prompt, {
      qos: this.config.qos,
      retain: this.config.retain
    }, (e) => {
      logger.error(String(e))
      return `发送错误:${String(e)}！`
    })
    return `发送成功！`
  }

  /**
   * send msg to platform
   * @param msgs msg array
   * @returns void
   */
  async send(msgs:string[]) {
    for (var msg of msgs) {
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
  export const usage = `
## 注意事项

>本插件只用于体现 Koishi 部署者意志。
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-mqtt 概不负责。

## 使用方法

### 在规则里添加平台名称和频道才能推送消息

- topic 是接受推送的订阅，相当于频道
- publish_topic 是发布消息的频道
- 发布at机器人或引用机器人消息即可发布到publish_topic

# 问题反馈

QQ群: 399899914

`
  export interface Options {
    topic?: string
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
    mqtt_hostname: string
    rules: Rule[]
    interval: number
    connectTimeout: number
    username: string
    password: string
    reconnectPeriod: number
    topic: string
    publish_topic: string
    qos: QoS
    retain: boolean
    mark_topic: boolean
  }
  export const Config: Schema = Schema.intersect([
    Schema.object({
      mqtt_hostname: Schema.string().description('mqtt服务器地址').default('mqtt://116.205.167.54:1883'),
      username: Schema.string().description('用户名').default('123456'),
      password: Schema.string().description('密码').default('123456'),
      topic: Schema.string().description('订阅的topic，相当于频道').default('koishi/mqtt/s'),
      publish_topic: Schema.string().description('发布的topic').default('koishi/mqtt/p'),
      rules: Schema.array(Rule).description('推送规则。'),
    }).description('基础设置'),
    Schema.object({
      mark_topic: Schema.boolean().default(false).description('推送消息时会标注topic'),
      connectTimeout: Schema.number().default(4000).description('连接超时 (毫秒)。'),
      reconnectPeriod: Schema.number().default(1000).description('重连间隔 (毫秒)。'),
      interval: Schema.number().default(1000).description('轮询间隔 (毫秒)。'),
      qos: Schema.union([
        Schema.const(0).description('低级'),
        Schema.const(1).description('中级'),
        Schema.const(2).description('高级'),
      ]).default(0).description('服务质量，MQTT支持3个级别的QoS，分别为0、1、2。QoS用于确保消息的可靠传递，包括消息是否被传递成功以及传递的顺序是否正确等。QoS级别越高，消息的可靠性越高，但是网络传输的开销也越大。'),
      retain: Schema.boolean().default(false).description('当一个客户端发布一条保留消息到MQTT服务器后，服务器会保留这条消息，直到有其他客户端订阅了这个主题。'),
    }).description('进阶设置')
  ])
}


export default Mqtt


