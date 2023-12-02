import { Context, Schema, Logger,Element,segment } from 'koishi'
import { } from 'koishi-plugin-rate-limit'
import { } from 'koishi-plugin-puppeteer'
export const name = 'facercg'

const headers: object = {
  "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
}

const payload: object = {
  "image_type": "BASE64",
  "face_field": "gender,beauty",
  "max_face_num": 120,
}


export const div_items = (face_arr: Face_info[]) => {
  const style_arr: string[] = []
  for (var i in face_arr) {
    var location: Location = face_arr[i].location
    var style_str: string = `transform: rotate(${location.rotation}deg);position: absolute;font-size: 10px;width: ${location.width}px;height: ${location.height}px;left: ${location.left}px;top: ${location.top}px;rotation: ${location.rotation}deg;background: transparent;border: 5px solid green`
    style_arr.push(style_str)
  }
  const res: Element[] = style_arr.map((style, id) =>
    <div style={style}>face{id}</div>
  )
  return res
}


export const msg = (face_arr: Face_info[]) => {
  const msg_arr: string[] = []
  for (var i in face_arr) {
    var gender = face_arr[i].gender
    var beauty = face_arr[i].beauty
    msg_arr.push(`第${i}张脸,颜值:${beauty} 性别:${gender.type}｜概率:${gender.probability}`)
  }
  const res: Element[] = msg_arr.map((text, id) =>
    <p>{text}</p>
  )
  return res
}

export const usage = `
## 注意事项
> 使用前在 <a href="https://console.bce.baidu.com/ai/#/ai/face/overview/index">百度智能云</a> 中获取apikey及secret_key
或者<a href="https://github.com/initialencounter/beauty-predict-server">自建服务端</a>
> 对于部署者行为及所产生的任何纠纷
Koishi 及 koishi-plugin-facercg 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`

export const logger = new Logger(name)

export interface Gender {
  type: string
  probability: number
}
export interface Location {
  left: number
  top: number
  width: number
  height: number
  rotation: number
}
export interface Face_info {
  location: Location
  beauty: number
  gender: Gender
}
export interface Result {
  face_num: number
  face_list: Face_info[]
}
export interface Response {
  error_code: number
  error_msg: string
  log_id: number
  timestamp: number
  cached: number
  result: Result
}

export interface Config {
  type: string
  key: string
  secret_key: string
  authority: number
  endpoint: string
  usage: number
  cmd: string
}

export const Config = Schema.intersect([
  Schema.object({
    type: Schema.union([
      Schema.const('BaiduApi' as const).description('百度api'),
      Schema.const('Pca' as const).description('随机森林'),
    ] as const).default('BaiduApi').description('后端选择'),
  }).description('基础设置'),
  Schema.union([
    Schema.object({
      type: Schema.const('BaiduApi'),
      key: Schema.string().description('api_key').required(),
      secret_key: Schema.string().description('secret_key').required(),
    }),
    Schema.object({
      type: Schema.const('Pca'),
      endpoint: Schema.string().description('API 服务器地址。').required(),
    })
  ]),
  Schema.object({
    authority: Schema.number().description('允许使用的最低权限').default(3),
    usage: Schema.number().description('每人每日可用次数').default(10),
    cmd: Schema.string().description('触发命令').default('face')
  }).description('进阶设置')
])

export async function get_access_token(ctx: Context, config: Config) {
  const token_url: string = "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials"
  const access_token: string = await (await ctx.http.axios(`${token_url}&client_id=${config.key}&&client_secret=${config.secret_key}`, headers)).data["access_token"]
  return access_token
}

export async function apply(ctx: Context, config: Config) {
  let access_token: string
  if (config.type == 'BaiduApi') {
    access_token = await get_access_token(ctx, config)//获取token
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
      session.send(session.text('.running'))
      if (session.content.indexOf('url=') == -1) {
        return session.text('.noimg')
      }
      const image = segment.select(session.content, "image")[0];
      const img_url = image?.attrs?.url
      let resp:Response
      try {
        if (config.type == 'BaiduApi') {
          const buffer:Buffer = await ctx.http.get(img_url, { responseType: 'arraybuffer', headers })
          const base64:string = Buffer.from(buffer).toString('base64')

          payload["image"] = base64
          resp = await ctx.http.post(`${api_url}?access_token=${access_token}`, payload, headers)//获取颜值评分

        } else {
          resp = await ctx.http.post(config.endpoint, {
            'type': 'url',
            'data': img_url
          })
        }
      }
      catch (err) {
        logger.warn(err)
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
      const div_items_: Element[] = div_items(face_arr)//框出face
      const text_msg: Element[] = msg(face_arr)//文字消息

      session.send(text_msg)
      //判断是否启用puppeteer
      if (ctx.puppeteer) {
        return <html>
          <img src={img_url} />
          {div_items_}
        </html>
      }
      return
    })
}
