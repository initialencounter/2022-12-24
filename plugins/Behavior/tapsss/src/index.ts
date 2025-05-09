import { readFileSync } from 'fs'
import { Context, h, Next, Schema, Session } from 'koishi'
import path from 'path'
import { html } from './xibao'
import { } from 'koishi-plugin-puppeteer'
import { } from 'koishi-plugin-adapter-onebot'

export const name = 'tapsss'

class Tapsss {
  static inject = ['puppeteer']
  constructor(ctx: Context, config: Tapsss.Config) {
    const img = readFileSync(path.resolve(__dirname, './xibao.jpg'))
    ctx = ctx.platform('onebot')
    ctx.middleware(async (session: Session, next: Next) => {
      if (session.channelId.startsWith('private')) return next()
      if (config.listenUsers.includes(session.userId)) {
        const imgEle = await ctx.puppeteer.render(
          html({
            text: session.content,
            fontFamily: config.xibao.fontFamily,
            fontColor: '#ff0a0a',
            strokeColor: '#ffde00',
            maxFontSize: config.xibao.maxFontSize,
            minFontSize: config.xibao.minFontSize,
            offsetWidth: config.xibao.offsetWidth,
            img,
            importCSS: config.advanced.importCSS === 'custom' ? config.advanced.custom : config.advanced.importCSS
          })
        )
        const el = h.parse(imgEle)
        const imgUrl = el[0].attrs.src
        session.onebot.bot.internal.setQqAvatar(imgUrl)
        if (config.snedXibao) {
          session.send(imgEle)
        }
      }
      return next()
    })
  }
}

namespace Tapsss {
  interface StyleConfig {
    fontFamily: string
    maxFontSize: number
    minFontSize: number
    offsetWidth: number
  }

  export interface Config {
    snedXibao: boolean
    listenUsers: string[]
    xibao: StyleConfig
    beibao: StyleConfig
    advanced: {
      importCSS: string
      custom: string
    }
  }

  export const Config = Schema.object({
    snedXibao: Schema.boolean().default(false).description('是否发送喜报'),
    listenUsers: Schema.array(Schema.string()).default(['6747720298']).description('监听的用户列表，默认监听小萌'),
    xibao: Schema.object({
      fontFamily: Schema.string().default('"HarmonyOS Sans SC", "Source Han Sans CN", sans-serif')
        .description('字体（参照 CSS 中的 [font-family](https://developer.mozilla.org/zh-CN/docs/Web/CSS/font-family) ）'),
      maxFontSize: Schema.number().min(1).default(80).description('最大字体大小（px）'),
      minFontSize: Schema.number().min(1).default(38).description('最小字体大小（px）'),
      offsetWidth: Schema.number().min(1).default(900)
        .description('单行最大宽度（px），任意一行文本达到此宽度后会缩小字体以尽可能不超出此宽度，直到字体大小等于`minFontSize`'),
    }).description('喜报配置'),
    beibao: Schema.object({
      fontFamily: Schema.string().default('"HarmonyOS Sans SC", "Source Han Sans CN", sans-serif')
        .description('字体（参照 CSS 中的 [font-family](https://developer.mozilla.org/zh-CN/docs/Web/CSS/font-family) ）'),
      maxFontSize: Schema.number().min(1).default(90).description('最大字体大小（px）'),
      minFontSize: Schema.number().min(1).default(38).description('最小字体大小（px）'),
      offsetWidth: Schema.number().min(1).default(900)
        .description('单行最大宽度（px），任意一行文本达到此宽度后会缩小字体以尽可能不超出此宽度，直到字体大小等于`minFontSize`'),
    }).description('悲报配置'),
    advanced:
      Schema.object({
        importCSS: Schema.union([
          Schema.const('https://gitee.com/ifrank/harmonyos-fonts/raw/main/css/harmonyos_sans_sc.css').description('国内源（Gitee）'),
          Schema.const('https://raw.githubusercontent.com/ifrvn/harmonyos-fonts/main/css/harmonyos_sans_sc.css').description('国外源（GitHub）'),
          Schema.object({
            custom: Schema.string().role('textarea')
              .default('https://ghproxy.com/https://raw.githubusercontent.com/ifrvn/harmonyos-fonts/main/css/harmonyos_sans_sc.css')
              .description('自定义外部 CSS 地址')
          }).description('自定义')
        ]).description('导入外部 CSS 样式，可用于自定义字体等。')
          .default('https://gitee.com/ifrank/harmonyos-fonts/raw/main/css/harmonyos_sans_sc.css'),
      }).description('高级配置'),
  })
}

export default Tapsss