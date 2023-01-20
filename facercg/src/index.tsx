import { Context, Schema, Dict, Logger} from 'koishi'
import {} from '@koishijs/plugin-rate-limit'
import {} from 'koishi-plugin-puppeteer'
export const name = 'facercg'

const headers: object = {
  "headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36"}
}

const payload: object = {
  "image_type": "BASE64",
  "face_field": "gender,beauty",
  "max_face_num": 120,
}

export  interface Config {
  key: string
  secret_key: string
  authority: number
  usage: number
  cmd: string
}

export const div_items = (face_arr: any[]) => {
  var text_arr = [
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 50px;top: 50px;background: #00C91A',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 50px;top: 50px;background: #444444',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 50px;top: 50px;background: #444444',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 100px;top: 100px;background: #008314',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 100px;top: 100px;background: #707070',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 100px;top: 100px;background: #00C91A',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 150px;top: 150px;background: #707070',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 150px;top: 150px;background: #707070',
  'position: absolute;font-size: 25px;width: 50px;height: 50px;left: 150px;top: 150px;background: #006FFF'
] 
  const style_arr: string[] = []
  for (var i in face_arr) {
    var location: any = face_arr[i].location
    var style_str: string = `transform: rotate(${location.rotation}deg);position: absolute;font-size: 10px;width: ${location.width}px;height: ${location.height}px;left: ${location.left}px;top: ${location.top}px;rotation: ${location.rotation}deg;background: transparent;border: 1px solid green`
    style_arr.push(style_str)
  }
  const res: any[] = style_arr.map((style, id) =>
    <div style={style}>face{id}</div>
  )
  return res
}

export const msg = (face_arr: any[]) => {
  const msg_arr: string[] = []
  for (var i in face_arr) {
    // console.log(face_arr)
    var gender = face_arr[i].gender
    var beauty = face_arr[i].beauty
    msg_arr.push(`第${i}张脸,性别:${gender.type}｜概率:${gender.probability}颜值:${beauty}`)
  }
  const res: any[]= msg_arr.map((text,id) =>
    <p>{text}</p>
  )
  return res
}

export const logger = new Logger(name)

export const Config: Schema<Config> = Schema.object({
  key:Schema.string().description('api_key').required(),
  secret_key:Schema.string().description('secret_key').required(),
  authority:Schema.number().description('允许使用的最低权限').default(3),
  usage:Schema.number().description('每人每日可用次数').default(10),
  cmd:Schema.string().description('触发命令').default('face')
})

export async function get_access_token(ctx: Context,config:Config) {
  const token_url: string = "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials"
  const access_token_pms: any = await ctx.http.axios(`${token_url}&client_id=${config.key}&&client_secret=${config.secret_key}`, headers)
  const token: string = access_token_pms.data["access_token"]
  // console.log(`已获取token${token}`)
  return token
}

export async function apply(ctx: Context,config:Config) {
  const access_token: any = await get_access_token(ctx,config)//获取token

  const api_url: string = "https://aip.baidubce.com/rest/2.0/face/v3/detect"
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.command('facercg <prompt:text>',{
    authority: config.authority,
    maxUsage: config.usage,
    usageName: 'face'
  })
  .alias(config.cmd)
  .action(async ({session})=>{
    session.send(session.text('.running'))
    const attrs: Dict<any, string> = {
      userId: session.userId,
      nickname: session.author?.nickname || session.username,
    }
    if (session.content.indexOf('url=')==-1){
      return session.text('.noimg')
    }
    const regexp = /url="[^,]+"/;
    const img_url = session.content.match(regexp)[0].slice(5, -1);
    const buffer = await ctx.http.get(img_url, { responseType: 'arraybuffer', headers })
    const base64 = Buffer.from(buffer).toString('base64')

    payload["image"] = base64
    const resp = await ctx.http.post(`${api_url}?access_token=${access_token}`, payload, headers)//获取颜值评分
    // logger.warn(resp)

    if(resp["error_msg"]=="pic not has face"){
      return session.text('.noface')
    }
    if(resp["error_msg"]!="SUCCESS"){
      logger.warn(`错误信息: ${resp["error_msg"]}`)
      return `错误信息: ${resp["error_msg"]}`
    }

    const face_arr = resp["result"]["face_list"]

    //判断是否启用puppeteer
    if (ctx.puppeteer) {
      // logger.warn('ppt')
      // const div_items_: any[] = div_items(face_arr)
      const div_items_: any[] = div_items(face_arr)
      const text_msg:any[] = msg(face_arr)
      return <html>
        <img src={img_url} />
        {div_items_}
        <p>{text_msg}</p>
      </html>
    } else {
      const text_msg:any[] = msg(face_arr)
      return text_msg
    }
  })
}
