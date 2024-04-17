import { Context, Schema, Logger, h, Time } from "koishi";
import { PNG } from 'pngjs'
import { } from 'koishi-plugin-puppeteer'
import { readFileSync } from "fs";
import { resolve } from "path";
const name = "steam-trading";
const logger = new Logger(name);

export const usage = `${readFileSync(resolve(__dirname, '../readme.md')).toString('utf-8')}`

export interface Config {
  text_len: number
  order: string
  game: string
  min_price: number
  max_price: number
  min_volume: number
  buff: boolean
  igxe: boolean
  c5: boolean
  uuyp: boolean
  buy: boolean
  safe_buy: boolean
  sell: boolean
  loadTimeout?: number
  idleTimeout?: number
  maxSize?: number
  protocols?: string[]
}

export const Config: Schema<Config> = Schema.object({
  text_len: Schema.number().default(15).description('显示条目数量'),
  buff: Schema.boolean().default(true).description('buff'),
  igxe: Schema.boolean().default(true).description('igxe'),
  c5: Schema.boolean().default(false).description('c5'),
  uuyp: Schema.boolean().default(false).description('uuyp'),
  game: Schema.union([
    Schema.const('csgo-dota2' as string).description('全部'),
    Schema.const('dota2' as string).description('仅看dota2'),
    Schema.const('csgo' as string).description('仅看csgo'),
  ]).description('游戏').default('csgo-dota2' as string),
  order: Schema.union([
    Schema.const('buy' as string).description('最优求购'),
    Schema.const('safe_buy' as string).description('稳定求购'),
    Schema.const('sell' as string).description('最优寄售'),
  ]).description('排序依据').default('safe_buy' as string),
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

export const inject = {
  required: ['puppeteer']
}
export function apply(ctx: Context, config: Config) {
  const buff: string = config.buff ? 'buff-' : ''
  const igxe: string = config.igxe ? 'igxe-' : ''
  const c5: string = config.c5 ? 'c5-' : ''
  const uuyp: string = config.uuyp ? 'uuyp-' : ''
  let game = config.game
  let order = config.order

  var platform: string = buff + igxe + c5 + uuyp
  if (platform.length < 3) {
    platform = 'buff-'
  }

  platform = platform.slice(0, -1)
  ctx.i18n.define('zh', require('./locales/zh'))
  const { loadTimeout, idleTimeout } = config
  ctx.command('trad.行情分析 <url:string>')
    .action(async ({ session }, prompt) => {
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

      const shooter = page
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
      }, (error) => {
        logger.info(String(error))
        return '截图失败。'
      }).finally(() => page.close())
    })
  ctx.command("trad <platform:string>", "['buff', 'igxe', 'c5', 'uuyp']")
    .option('game', '-g <game:string>')
    .option('order', '-o <order:string>')
    .action(async ({ session, options }, prompt) => {
      if (prompt) {
        if (platform.includes(prompt)) {
          platform = prompt
        }
      }
      game = (options.game && ['dota2', 'csgo', 'dota2-csgo', 'csgo-dota2'].includes(options.game)) ? options.game : game
      order = (options.order && ['buy', 'safe_buy', 'sell'].includes(options.order)) ? options.order : order
      const url = `https://www.iflow.work/steam?platform=${platform ?? 'buff'}&game=${game}&order=${config.order}&pagenum=1&min_price=${config.min_price}&max_price=${config.max_price}&min_volume=${config.min_volume}`

      return session.execute(`trad.行情分析 ${url}`)
      
    })
}

