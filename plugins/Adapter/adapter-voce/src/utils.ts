import { Context, Universal, Element, h } from "koishi"
import VoceBot from "./bot"
import { Detail, WebHookResponse } from "./type"

const yellow = "\x1b[33m";
const reset = "\x1b[0m";
const green = "\x1b[32m"

export async function createSession(bot: VoceBot<Context>, body: WebHookResponse) {
    console.log('bofy', body)
    const session = bot.session()
    session.type = 'message'
    session.event.message = await adaptMessage(bot, body)
    session.elements = session.event?.message?.elements
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
    session.elements = await messageToElement(bot, body.detail)
    session.event.timestamp = session.event.message.timestamp
    return session
}

async function adaptMessage(bot: VoceBot<Context>, body: WebHookResponse): Promise<Universal.Message> {
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
        timestamp: body.created_at,
        createdAt: body.created_at,
    }
}
async function fileToElement(bot: VoceBot<Context>, mimeType: string, content: string): Promise<Element> {
    const resource = await bot.internal.getResource(content);
    const buffer = Buffer.from(resource);

    switch (mimeType) {
        case 'image/aces':
        case 'image/apng':
        case 'image/avif':
        case 'image/bmp':
        case 'image/cgm':
        case 'image/dicom-rle':
        case 'image/emf':
        case 'image/fits':
        case 'image/g3fax':
        case 'image/gif':
        case 'image/heic':
        case 'image/heic-sequence':
        case 'image/heif':
        case 'image/heif-sequence':
        case 'image/hej2k':
        case 'image/hsj2':
        case 'image/ief':
        case 'image/jls':
        case 'image/jp2':
        case 'image/jpeg':
        case 'image/jph':
        case 'image/jphc':
        case 'image/jpm':
        case 'image/jpx':
        case 'image/jxr':
        case 'image/jxra':
        case 'image/jxrs':
        case 'image/jxs':
        case 'image/jxsc':
        case 'image/jxsi':
        case 'image/jxss':
        case 'image/ktx':
        case 'image/ktx2':
        case 'image/png':
        case 'image/sgi':
        case 'image/svg+xml':
        case 'image/t38':
        case 'image/tiff':
        case 'image/tiff-fx':
        case 'image/webp':
        case 'image/wmf':
            return h.image(buffer, mimeType);
        case 'audio/3gpp':
        case 'audio/adpcm':
        case 'audio/amr':
        case 'audio/basic':
        case 'audio/midi':
        case 'audio/mobile-xmf':
        case 'audio/mp3':
        case 'audio/mp4':
        case 'audio/mpeg':
        case 'audio/ogg':
        case 'audio/s3m':
        case 'audio/silk':
        case 'audio/wav':
        case 'audio/wave':
        case 'audio/webm':
        case 'audio/xm':
            return h.audio(buffer, mimeType);
        case 'video/mp4':
        case 'video/3gpp':
        case 'video/3gpp2':
        case 'video/h261':
        case 'video/h263':
        case 'video/h264':
        case 'video/iso.segment':
        case 'video/jpeg':
        case 'video/jpm':
        case 'video/mj2':
        case 'video/mp2t':
        case 'video/mpeg':
        case 'video/ogg':
        case 'video/quicktime':
        case 'video/webm':
            return h.video(buffer, mimeType);
        default:
            throw new Error(`Unsupported mimeType: ${mimeType}`);
    }
}

async function messageToElement(bot: VoceBot<Context>, detail: Detail) {
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
        case 'vocechat/file':
            let elm = await fileToElement(bot, detail?.properties?.content_type, detail.content)
            elements.push(elm)
            break
        default:
            return
    }
    return elements
}