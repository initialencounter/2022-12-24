import { Adapter, Context, Universal } from 'koishi'
import WechatyBot from './bot'
import { ScanStatus } from 'wechaty'
import { ContactSelfInterface, MessageInterface } from 'wechaty/impls'
import { adaptMessage, fileBoxToUrl } from './utils'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const yellow = "\x1b[33m";
const reset = "\x1b[0m";
const green = "\x1b[32m"

export default class WechatyAdapter<C extends Context = Context> extends Adapter<C, WechatyBot<C>> {
    bot: WechatyBot
    selfTmpId: string
    async connect(bot: WechatyBot) {
        this.bot = bot
        this.initialize()
    }
    async disconnect(bot: WechatyBot<C, WechatyBot.Config>): Promise<void> {
        await bot.internal.logout()
    }
    async stop(bot: WechatyBot) {
        bot.internal.stop()
    }
    async initialize() {
        this.bot.internal
            .on('scan', this.onScan.bind(this))
            .on('login', this.onlogin.bind(this))
            .on('message', this.handleMessages.bind(this))
            .on('logout', this.onLogout.bind(this))
            .on('ready', this.onReady.bind(this))
            .start()
    }

    handleMessages = async (msg: MessageInterface) => {
        if (!msg.text() || msg.payload.talkerId === this.bot.user.id) {
            return
        }
        let channelId = msg.payload?.roomId
        const session = this.bot.session()
        session.type = 'message'
        session.event.message = await adaptMessage(this.bot, msg)
        const name = session?.event?.message?.member?.name ?? ""
        this.bot.logger.info(`机器人:${yellow}${this.bot.config.selfId}${reset} 收到消息: 发送者: ${green}${name}${reset} 内容: ${msg?.payload?.text}`)
        
        for (var i of this.bot.config.blockUser) {
            if (name.includes(i)) {
                return
            }
        }
        if(!msg?.payload?.roomId){
            channelId = 'private:' + msg.payload.talkerId
            session.subtype = "private"
        }
        session.userId = msg.payload.talkerId
        session.channelId = channelId
        session.guildId = channelId
        session.content = msg.text()
        if (session?.event?.member) {
            session.event.member = session.event.message.member
        }
        session.event.timestamp = session.event.message.timestamp
        this.bot.dispatch(session)

    }
    onlogin = async (_user: ContactSelfInterface) => {
        const user: Universal.User = {
            id: _user.id,
            name: _user.name(),
            avatar: await fileBoxToUrl(await _user.avatar())
        }
        this.bot.user = user
        this.bot.online()
        const fileName = `${this.bot.config.selfId}.memory-card.json`
        const targetDirectory = resolve(this.bot.ctx.baseDir, "data/wechat4u")
        if (!existsSync(targetDirectory)) {
            mkdirSync(targetDirectory, { recursive: true })
        }
        copyFileSync(fileName, resolve(targetDirectory, fileName))
    }
    onScan(qrcode: string, status: ScanStatus) {
        if (status === 2) {
            this.bot.qrcodeLink = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`
        }
        this.bot.logger.info(`Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`)

    }
    async stopinternal() {
        this.bot.offline()
        await this.bot.internal.stop()
    }
    onLogout() {
        this.bot.qrcodeLink = "error"
        this.bot.offline()
    }
    onReady = async () => { }
}

