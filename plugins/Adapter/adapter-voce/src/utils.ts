import { Context, Universal,Element, h, Quester } from "koishi"
import VoceBot from "./bot"
import { Detail, WebHookResponse } from "./type"

const yellow = "\x1b[33m";
const reset = "\x1b[0m";
const green = "\x1b[32m"

export async function createSession(bot: VoceBot<Context>, body:WebHookResponse) {
    const session = bot.session()
    session.type = 'message'
    session.event.message = adaptMessage(bot,body)
    const name = session?.event?.message?.member?.name ?? body.from_uid
    bot.logger.info(`机器人:${yellow}${bot.config.selfId}${reset} 收到消息: 发送者: ${green}${name}${reset} 内容: ${body.detail.content}`)
    let channelId = String(body.target.gid)
    if (!body?.target?.gid) {
        channelId = 'private:' + body.from_uid
        session.subtype = "private"
    }
    session.userId = String(body.from_uid)
    session.channelId = channelId
    session.guildId = channelId
    session.content = body.detail.content
    if (session?.event?.member) {
        session.event.member = session.event.message.member
    }
    session.event.timestamp = session.event.message.timestamp
    return session
}

function adaptMessage(bot: VoceBot<Context>, body: WebHookResponse): Universal.Message {
    return {
        id: String(body.mid),
        content: body.detail.content,
        channel: {
            id: String(body.target.gid),
            type: 0
        },
        guild: {
            id: String(body.target.gid),
        },
        user: {
            id: String(body.from_uid),
        },
        elements: messageToElement(bot, body.detail),
        timestamp: body.created_at,
        createdAt: body.created_at,
    }
}


function messageToElement(bot: VoceBot<Context>, detail: Detail) {
    const messageType = detail.content_type
    const elements: Element[] = []
    switch (messageType) {
        case 'text/markdown':
            let md = detail.content
            elements.push(h.text(md))
            break
        case 'text/plain':
            let text = detail.content
            elements.push(h.text(text))
            break
    }
    return elements
}