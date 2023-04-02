import { Context, Schema, Logger, h, Time } from "koishi";
import { Shooter } from 'puppeteer-core'
import { PNG } from 'pngjs'
import { } from 'koishi-plugin-puppeteer'
const name = "steam-trading";
const logger = new Logger(name);
export const usage = `
## 注意事项
> 使用前在 <a href="http://www.iflow.work">iflow.work</a> 中获取cookie
本插件仅供学习参考，请勿用于商业行为
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-steam-trading 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容<br>

## 使用方法
[挂刀行情] 请发送 trad buff ['buff', 'igxe', 'c5', 'uupy'] <br>
[行情分析] 请发送 行情分析 <br>
[网页截图] 请发送 行情分析+网址
`
export interface Config {
  Hm_lpvt_a5301d501cd73accbee89775308fdd5e: number
  text_len: number
  ifimg: boolean
  order: string
  game: string
  min_price: number
  max_price: number
  min_volume: number
  buff: boolean
  igxe: boolean
  c5: boolean
  uupy: boolean
  buy: boolean
  safe_buy: boolean
  sell: boolean
  loadTimeout?: number
  idleTimeout?: number
  maxSize?: number
  protocols?: string[]
}

export const Config: Schema<Config> = Schema.object({
  Hm_lpvt_a5301d501cd73accbee89775308fdd5e: Schema.number().description('cookie,默认123123124,可选').default(123123124),
  text_len: Schema.number().default(15).description('显示条目数量'),
  ifimg: Schema.boolean().default(true).description('是否以图片格式发送'),
  buff: Schema.boolean().default(true).description('buff'),
  igxe: Schema.boolean().default(true).description('igxe'),
  c5: Schema.boolean().default(false).description('c5'),
  uupy: Schema.boolean().default(false).description('uuyp'),
  game: Schema.union([
    Schema.const('csgo-dota2').description('全部'),
    Schema.const('dota2').description('仅看dota2'),
    Schema.const('csgo').description('仅看csgo'),
  ]).description('游戏').default('csgo-dota2'),
  order: Schema.union([
    Schema.const('buy').description('最优求购'),
    Schema.const('safe_buy').description('稳定求购'),
    Schema.const('sell').description('最优寄售'),
  ]).description('排序依据').default('safe_buy'),
  min_price: Schema.number().description('最低价格').default(1.0),
  max_price: Schema.number().description('最高价格').default(5000.0),
  min_volume: Schema.number().description('最低成交量').default(2),
  buy: Schema.boolean().default(false).description('最优求购比例'),
  safe_buy: Schema.boolean().default(true).description('稳定求购比例'),
  sell: Schema.boolean().default(true).description('寄售比例'),
  loadTimeout: Schema
    .natural()
    .role('ms')
    .description('加载页面的最长时间。当一个页面等待时间超过这个值时，如果此页面主体已经加载完成，则会发送一条提示消息“正在加载中，请稍等片刻”并继续等待加载；否则会直接提示“无法打开页面”并终止加载。')
    .default(Time.second * 10),
  idleTimeout: Schema
    .natural()
    .role('ms')
    .description('等待页面空闲的最长时间。当一个页面等待时间超过这个值时，将停止进一步的加载并立即发送截图。')
    .default(Time.second * 30),
}).description('截图设置')


export function apply(ctx: Context, config: Config) {
  const buff: string = config.buff ? 'buff-' : ''
  const igxe: string = config.igxe ? 'igxe-' : ''
  const c5: string = config.c5 ? 'c5-' : ''
  const uupy: string = config.uupy ? 'uupy-' : ''
  let game = config.game
  let order = config.order

  var platform: string = buff + igxe + c5 + uupy
  if (platform.length < 3) {
    platform = 'buff-'
  }

  platform = platform.slice(0, -1)
  ctx.i18n.define('zh', require('./locales/zh'))
  const { loadTimeout, idleTimeout } = config
  ctx.command('行情分析 <url:string>')
    .alias('analysis', 'tard.a')
    .action(async ({ session }, prompt) => {
      if (!ctx.puppeteer) return '未加载浏览器服务'
      let url = prompt ? prompt : 'https://www.iflow.work/analysis'
      let loaded = false
      const page = await ctx.puppeteer.page()
      page.on('load', () => loaded = true)
      session.send('正在加载中，请稍等片刻~')
      try {
        await new Promise<void>((resolve, reject) => {
          logger.info(`navigating to ${url}`)
          const _resolve = () => {
            clearTimeout(timer)
            resolve()
          }

          page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: idleTimeout,
          }).then(_resolve, () => {
            return loaded ? _resolve() : reject(new Error('navigation timeout'))
          })

          const timer = setTimeout(() => {
            return loaded
              ? session.send('正在加载中，请稍等片刻~')
              : reject(new Error('navigation timeout'))
          }, loadTimeout)
        })
      } catch (error) {
        page.close()
        logger.info(String(error))
        return '无法打开页面。'
      }

      const shooter: Shooter = page
      if (!shooter) return '找不到满足该选择器的元素。'
      return shooter.screenshot({
        fullPage: true,
      }).then(async (buffer) => {
        if (url.indexOf('https://www.iflow.work/steam?platform') == -1) {
          return h.image(buffer, 'image/png')
        }
        const png = PNG.sync.read(buffer);
        const upperHalfHeight = Math.ceil(config.text_len * 100 + 850);
        const upperHalfPixels = Buffer.alloc(png.width * upperHalfHeight * 4);

        for (let y = 0; y < upperHalfHeight; y++) {
          for (let x = 0; x < png.width; x++) {
            const idx = (png.width * y + x) << 2;
            const upperHalfIdx = (png.width * Math.min(y, upperHalfHeight - 1) + x) << 2;
            png.data.copy(upperHalfPixels, upperHalfIdx, idx, idx + 4);
          }
        }

        const upperHalfPng = new PNG({ width: png.width, height: upperHalfHeight });
        upperHalfPng.data = upperHalfPixels;
        buffer = PNG.sync.write(upperHalfPng);
        return h.image(buffer, 'image/png')
        // const image = sharp(buffer);
        // const height = Math.floor(config.text_len * 100 + 850);
        // const metadata = await image.metadata()
        // const topHalfBuffer = await image.extract({ left: 0, top: 0, width: metadata.width, height }).toBuffer();
      }, (error) => {
        logger.info(String(error))
        return '截图失败。'
      }).finally(() => page.close())
    })
  ctx.command("trad <platform:string>", "['buff', 'igxe', 'c5', 'uupy']").alias('steam-trading', 'steam行情')
    .option('game', '-g <game:string>')
    .option('order', '-o <order:string>')
    .action(async ({ session, options }, prompt) => {
      if (prompt) {
        const platforms: string[] = ['buff', 'igxe', 'c5', 'uupy']
        if (platform.includes(prompt)) {
          platform = prompt
        }
      }
      game = (options.game && ['dota2', 'csgo', 'dota2-csgo', 'csgo-dota2'].includes(options.game)) ? options.game : game
      order = (options.order && ['buy', 'safe_buy', 'sell'].includes(options.order)) ? options.order : order
      const url = `https://www.iflow.work/steam?platform=${platform}&game=${game}&order=${config.order}&pagenum=1&min_price=${config.min_price}&max_price=${config.max_price}&min_volume=${config.min_volume}`

      try {
        if (config.ifimg && ctx.puppeteer) {
          return session.execute(`行情分析 ${url}`)
        } else {
          if (config.ifimg) {
            session.send('未加载浏览器服务,将以文字形式发送')
          }
          const res_html: string = await ctx.http.get(url, { data: { 'Hm_lpvt_a5301d501cd73accbee89775308fdd5e': config.Hm_lpvt_a5301d501cd73accbee89775308fdd5e } })
          const res: string[][] = get_body(res_html, config.text_len)
          let res_text = 'Steam 挂刀行情http://www.iflow.work\n'
          for (var i in res) {
            const buy_text = config.buy ? `最优求购比例: ${res[i][5]}` : ''
            const safe_buy_text = config.safe_buy ? `稳定求购比例: ${res[i][6]}` : ''
            const sell_text = config.sell ? `寄售比例: ${res[i][4]}` : ''
            res_text += `${res[i][0]}. ${res[i][1]}日成交量: ${res[i][2]}  平台最低售价: ${res[i][3]} ${sell_text} ${buy_text} ${safe_buy_text}\n\n`
          }
          return res_text
        }
      }
      catch (err) {
        logger.info(String(err))
        return String(err)
      }
    });
}

function get_body(html_str: string, text_len: number) {
  const tbody_start = html_str.indexOf('<tbody>') + 7
  const tbody_end = html_str.indexOf('</tbody>')
  const tbody: string = html_str.slice(tbody_start, tbody_end)
  const table_arr = tbody.split('data-id')
  const res_arr = []
  table_arr.slice(1, text_len + 1).forEach((i, id) => {
    const td1_start: number = i.search('<td') + 5
    const td1_end: number = i.search('</td>')
    const td1_text: string = i.slice(td1_start, td1_end)
    const td1_after: string = i.slice(td1_end + 5, -1)

    const td2_start: number = td1_after.search('.png"> ') + 8
    const td2_end: number = td1_after.search('</td>')
    let td2_text: string = td1_after.slice(td2_start, td2_end - 10)
    td2_text = td2_text.replace('<td >', '')
    const td2_after: string = td1_after.slice(td2_end + 5, -1)

    const td3_start: number = td2_after.search('<td') + 4
    const td3_end: number = td2_after.search('</td>')
    const td3_text: string = td2_after.slice(td3_start, td3_end)
    const td3_after: string = td2_after.slice(td3_end + 5, -1)

    const td4_start: number = td3_after.search('<td') + 4
    const td4_end: number = td3_after.search('</td>')
    const td4_text: string = td3_after.slice(td4_start, td4_end)
    const td4_after: string = td3_after.slice(td4_end + 5, -1)

    const td5_start: number = td4_after.search('>') + 1
    const td5_end: number = td4_after.search('</td>')
    const td5_text: string = td4_after.slice(td5_start, td5_end)
    const td5_after: string = td4_after.slice(td5_end + 5, -1)

    const td6_start: number = td5_after.search('>') + 1
    const td6_end: number = td5_after.search('</td>')
    const td6_text: string = td5_after.slice(td6_start, td6_end)
    const td6_after: string = td5_after.slice(td6_end + 5, -1)

    const td7_start: number = td6_after.search('>') + 1
    const td7_end: number = td6_after.search('</td>')
    const td7_text: string = td6_after.slice(td7_start, td7_end)
    const td7_after: string = td6_after.slice(td7_end + 5, -1)
    res_arr.push([td1_text, td2_text, td3_text, td4_text, td5_text, td6_text, td7_text])
  });
  return res_arr
}
