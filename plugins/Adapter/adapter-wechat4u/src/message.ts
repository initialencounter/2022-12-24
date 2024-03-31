// Forked from https://code.mycard.moe/3rdeye/koishi-plugin-adapter-wechaty
// AGPL-3.0 license

import { Element, Messenger, segment } from 'koishi'
import { Contact, Sayable } from 'wechaty'
import { elementToFileBox } from './utils'
import { MessageInterface } from 'wechaty/impls'

export class WechatyMessenger extends Messenger {
    buffer = ''
    contactCache = new Map<string, Contact>()

    addResult(msg: MessageInterface) {
        if (!msg.id) return
        const session = this.bot.session()
        this.results.push({id:msg.id})
        session.messageId = msg.id
        session.app.emit(session, 'send', session)
    }

    private isGuild() {
        return !this.channelId.startsWith('private:')
    }

    async post(content: Sayable) {
        try {
            if (!this.isGuild()) {
                const contact: Contact = await this.bot.internal.Contact.find({
                    id: this.channelId.slice(8),
                })
                if (!contact) {
                    return
                }
                const message = await contact.say(content)
                if (!message) return
                this.addResult(message)
            } else {
                const room = await this.bot.internal.Room.find({ id: this.channelId })
                if (!room) {
                    return
                }
                const message = await room.say(content)
                if (!message) return
                this.addResult(message)
            }
        } catch (e) {
            this.errors.push(e)
        }
    }


    async flush() {
        if (!this.buffer) return
        await this.post(this.buffer)
        this.buffer = ''
    }

    async sendMedia(media: Element) {
        const fileBox = await elementToFileBox(media)
        if (!fileBox) return
        return this.post(fileBox)
    }

    private text(content: string) {
        this.buffer += content
    }

    private async getRelatedContact(id: string) {
        if (this.contactCache.has(id)) {
            return this.contactCache.get(id)
        }
        let member: Contact
        if (this.isGuild()) {
            const room = await this.bot.internal.Room.find({ id: this.channelId })
            if (!room) return
            const members = await room.memberAll()
            member = members.find((member) => member.id === id)
        } else {
            member = await this.bot.internal.Contact.find({ id })
        }
        if (!member) return
        this.contactCache.set(id, member)
        return member
    }

    async visit(element: segment) {
        const { type, attrs, children } = element
        switch (type) {
            case 'text':
                this.text(attrs.content)
                break
            case 'p':
                await this.render(children)
                this.text('\n')
                break
            case 'a':
                await this.render(children)
                if (attrs.href) this.text(` (${attrs.href}) `)
                break
            case 'at':
                if (attrs.id) {
                    const contact = await this.getRelatedContact(attrs.id)
                    if (contact) {
                        this.text(`@${contact.name()} `)
                    }
                } else if (attrs.type === 'all') {
                    this.text('@全体成员 ')
                } else if (attrs.type === 'here') {
                    this.text('@在线成员 ')
                } else if (attrs.role) {
                    this.text(`@${attrs.role}`)
                }
                break
            case 'img':
            case 'video':
            case 'audio':
            case 'file':
                await this.flush()
                await this.sendMedia(element)
                break
            case 'figure':
            case 'message':
                await this.flush()
                await this.render(children, true)
                await this.flush()
                break
            case 'wechaty:contact':
                const contact = await this.getRelatedContact(attrs.id)
                if (contact) {
                    await this.flush()
                    await this.post(contact)
                }
                break
            default:
                await this.render(children)
        }
    }
}
