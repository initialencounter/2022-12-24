import { Context, Schema, Logger, Element } from 'koishi'
import { } from 'koishi-plugin-rate-limit'
import { } from 'koishi-plugin-puppeteer'
import { getImgUrl, div_items, msg } from './utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { } from "@koishijs/plugin-notifier"
export const name = 'facercg'

export const inject = {
  required: ['http'],
  optional: ['puppeteer', 'notifier']
}
const headers: object = {
  "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
}

const payload: object = {
  "image_type": "BASE64",
  "face_field": "gender,beauty",
  "max_face_num": 120,
}


export const usage = readFileSync(resolve(__dirname, "../readme.md")).toString('utf-8').split("更新日志")[0];

export const logger = new Logger(name)

export interface Config {
  key: string
  secret_key: string
  authority: number
  usage: number
  cmd: string
}

export const Config: Schema<Config> = Schema.object({
  key: Schema.string().description('api_key').required(),
  secret_key: Schema.string().description('secret_key').required(),
  authority: Schema.number().description('允许使用的最低权限').default(3),
  usage: Schema.number().description('每人每日可用次数').default(10),
  cmd: Schema.string().description('触发命令').default('face')
})


export async function get_access_token(ctx: Context, config: Config) {
  const token_url: string = "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials"
  const access_token: string = await (await ctx.http.axios(`${token_url}&client_id=${config.key}&&client_secret=${config.secret_key}`, headers)).data["access_token"]
  return access_token
}

export async function apply(ctx: Context, config: Config) {
  let access_token: string
  if (!access_token) {
    if (ctx.notifier) {
      let notifier1 = ctx.notifier.create({ type: 'success' })
      let notifier2 = ctx.notifier.create({ type: 'warning' })
      try {
        access_token = await get_access_token(ctx, config)//获取token
        notifier1.update('token 获取成功')
        setTimeout(() => {
          notifier1.dispose()
        }, 30000)
      } catch (e) {
        notifier2.update(e.toString())
        setTimeout(() => {
          notifier2.dispose()
        }, 30000)
      }
    } else {
      access_token = await get_access_token(ctx, config)//获取token
    }
  }
  const api_url: string = "https://aip.baidubce.com/rest/2.0/face/v3/detect"
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.command('facercg <prompt:text>', {
    authority: config.authority,
    maxUsage: config.usage,
    usageName: 'face'
  })
    .alias(config.cmd)
    .action(async ({ session }) => {
      let img_url = getImgUrl(session.elements)
      if (!img_url) {
        session.send(session.text('.noimg'))
        let input = await session.prompt(60000)
        img_url = getImgUrl(Element.parse(input))
        if (!img_url) {
          return '请重新触发指令！'
        }
      }
      session.send(session.text('.running'))
      let resp: Response
      try {
        const buffer: ArrayBuffer = await ctx.http.get(img_url, { responseType: 'arraybuffer', headers })
        const base64: string = Buffer.from(buffer).toString('base64')
        payload["image"] = base64
        resp = await ctx.http.post(`${api_url}?access_token=${access_token}`, payload, headers)//获取颜值评分
      }
      catch (err) {
        logger.error(err)
        return String(err)
      }

      if (resp["error_msg"] == "pic not has face") {
        return session.text('.noface')//没有找到face
      }
      if (resp["error_msg"] != "SUCCESS") {
        logger.warn(`错误信息: ${resp["error_msg"]}`)
        return `错误信息: ${resp["error_msg"]}`
      }
      const face_arr = resp["result"]["face_list"]
      const div_items_: string = div_items(face_arr)//框出face
      const text_msg: string = msg(face_arr)//文字消息

      session.send(text_msg)
      let html = `<html>
        <img src=${img_url} />
        ${div_items_}
      </html>`
      //判断是否启用puppeteer
      if (ctx.puppeteer) {
        return ctx.puppeteer.render(html)
      }
      return
    })
}
