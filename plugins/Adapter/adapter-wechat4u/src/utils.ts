// Forked from https://code.mycard.moe/3rdeye/koishi-plugin-adapter-wechaty
// AGPL-3.0 license

import { segment, Universal, Element, Awaitable, base64ToArrayBuffer } from 'koishi'
import type { ContactInterface } from 'wechaty/src/user-modules/contact'
import type { RoomInterface } from 'wechaty/src/user-modules/room'
import { MessageInterface } from 'wechaty/impls'
import WechatyBot from './index'
import FileType from 'file-type'
import db from './mine-standard';
import crypto from 'crypto'
import { encode, getDuration } from 'silk-wasm'

const mime2ext = (mime: string): string => {

  mime = mime.trim().toLowerCase()

  if (!db.hasOwnProperty(mime)) return ''

  return db[mime][0]

}

export type ContactLike = Pick<
  ContactInterface,
  'id' | 'name' | 'avatar' | 'self'
>
export type FileBoxLike = Awaited<ReturnType<ContactLike['avatar']>>
import { FileBox } from 'file-box'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
export type RoomLike = Pick<RoomInterface, 'id' | 'topic'>
export type MessageLike = MessageInterface

export const fileBoxToUrl = async (file: FileBoxLike): Promise<string> => {
  if (!file) {
    return undefined
  }
  if (file['remoteUrl']) {
    return file['remoteUrl']
  }
  let buf: Buffer
  try {
    buf = await file.toBuffer()
  } catch (e) {
    buf = file['stream']
  }
  const fileType = await FileType.fromBuffer(buf)
  const mime = fileType ? fileType.mime : 'application/octet-stream'
  return `data:${mime};base64,${buf.toString('base64')}`
}

export const adaptContact = async (
  contact: ContactLike,
): Promise<Universal.User> => {
  return {
    id: contact.id,
    name: contact.name(),
    username: contact.name(),
    nickname: contact.name(),
    avatar: await fileBoxToUrl(await contact.avatar()),
    isBot: contact.self(),
    nick: contact.name()
  }
}

export const adaptRoom = async (
  room: RoomLike,
): Promise<Universal.Channel & Universal.Guild> => {
  const name = await room.topic()
  return {
    id: room.id,
    name: name,
    type: 3,
  }
}

async function extractMessageURL(
  message: MessageLike,
  segmentFactory: (url: string, name: string) => Awaitable<Element>,
): Promise<Element> {
  const file = await message.toFileBox()
  if (!file) {
    return
  }
  return segmentFactory(await fileBoxToUrl(file), file.name)
}

export async function messageToElement(
  bot: WechatyBot,
  message: MessageLike,
): Promise<Element[]> {
  try {
    const MessageType = bot.internal.Message.Type
    const elements: Element[] = []
    const mentions = await message.mentionList()
    switch (message.type()) {
      case MessageType.Recalled:
        return []
      case MessageType.Text:
        let text = message.text()
        for (const mention of mentions) {
          const name = mention.name()
          text = text.replace(new RegExp(`@${name}\\s+`, 'g'), '')
        }
        elements.push(segment.text(text))
        break
      case MessageType.Image:
        elements.push(
          await extractMessageURL(message, async () =>
            segment.image(await (await (message.toFileBox())).toBuffer(), 'image/png'),
          ),
        )
        break
      case MessageType.Audio:
        elements.push(
          await extractMessageURL(message, async () =>
            segment.audio(await (await (message.toFileBox())).toBuffer(), 'audio/wav'),
          ),
        )
        break
      case MessageType.Video:
        elements.push(
          await extractMessageURL(message, async () =>
            segment.video(await (await (message.toFileBox())).toBuffer(), 'video/mp4'),
          ),
        )
        break
      case MessageType.Attachment:
        elements.push(
          await extractMessageURL(message, async (url, name) =>
            segment.file(url, { file: name }),
          ),
        )
        break
      case MessageType.Url:
        const link = await message.toUrlLink()
        elements.push(
          segment('a', { href: link.url() }, [
            link.title() + '\n' + link.description,
            segment.image(link.thumbnailUrl()),
          ]),
        )
        break
      case MessageType.Contact:
        const contact = await message.toContact()
        elements.push(
          segment('wechaty:contact', { id: contact.id, name: contact.name() }),
        )
        break
      default:
        return
    }
    mentions.forEach((mention) => elements.unshift(segment.at(mention.id)))
    return elements
  } catch (e) {
    return
  }
}

export async function adaptMessage(
  bot: WechatyBot,
  message: MessageInterface,
): Promise<Universal.Message> {
  const elements = await messageToElement(bot, message)
  if (!elements) return
  const room = message.room()
  const from = message.talker()
  if (!from) {
    return
  }
  const author = await adaptContact(from)
  const channel = room ? await adaptRoom(room) : {
    id: room?.id ? room.id : 'private:' + author.id,
    name: "unknow",
    type: 3,
  }
  const channel_: Universal.Channel = {
    id: room?.id ? room.id : 'private:' + author.id,
    name: channel?.name ?? "unknow",
    type: 0
  }
  return {
    id: message.id,
    member: author,
    ...author,
    ...channel,
    channel: channel_,
    elements,
    content: elements.map((e) => e.toString()).join(''),
    timestamp: (message.date() || new Date()).valueOf(),
  }
}

export async function autoFilename(url: string) {
  if (url.startsWith('file://')) {
    return path.basename(url.slice(7))
  }
  if (url.startsWith('base64://')) {
    const buf = Buffer.from(url.slice(9), 'base64')
    const type = await FileType.fromBuffer(buf)
    return `file.${type.ext}`
  }
  if (url.startsWith('data:')) {
    const [, mime, base64] = url.match(/^data:([^;]+);base64,(.+)$/)
    const ext = mime2ext(mime)
    if (ext) {
      return `file.${ext}`
    }
    const buf = Buffer.from(base64, 'base64')
    const type = await FileType.fromBuffer(buf)
    return `file.${type?.ext || 'bin'}`
  }
  return path.basename(new URL(url).pathname)
}

export const elementToFileBox = async (element: Element) => {
  const { attrs } = element
  const { url, file } = attrs
  if (!url) return
  if (url.startsWith('file://')) {
    const filePath = url.slice(7)
    return FileBox.fromFile(filePath, file || (await autoFilename(url)))
  }
  if (url.startsWith('base64://')) {
    return FileBox.fromBase64(url.slice(9), file || (await autoFilename(url)))
  }
  if (url.startsWith('data:')) {
    const [, mime, base64] = url.match(/^data:([^;]+);base64,(.+)$/)
    const ext = mime2ext(mime) || 'bin'
    return FileBox.fromBase64(base64, file || `file.${ext}`)
  }
  return FileBox.fromUrl(url, {
    name: file || (await autoFilename(url)),
  })
}

export function getCurrentFunctionName() {
  const error = new Error()
  const stack = error.stack.split('\n')[2]; // 第三行包含调用栈信息

  // 从调用栈信息中提取函数名
  const functionName = stack.trim().replace(/^at /, '').replace(/\(.+\)/, '')

  return functionName || 'anonymous'
}

function generateRandomToken(length: number) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}


interface Config {
  token: string
}
export function getConfig(path: string = 'data/wechaty.json') {
  let config: Config
  try {
    config = JSON.parse(readFileSync(path, { encoding: 'utf-8' }))
  } catch (e) {
    config = {
      token: generateRandomToken(64)
    }
    writeFileSync(path, JSON.stringify(config, null, '\t'))
  }
  return config
}
