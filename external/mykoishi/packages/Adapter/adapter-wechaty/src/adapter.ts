/*
 * @Author: initialencounter
 * @Date: 2023-11-28 00:12:49
 * @FilePath: C:\Users\29115\dev\wechaty-satori-sdk\packages\adapter-wechaty\src\adapter.ts
 * @Description:
 *
 * Copyright (c) 2023 by initialencounter, All Rights Reserved.
 */


import { Adapter, Context, Dict, Logger, Universal } from 'koishi'
import WechatyBot from './bot'
import { ScanStatus } from 'wechaty'
import { ContactSelfInterface, MessageInterface } from 'wechaty/impls'
import { adaptMessage, fileBoxToUrl } from './utils'

const logger = new Logger('wechaty')

export default class WechatyAdapter<C extends Context = Context> extends Adapter<C, WechatyBot<C>> {
    bot: WechatyBot
    selfTmpId: string
    channelMap: Dict
    async connect(bot: WechatyBot) {
        // bot.online()
        this.bot = bot
        this.initialize()
        this.channelMap = {}
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
        // console.log(`Message: ${msg}`)
        logger.info('message: ' + msg)
        if (!msg.text() || msg.payload.talkerId === this.bot.user.id) {
            return
        }
        const channelId = msg.payload?.roomId ?? 'private:' + msg.payload.talkerId
        if (!this.channelMap[channelId]) {
            this.channelMap[channelId] = 1
            const session = this.bot.session()
            session.type = 'message'
            session.event.message = await adaptMessage(this.bot, msg)
            session.userId = msg.payload.talkerId
            session.channelId = channelId
            session.content = 'initial/wechaty' + channelId
            this.bot.dispatch(session)
        }
        const session = this.bot.session()
        session.type = 'message'
        session.event.message = await adaptMessage(this.bot, msg)
        session.userId = msg.payload.talkerId
        session.channelId = channelId
        session.content = msg.text()
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
        console.log(_user.id)
    }
    onScan(qrcode: string, status: ScanStatus) {
        logger.info(`Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`)

    }
    async stopinternal() {
        await this.bot.internal.stop()
    }
    onLogout() {

    }
    onReady = () => {

    }
}

