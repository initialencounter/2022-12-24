import { Context, Dict, interpolate, Logger, noop, Schema } from 'koishi'
import OneBotBot from 'koishi-plugin-adapter-onebot'
import { DataService } from '@koishijs/plugin-console'
import { } from '@koishijs/plugin-market'
import { ChildProcess } from 'child_process'
import { join, resolve } from 'path'
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises'
import { createReadStream, promises as fsp, Stats, readFileSync, existsSync } from 'fs'
import { gocq as gocqhttp, version_gocq_default } from 'koishi-plugin-qsign'
import strip from 'strip-ansi'
import { } from '@yunkuangao/koishi-plugin-qsign'
import axios from "axios"

const localUsage = readFileSync(resolve(__dirname, "../readme.md"))

export const cloudUsage = async () => {
  const { name } = require(resolve(__dirname, "../package.json"))
  try {
    const info = await axios.get(`https://www.npmmirror.com/api/info?pkgName=${name}`)
    const version = info.data.data["dist-tags"].latest
    const md = await axios.get(`https://registry.npmmirror.com/${name}/${version}/files/README.md`)
    return md.data
  } catch (e) {
    return localUsage
  }
}

declare module '@koishijs/plugin-console' {
  namespace Console {
    interface Services {
      gocqhttp: Launcher
    }
  }

  interface Events {
    'gocqhttp-dev/usage'(): Promise<string>
    'gocqhttp/device'(sid: string, device: string): void
    'gocqhttp/write'(sid: string, text: string): void
    'gocqhttp/start'(sid: string): void
    'gocqhttp/stop'(sid: string): void
    'gocqhttp/auto-or-manual'(getTicketManual: boolean): void
  }
}

declare module 'koishi-plugin-adapter-onebot/lib/bot' {
  interface OneBotBot <C extends Context, T extends OneBotBot.Config = OneBotBot.Config> {
    process: ChildProcess
    gocqhttp?: GoCqhttpConfig
  }

  namespace OneBotBot {
    interface BaseConfig {
      gocqhttp?: GoCqhttpConfig
    }
  }
}

interface Server {
  protocol: string
  disabled: boolean
  address: string
  middlewares: boolean
  postUrl?: string
  secret?: string
}

interface GoCqhttpConfig {
  enabled: boolean
  password?: string
  qsignInlay?: boolean
  heartBeatQsign: number
  extensions: Server[]
}

export const logger = new Logger('gocqhttp-dev')

const logLevelMap = {
  DEBUG: 'debug',
  INFO: 'debug',
  WARNING: 'warn',
  ERROR: 'error',
  FATAL: 'error',
}

namespace Data {
  export type Status =
    | 'error'
    | 'offline'
    | 'success'
    | 'continue'
    | 'init'
    | 'sms'
    | 'qrcode'
    | 'slider'
    | 'captcha'
    | 'sms-confirm'
    | 'sms-or-qrcode'
    | 'slider-or-qrcode'
    | 'ticket'
    | 'auto-or-manual'
    | 'info'
}

interface Data {
  status: Data.Status
  image?: string
  phone?: string
  link?: string
  message?: string
  device?: string
}

class Launcher extends DataService<Dict<Data>> {
  static using = ['router']
  payload: Dict<Data> = Object.create(null)
  templateTask: Promise<string>
  migrateTask: Promise<void>
  message: string
  getTicketManual: boolean
  signServers: Launcher.SignServer[]
  protocol: number
  androidVersion: string
  autoRegister: boolean
  heartBeatQsign: number
  constructor(ctx: Context, private config: Launcher.Config) {
    super(ctx, 'gocqhttp', { authority: 4 })
    ctx.on("ready", async () => {
      var usage = (await cloudUsage())?.toString() ?? ''
      usage = usage.split("## 更新日志")?.[0] ?? ''
      this.payload["usage"] = { status: "info", message: usage }
      this.refresh()
    })
    logger.level = config.logLevel
    ctx.on('bot-connect', async (bot: OneBotBot<Context>) => {
      if (!bot.config.gocqhttp?.enabled) return
      this.clientInfo(bot,"正在启动...")
      if (config?.signServers?.length < 1) {
        config.signServers = [{ address: "http://127.0.0.1:8080", key: "114514", authorization: "-" }]
      }
      this.signServers = config.signServers ?? [{ address: "http://127.0.0.1:8080", key: "114514", authorization: "-" }]
      this.heartBeatQsign = bot.config.gocqhttp.heartBeatQsign ?? 5000

      this.clientInfo(bot,"正在读取配置...")

      // 读取内置 qsign 的配置
      if (bot.config.gocqhttp.qsignInlay) {
        // 等待服务启动
        let count = 0
        let msg = "0% 正在等待依赖启动"
        while (!this.ctx["qsign"]) {
          if (count == 10) {
            logger.warn(msg)
            msg += ", 若未配置内置qsign, 请安装并启用 @yunkuangao/qsign 插件; 问题反馈: https://github.com/initialencounter/mykoishi/issues"
            this.setData(bot, {
              status: 'info',
              message: msg,
            })
          }
          if (count < 2) {
            this.setData(bot, {
              status: 'info',
              message: msg,
            })
          }
          await this.sleep(1000)
          count++
        }
        await this.getQsignConfig()
        let suspend = true
        count = 0
        while (suspend) {
          try {
            await this.ctx.http.get(this.signServers[0].address)
            suspend = false
          }
          catch (e) {
            suspend = true
            if (count < 2) {
              this.setData(bot, {
                status: 'info',
                message: "99% 正在等待内置 qsign 服务启动",
              })
            }
          }
          await this.sleep(500)
          count++
        }
      } else {
        this.autoRegister = config.autoRegister
        this.protocol = await this.getProtocol(bot)
        const tmp = []
        for (var i = 0; i < this.signServers.length; i++) {
          // qsgin 环境读取
          try {
            const qsign = await this.ctx.http.get(this.signServers[i].address)
            const { data: { protocol: { version } } } = qsign
            if (tmp.length == 0) {
              this.androidVersion = version
              logger.info(qsign)
            }
            if (version == this.androidVersion) {
              tmp.push(this.signServers[i])
            }
          }
          catch (e) {
            logger.error(e)
            this.setData(bot, {
              status: "error",
              message: `qsignServer ${i} 连接失败，请检查 qsignServer 是否启动`
            })
            logger.warn(`qsignServer ${i} 连接失败，请检查 qsignServer 是否启动`)
          }
        }
        this.signServers = tmp
        if (this.signServers.length === 0) {
          this.setData(bot, {
            status: "error",
            message: "无效的signServer"
          })
          logger.info("无效的signServer")
          return
        }
      }

      this.clientInfo(bot,"正在检查协议...")


      // 检查协议是否可用
      if (!((await readdir(resolve(__dirname, '../versions')))).includes(this.androidVersion)) {
        this.setData(bot, {
          status: "error",
          message: `当前协议版本: ${this.androidVersion} 不可用，请前往 qsign 更换协议版本`
        })
        logger.info(`当前协议版本: ${this.androidVersion} 不可用，请前往 qsign 更换协议版本`)
        return
      }

      this.clientInfo(bot,"正在替换协议...")


      // 替换协议
      await this.setProtocol(bot)

      this.clientInfo(bot,"正在设置心跳...")

      // 心跳模块
      const timer = setInterval(async () => {
        let alive = 0
        for (var server of this.signServers) {
          try {
            const qsign = await this.ctx.http.get(server.address)
            const { data: { protocol: { version } } } = qsign
            if (version !== this.androidVersion) {
              this.setData(bot, {
                status: "error",
                message: 'txlib 发生改变, 正在关闭 go-cqhttp 子进程'
              })
              logger.error("txlib 发生改变, 正在关闭 go-cqhttp 子进程, 请重启本插件, 将自动同步 txlib 配置")
              this.disconnect(bot)
              this.setData(bot, { status: 'offline' })
              clearInterval(timer)
            }
            alive++
          }
          catch (e) {
            logger.warn(`qsignServer ${server.address} 挂了`)
          }
        }
        if (alive === 0) {
          this.setData(bot, {
            status: "error",
            message: '所有signServer都已失效,正在退出 go-cqhttp 子进程'
          })
          logger.error("所有signServer都已失效,正在退出 go-cqhttp 子进程")
          this.disconnect(bot)
          this.setData(bot, { status: 'offline' })
          clearInterval(timer)
        }
      }, this.heartBeatQsign)

      this.clientInfo(bot,"正在迁移配置...")


      // 启动
      await this.start()
      return this.connect(bot)
    })

    ctx.on('bot-disconnect', async (bot: OneBotBot<Context>) => {
      return this.disconnect(bot, true)
    })

    ctx.using(['console'], (ctx) => {
      ctx.console.addEntry({
        dev: resolve(__dirname, '../client/index.ts'),
        prod: resolve(__dirname, '../dist'),
      })
      ctx.console.addListener('gocqhttp-dev/usage', async () => {
        return (await cloudUsage()).split("## 更新日志")[0]
      }, { authority: 4 })
      ctx.console.addListener('gocqhttp/device', (sid, device) => {
        const bot = this.ctx.bots[sid] as OneBotBot<Context>
        const cwd = resolve(bot.ctx.baseDir, this.config.root, bot.selfId??bot.config.selfId)
        return this.writeDevice(cwd, device)
      }, { authority: 4 })

      ctx.console.addListener('gocqhttp/write', (sid, text) => {
        return this.write(sid, text)
      }, { authority: 4 })

      ctx.console.addListener('gocqhttp/start', (sid) => {
        const bot = this.ctx.bots[sid] as OneBotBot<Context>
        if (!bot) return
        return this.connect(bot)
      }, { authority: 4 })

      ctx.console.addListener('gocqhttp/stop', (sid) => {
        const bot = this.ctx.bots[sid] as OneBotBot<Context>
        if (!bot) return
        return this.disconnect(bot)
      }, { authority: 4 })
      ctx.console.addListener('gocqhttp/auto-or-manual', (bol) => {
        this.getTicketManual = bol
      }, { authority: 4 })
    })

    ctx.router.get('/gocqhttp/captcha', (ctx, next) => {
      ctx.type = '.html'
      ctx.body = createReadStream(resolve(__dirname, '../captcha.html'))
    })

    ctx.router.post('/gocqhttp/ticket', (ctx, next) => {
      if (!ctx.query.id || !ctx.query.ticket) return ctx.status = 400
      const sid = ctx.query.id.toString()
      const ticket = ctx.query.ticket.toString()
      const bot = this.ctx.bots[sid] as OneBotBot<Context>
      if (!bot) return ctx.status = 404
      ctx.status = 200
      this.setData(bot, { status: 'continue' })
      return this.write(sid, ticket)
    })
  }

  // cp() can only be used since node 16
  private async cp(src: string, dest: string) {
    const dirents = await readdir(src, { withFileTypes: true })
    for (const dirent of dirents) {
      const srcFile = join(src, dirent.name)
      const destFile = join(dest, dirent.name)
      if (dirent.isFile()) {
        await copyFile(srcFile, destFile)
      } else if (dirent.isDirectory()) {
        await mkdir(destFile)
        await this.cp(srcFile, destFile)
      }
    }
  }

  private async migrate() {
    const legacy = resolve(this.ctx.baseDir, 'accounts')
    const folder = resolve(this.ctx.baseDir, this.config.root)
    await mkdir(folder, { recursive: true })
    const stats: Stats = await stat(legacy).catch(() => null)
    if (stats?.isDirectory()) {
      logger.info('migrating to data directory')
      await this.cp(legacy, folder)
      await rm(legacy, { recursive: true, force: true })
    }
  }

  async start() {
    return this.migrateTask = this.migrate()
  }

  async stop() {
    for (const bot of this.ctx.bots) {
      this.disconnect(bot as OneBotBot<Context>, true)
    }
  }

  private async write(sid: string, text: string) {
    const bot = this.ctx.bots[sid] as OneBotBot<Context>
    return new Promise<void>((resolve, reject) => {
      bot.process.stdin.write(text + '\n', (error) => {
        error ? reject(error) : resolve()
      })
    })
  }

  private async getTemplate() {
    const filename = this.config.template
      ? resolve(this.ctx.baseDir, this.config.template)
      : resolve(__dirname, '../template.yml')
    return readFile(filename, 'utf8')
  }

  private async getConfig(bot: OneBotBot<Context>) {
    this.clientInfo(bot,"正在设置额外的监听地址...")
    const template = await (this.templateTask ||= this.getTemplate())
    let insertContent = ``
    let cleanExtensions: Server[] = []
    for (var i of bot?.config?.gocqhttp?.extensions ?? []) {
      if (i) {
        cleanExtensions.push(i)
      }
    }
    for (var i of cleanExtensions) {
      if (i.protocol == "ws") {
        insertContent += `
  - ws:
      disabled: ${i.disabled ? true : false}
      address: ${i.address}
      middlewares:
        ${i.middlewares ? '<<: *default' : ''}
`
      } else if (i.protocol === "ws-reverse") {
        insertContent += `
  - ws-reverse:
      disabled: ${i.disabled ? true : false}
      universal: ${i.address}
      middlewares:
        ${i.middlewares ? '<<: *default' : ''}
`
      } else if (i.protocol == "http") {
        insertContent += `
  - http:
      disabled: ${i.disabled ? true : false}
      address: ${i.address}
      middlewares:
        ${i.middlewares ? '<<: *default' : ''}
      post:
        - url: ${i.postUrl ? i.postUrl : "http://127.0.0.1:5140/onebot"}
          secret: ${i.secret ? i.secret : "->"}
            
`
      }
    }

    logger.info("额外的服务：（可在配置项中添加）")
    logger.info(insertContent)

    let signServers = ``
    for (var server of this.signServers) {
      signServers += `
    - url: '${server.address}'
      key: '${server.key}'
      authorization: '${server.authorization}'
`
    }
    const config = {
      message: JSON.stringify(this.config.message),
      autoRegister: this.autoRegister,
      signServers: signServers,
      extensions: insertContent,
      ...bot.config,
      password: bot.config.gocqhttp.password,
    }
    if ('endpoint' in config) {
      try {
        config.endpoint = `${this.config.host}:${new URL(config.endpoint).port}`
      } catch (e) {
        this.setData(bot, {
          status: "error",
          message: 'invalid endpoint:' + config.endpoint
        })
        logger.error('invalid endpoint:', config.endpoint)
      }
    }
    if ('path' in config) {
      config['selfUrl'] = `127.0.0.1:${this.ctx.router.port}${config.path}`
    }
    return interpolate(template, config, /\$\{\{(.+?)\}\}/g)
  }

  async get() {
    return this.payload
  }

  private async setData(bot: OneBotBot<Context>, data: Data) {
    this.payload[bot.sid] = data
    if (['error', 'success', 'offline'].includes(data.status)) {
      const cwd = resolve(bot.ctx.baseDir, this.config.root, bot.selfId??bot.config.selfId)
      data.device = await this.readDevice(cwd).catch(noop)
    }
    this.refresh()
  }

  async readDevice(cwd: string) {
    const [json, buffer] = await Promise.all([
      fsp.readFile(cwd + '/device.json', 'utf8').catch(noop),
      fsp.readFile(cwd + '/session.token').catch(noop),
    ])
    if (!json) return 'qdvc:'
    const prefix = 'qdvc:' + Buffer.from(json).toString('base64')
    if (!buffer) return prefix
    return `${prefix},${Buffer.from(buffer).toString('base64')}`
  }

  async writeDevice(cwd: string, data: string) {
    if (!data.startsWith('qdvc:')) throw new Error('invalid qdvc string')
    const tasks: Promise<void>[] = []
    const [device, session] = data.slice(5).split(',')
    tasks.push(device
      ? fsp.writeFile(cwd + '/device.json', Buffer.from(device, 'base64').toString())
      : fsp.rm(cwd + '/device.json').catch(noop))
    tasks.push(session
      ? fsp.writeFile(cwd + '/session.token', Buffer.from(session, 'base64'))
      : fsp.rm(cwd + '/session.token').catch(noop))
    await Promise.all(tasks)
  }

  async connect(bot: OneBotBot<Context>) {
    // create working folder
    const { root } = this.config
    const cwd = resolve(bot.ctx.baseDir, root, bot.selfId??bot.config.selfId)
    await mkdir(cwd, { recursive: true })

    // create config.yml
    await writeFile(cwd + '/config.yml', await this.getConfig(bot))

    return new Promise<void>((resolve, reject) => {
      this.setData(bot, { status: 'init' })

      // spawn go-cqhttp process
      bot.process = gocqhttp({ cwd, faststart: true }, this.config.version_gocq)
      const handleData = async (data: any) => {
        data = strip(data.toString()).trim()
        if (!data) return
        for (const line of data.trim().split('\n')) {
          let text: string = line.slice(23)
          if (text.includes("Protocol -> parse incoming packet error: return code unsuccessful:") ||
            text.includes("callback error: Packet timed out") ||
            text.includes("总丢失 token 次数为")) {
            return
          }
          const [type] = text.split(']: ', 1)
          if (type in logLevelMap) {
            text = text.slice(type.length + 3)
            logger[logLevelMap[type]](text)
          } else {
            logger.info(line.trim())
          }

          let cap: RegExpMatchArray
          if (text.includes('アトリは、高性能ですから')) {
            resolve()
            this.setData(bot, { status: 'success' })
          } else if (text.includes('请输入(1 - 2)')) {
            this.refresh()
          } else if (text.includes('账号已开启设备锁') && text.includes('请选择验证方式')) {
            this.payload[bot.sid] = { status: 'sms-or-qrcode' }
          } else if (text.includes('登录需要滑条验证码') && text.includes('请选择验证方式')) {
            this.payload[bot.sid] = { status: 'slider-or-qrcode' }
            this.refresh()
          } else if (text.includes('请选择提交滑块ticket方式')) {
            this.payload[bot.sid] = { status: 'auto-or-manual' }
          } else if ((cap = text.match(/向手机 (.+?) 发送短信验证码/))) {
            const phone = cap[1].trim()
            if (text.includes('账号已开启设备锁')) {
              this.setData(bot, { status: 'sms-confirm', phone })
            } else {
              this.payload[bot.sid].phone = phone
            }
          } else if (text.includes('captcha.jpg')) {
            const buffer = await readFile(cwd + '/captcha.png')
            this.setData(bot, {
              status: 'captcha',
              image: 'data:image/png;base64,' + buffer.toString('base64'),
            })
          } else if (text.includes('qrcode.png')) {
            const buffer = await readFile(cwd + '/qrcode.png')
            this.setData(bot, {
              status: 'qrcode',
              image: 'data:image/png;base64,' + buffer.toString('base64'),
            })
          } else if (text.includes('请输入短信验证码')) {
            this.payload[bot.sid].status = 'sms'
            this.refresh()
          } else if (text.includes('请输入ticket')) {
            this.setData(bot, {
              status: 'ticket',
              link: this.message
            })
            this.refresh()
          } else if (text.includes('请前往该地址验证')) {
            this.message = text
            if (this.getTicketManual) {
              logger.info("请手动获取ticket, 教程 https://www.bilibili.com/video/BV1E94y1z7AK")
            } else {
              this.setData(bot, {
                status: 'slider',
                link: text
                  .match(/https:\S+/)[0]
                  .replace(/^https:\/\/ssl\.captcha\.qq\.com\/template\/wireless_mqq_captcha\.html\?/, `/gocqhttp/captcha?id=${bot.sid}&`),
              })
            }
          } else if (text.includes('扫码被用户取消')) {
            this.payload[bot.sid].message = '扫码被用户取消。'
            this.refresh()
          } else if (text.includes('二维码过期')) {
            this.payload[bot.sid].message = '二维码已过期。'
            this.refresh()
          } else if (text.includes('扫码成功')) {
            this.payload[bot.sid].message = '扫码成功，请在手机端确认登录。'
            this.refresh()
          } else if (text.includes('删除 device.json')) {
            // TODO
          } else if (text.includes('Enter 继续')) {
            this.write(bot.sid, '')
          } else if (text.includes('发送验证码失败')) {
            this.setData(bot, {
              status: 'error',
              message: '发送验证码失败，可能是请求过于频繁。',
            })
          } else if (text.includes('验证超时')) {
            this.setData(bot, {
              status: 'error',
              message: '登录失败：验证超时。',
            })
          } else if (text.includes('登录失败')) {
            this.setData(bot, {
              status: 'error',
              message: text,
            })
          } else if (text.includes('账号已开启设备锁') && (cap = text.match(/-> (.+?) <-/))) {
            this.setData(bot, {
              status: 'error',
              message: '账号已开启设备锁，请前往验证后点击重启。',
              link: cap[1],
            })
            this.write(bot.sid, '')
          } else if (text.includes('当前协议不支持二维码登录')) {
            this.setData(bot, {
              status: 'error',
              message: '当前协议不支持二维码登录，请配置账号密码或更换协议。',
            })
          } else if (text.includes("当前版本") ||
            text.includes('连接至签名服务器') ||
            text.includes("使用服务器") ||
            text.includes("开始尝试登录并同步消息") ||
            text.includes("使用协议") ||
            text.includes("从文件 data/versions")) {
            logger.info(text)
            this.setData(bot, {
              status: 'info',
              message: text,
            })
          } else if (text.includes('注册QQ实例') && text.includes("成功")) {
            this.setData(bot, {
              status: 'info',
              message: '轻舟已过万重山！',
            })
          } else if (text.includes("Protocol -> device lock is disable. http api may fail.")) {
            return
          } else if (text.includes("检查更新失败！")) {
            return
          }
        }
      }

      bot.process.stdout.on('data', handleData)
      bot.process.stderr.on('data', handleData)

      bot.process.on('error', (error) => {
        logger.warn(error)
      })

      bot.process.on('exit', () => {
        const data = this.payload[bot.sid]
        if (data && !['offline', 'error'].includes(data.status)) {
          this.setData(bot, { status: 'offline', message: '遇到未知错误，请查看日志。' })
        }
        reject(new Error())
      })

      if (bot.config.protocol === 'ws-reverse') {
        resolve()
      }
    })
  }
  async disconnect(bot: OneBotBot<Context>, hard?: boolean) {
    bot.process?.kill()
    bot.process = null
    if (!this.payload[bot.sid]) return
    if (hard) {
      delete this.payload[bot.sid]
      this.refresh()
    } else if (this.payload[bot.sid]?.status !== 'error') {
      this.setData(bot, { status: 'offline' })
    }
  }

  async getQsignConfig() {
    const { server: { host, port }, key, auto_register, protocol: { version } } = JSON.parse(this.ctx["qsign"].getConfig())
    this.signServers = [{ address: `http://${host}:${port}`, key: key, authorization: "-" }]
    this.autoRegister = auto_register ? false : true
    this.androidVersion = version
  }

  /**
   * 同步 qsign 的txlib
   * @param bot 
   */
  private async setProtocol(bot: OneBotBot<Context>) {
    const cwd = resolve(bot.ctx.baseDir, this.config.root, bot.selfId??bot.config.selfId)
    let versionSubName = 'android_pad.json'
    if (this.protocol === 1) {
      versionSubName = 'android_phone.json'
    }
    const selfVersionPath = resolve(__dirname, '../versions', this.androidVersion, versionSubName)
    const targetDir = resolve(cwd, `data/versions`)
    const targetPath = resolve(targetDir, `${this.protocol}.json`)
    if (!existsSync(targetPath)) {
      await mkdir(targetDir, { recursive: true })
    }
    await fsp.copyFile(selfVersionPath, resolve(targetDir, targetPath))
  }

  /**
   * 从 accounts 目录读取 登录协议，若首次登录则返回 6
   * @param bot 
   * @returns 
   */
  private async getProtocol(bot: OneBotBot<Context>): Promise<number> {
    const cwd = resolve(bot.ctx.baseDir, this.config.root, bot.selfId??bot.config.selfId)
    const devicejsonPath = resolve(cwd, 'device.json')
    if (existsSync(devicejsonPath)) {
      const deviceData = require(devicejsonPath)
      if (deviceData) {
        return deviceData["protocol"]
      }
    }
    return 6
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  clientInfo(bot: OneBotBot<Context>, msg: string) {
    logger.info(msg)
    this.setData(bot, {
      status: 'info',
      message: msg
    })
  }
}

namespace Launcher {
  export const filter = false

  // export const usage = `${localUsage}`

  export interface SignServer {
    address: string
    key: string
    authorization: string
  }

  export const SignServer: Schema<SignServer> = Schema.object({
    address: Schema.string().description('签名服务器地址。').default("http://127.0.0.1:8080"),
    key: Schema.string().description('签名服务器的key').default('114514'),
    authorization: Schema.string().description('authorization 内容, 依服务端设置').default('-'),
  })
  export interface Config {
    host: string
    root?: string
    signServers: SignServer[]
    external: Dict
    version_gocq: string
    logLevel?: number
    autoRegister: boolean
    template?: string
    message?: Dict
  }

  export const Config: Schema = Schema.intersect([Schema.object({
    host: Schema.string().description('要监听的 IP 地址。如果将此设置为 0.0.0.0 将监听所有地址，包括局域网和公网地址。').default('127.0.0.1'),
    root: Schema.path({
      filters: ['directory'],
      allowCreate: true,
    }).description('存放账户文件的目录。').default('data/go-cqhttp/accounts'),
    signServers: Schema.array(SignServer).default([{ address: "http://127.0.0.1:8080", key: "114514", authorization: "-" }]),
    version_gocq: Schema.union([
      Schema.const('v1.1.1-dev-f16d72f' as string).description("v1.1.1-dev-f16d72f,发行日期2023-08-31"),
      Schema.const('v1.1.1-dev-6ac7a8f'as string).description("v1.1.1-dev-6ac7a8f,发行日期2023-10-09"),
    ]).default(version_gocq_default).description('版本选择'),
    logLevel: Schema.number().description('输出日志等级。').default(2),
    autoRegister: Schema.boolean().default(true).description("自动注册实例, 若 qsign 开启了自动注册实例, 建议关闭此项"),
    template: Schema.string().description('使用的配置文件模板。').hidden(),
    message: Schema.object({
      'ignore-invalid-cqcode': Schema.boolean().default(false).description('是否忽略无效的消息段 (默认情况下将原样发送)。'),
      'force-fragment': Schema.boolean().default(false).description('是否强制分片发送消息 (分片发送将会带来更快的速度，但是兼容性会有些问题)。'),
      'fix-url': Schema.boolean().default(false).description('是否将 URL 分片发送。'),
      'proxy-rewrite': Schema.string().default('').description('下载图片等资源时要请求的网络代理。'),
      'report-self-message': Schema.boolean().default(false).description('是否上报自身消息。'),
      'remove-reply-at': Schema.boolean().default(false).description('移除 reply 消息段附带的 at 消息段。'),
      'extra-reply-data': Schema.boolean().default(false).description('为 reply 消息段附加更多信息。'),
      'skip-mime-scan': Schema.boolean().default(false).description('跳过 mime 扫描，忽略错误数据。'),
    }).description('消息设置'),
  })
  ])
}

export default Launcher
