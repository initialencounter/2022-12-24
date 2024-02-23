import { Bot, Context, Fragment, Logger, Schema } from 'koishi'
import WechatyAdapter from './adapter'
import { WechatyBuilder } from 'wechaty'
import { WechatyInterface } from 'wechaty/impls'
import { WechatyMessenger } from './message'
import { adaptContact, adaptMessage, adaptRoom, getCurrentFunctionName } from './utils'
import { Channel, List, Message } from '@satorijs/protocol'
import { resolve } from 'path'
import { } from '@koishijs/plugin-console'
import { copyFileSync, existsSync, readFileSync } from 'fs'

declare module '@koishijs/plugin-console' {
    interface Events {
        'wechat4u/qrcode'(): WechatyBot.Data
    }
}

class WechatyBot<C extends Context = Context, T extends WechatyBot.Config = WechatyBot.Config> extends Bot<C, T> {
    static inject = {
        required: ["console"]
    }
    static MessageEncoder = WechatyMessenger
    internal: WechatyInterface
    qrcodeLink: string
    declare logger: Logger
    constructor(ctx: C, config: T) {
        super(ctx, config, 'wechaty')
        this.platform = 'wechaty'
        this.selfId = config.selfId
        this.logger = new Logger("wechat4u")
        this.logger.level = config.logLevel
        const fileName = `${this.config.selfId}.memory-card.json`
        const filePath = resolve(ctx.baseDir, "data/wechat4u", fileName)
        if (existsSync(filePath)) {
            copyFileSync(filePath, resolve(ctx.baseDir, fileName))
        }
        this.internal = WechatyBuilder.build({ name: this.selfId, puppet: "wechaty-puppet-wechat4u" })
        ctx.plugin(WechatyAdapter, this)
        ctx.inject(['console'], (ctx) => {
            ctx.console.addEntry({
                dev: resolve(__dirname, '../client/index.ts'),
                prod: resolve(__dirname, '../dist'),
            })
        })
        ctx.console.addListener('wechat4u/qrcode', () => {
            return this.getData()
        })
    }
    getData() {
        let msg: string
        switch (this._status) {
            case 1:
                msg = 'success'
                this.qrcodeLink = "error"
                break
            case 3:
                msg = 'error'
                break
            default:
                msg = this.qrcodeLink

        }
        return { selfId: this.config.selfId, url: msg }
    }
    async deleteMessage(channelId: string, messageId: string) {
        this.logger.info('Unimplemented API: ' + getCurrentFunctionName())
    }
    async editMessage(channelId: string, messageId: string, content: Fragment): Promise<void> {
        this.logger.info('Unimplemented API: ' + getCurrentFunctionName())
    }
    async kickGuildMember(guildId: string, userId: string, permanent?: boolean) { }

    async getMessageList(channelId: string, next?: string): Promise<List<Message>> {
        const messages = await this.internal.Message.findAll({
            roomId: !channelId.startsWith('private:') ? channelId : undefined,
            fromId: channelId.startsWith('private:') ? channelId.slice(8) : undefined,
        })
        const adaptedMessages = await Promise.all(messages.map(async (m) => await adaptMessage(this, m as any)))
        return { data: adaptedMessages }
    }
    async getGuildList() {
        const rooms = await this.internal.Room.findAll()
        const channelList = await Promise.all(rooms.map(adaptRoom))
        return { data: channelList }

    }
    async getGuildMemberList(guildId: string) {
        const room = await this.internal.Room.find({ id: guildId })
        if (!room) return
        const members = await room.memberAll()
        const membersList = await Promise.all(members.map(adaptContact))
        return { data: membersList }
    }
    // Forked from https://code.mycard.moe/3rdeye/koishi-plugin-adapter-wechaty
    // AGPL-3.0 license
    async getMessage(channelId: string, messageId: string): Promise<Message> {
        const message = await this.internal.Message.find({ id: messageId })
        if (!message) return
        return adaptMessage(this, message as any)
    }
    async getGuild(guildId: string) {
        const room = await this.internal.Room.find({ id: guildId })
        return adaptRoom(room)
    }
    async getChannel(channelId: string, guildId?: string): Promise<Channel> {
        return await this.getChannel(channelId, guildId)
    }
    async getChannelList(guildId: string, next?: string): Promise<List<Channel>> {
        return await this.getGuildList()
    }
    async muteChannel(channelId: string, guildId?: string, enable?: boolean) {
        this.logger.info('Unimplemented API: ' + getCurrentFunctionName())
    }
    async muteGuildMember(
        guildId: string,
        userId: string,
        duration: number,
        reason?: string,
    ) { this.logger.info('Unimplemented API: ' + getCurrentFunctionName()) }

    // request
    async handleFriendRequest(
        messageId: string,
        approve: boolean,
        comment?: string,
    ) {
        if (!approve) return
        return this.internal.Friendship.load(messageId).accept()
    }
    async handleGuildRequest(
        messageId: string,
        approve: boolean,
        comment?: string,
    ) {
        if (!approve) return
        return this.internal.RoomInvitation.load(messageId).accept()
    }
    async handleGuildMemberRequest(
        messageId: string,
        approve: boolean,
        comment?: string,
    ) {
        this.logger.info('Unimplemented API: ' + getCurrentFunctionName())
    }

    async getSelf() {
        const self = this.internal.currentUser
        return adaptContact(self)
    }
    async getUser(userId: string) {
        const contact = await this.internal.Contact.find({ id: userId })
        return adaptContact(contact)
    }

}
namespace WechatyBot {
    export interface Data { selfId: string, url: string }
    export const usage = `${(readFileSync(resolve(__dirname, '../readme.md')).toString("utf-8").split("## 注意事项")[1]).split("# 更新日志")[0]}`
    export interface Config {
        selfId?: string
        blockUser: string[]
        logLevel: number
    }

    export const Config: Schema<Config> = Schema.object({
        selfId: Schema.string().description(`
### 机器人的id
- 随便填
- 如果有多个 wechaty 适配器
- 请确保 selfId 是唯一的
- 登录信息将会以该内容命名, 并保存在 Koishi 实例的 \`data/wechat4u\` 目录
`).required(),
        blockUser: Schema.array(String).default(["中国银行微银行", "微信团队"]).description("要屏蔽的关键词"),
        logLevel: Schema.number().description('输出日志等级。').default(2),
    })
}

export default WechatyBot