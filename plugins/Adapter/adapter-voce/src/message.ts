import { Context, Element, Messenger, segment } from 'koishi'
import VoceBot from './bot'

export class VoceMessenger<C extends Context = Context> extends Messenger<C, VoceBot<C>> {
    buffer: ''
    addResult(msgId: string) {
        if (!msgId) return
        const session = this.bot.session()
        this.results.push(session.event.message)
        session.messageId = msgId
        session.app.emit(session, 'send', session)
    }
    async flush(): Promise<void> {
        const res = await this.bot.internal.sendMessage(this.channelId, this.buffer)
        this.addResult(String(res))
        this.buffer = ''
    }
    async visit(element: Element): Promise<void> {
        const { type, attrs, children } = element
        switch (type) {
            case 'text':
                this.buffer = attrs.content
                break
        }
    }
}