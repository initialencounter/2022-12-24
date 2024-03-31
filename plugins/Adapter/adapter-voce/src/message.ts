import { Context, Element, Messenger, base64ToArrayBuffer, segment } from 'koishi'
import VoceBot from './bot'
import { element2MediaBuffer } from './utils'
import { UploadResponse } from './type'

export class VoceMessenger<C extends Context = Context> extends Messenger<C, VoceBot<C>> {
    buffer: string = ''
    reply: string
    async sendReplyMessage(element: Element, messageId: string) {
        const res = await this.bot.internal.sendReplyMessage(messageId, this.buffer, 'text/plain')
        this.addResult(res[0])
    }
    async sendMedia(element: Element) {
        let media = await element2MediaBuffer(this.bot.http, element)
        let file_id = await this.bot.internal.filePrepare(media.type.fileName, media.type.mime)
        let uploadRes: UploadResponse = await this.bot.internal.fileUpload(file_id, media.data)
        const res = await this.bot.internal.sendMessage(this.channelId, { path: uploadRes.path }, 'vocechat/file')
        this.addResult(res[0])
    }

    addResult(msgId: string) {
        if (!msgId) return
        const session = this.bot.session()
        this.results.push({ id: msgId })
        session.messageId = msgId
        session.app.emit(session, 'send', session)
    }
    async flush(): Promise<void> {
        if (!this.buffer) return
        let res: string[]
        if (!this.reply) {
            res = await this.bot.internal.sendMessage(this.channelId, this.buffer, 'text/plain')
        } else {
            res = await this.bot.internal.sendReplyMessage(this.channelId, this.buffer, 'text/plain')
            this.reply = ''
        }
        this.addResult(res[0])
        this.buffer = ''
    }
    async visit(element: Element): Promise<void> {
        const { type, attrs, children } = element
        switch (type) {
            case 'quote':
                await this.flush()
                this.reply = attrs.id
                break
            case 'at':
                this.buffer = this.buffer + `@${attrs.id} `
                break
            case 'text':
                this.buffer = this.buffer + attrs.content
                break
            case 'img':
            case 'video':
            case 'audio':
            case 'file':
                await this.flush()
                await this.sendMedia(element)
                break
        }
    }
}