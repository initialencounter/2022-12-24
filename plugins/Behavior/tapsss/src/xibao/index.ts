import { readFileSync } from 'fs'
import { Context, Schema, Session } from 'koishi'
import path from 'path'
import { } from 'koishi-plugin-puppeteer'

const img = readFileSync(path.resolve(__dirname, './xibao.jpg'))

export async function render(ctx: Context, config: XiBaoConfig, text: string) {
  const imgEle = await ctx.puppeteer.render(
    html({
      text,
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
  return imgEle
}

interface StyleConfig {
  fontFamily: string
  maxFontSize: number
  minFontSize: number
  offsetWidth: number
}

export interface XiBaoConfig {
  setAvatar: boolean
  snedXibao: boolean
  xibao: StyleConfig
  beibao: StyleConfig
  advanced: {
    importCSS: string
    custom: string
  }
}

export const XiBaoConfigSchema: Schema<XiBaoConfig> = Schema.object({
  snedXibao: Schema.boolean().default(true).description('是否发送喜报'),
  setAvatar: Schema.boolean().default(false).description('是否设置头像'),
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
      custom: Schema.string().role('textarea')
        .default('https://ghproxy.com/https://raw.githubusercontent.com/ifrvn/harmonyos-fonts/main/css/harmonyos_sans_sc.css')
        .description('自定义外部 CSS 地址'),
      importCSS: Schema.string().role('textarea')
        .default('https://gitee.com/ifrank/harmonyos-fonts/raw/main/css/harmonyos_sans_sc.css')
        .description('自定义外部 CSS 地址')
    }).description('高级配置'),
})

import outdent from 'outdent'

export function html(params: {
  text: string,
  fontFamily: string,
  fontColor: string,
  strokeColor: string,
  maxFontSize: number,
  minFontSize: number,
  offsetWidth: number,
  img: Buffer,
  importCSS: string
}) {
  const text = escapeHTML(params.text).replaceAll('\n', '<br/>')
  return outdent`
  <head>
    <style>
      @import url('${params.importCSS}');
      body {
        width: 960px;
        height: 768px;
        padding: 0 32;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin: 0;
        font-weight: 900;
        font-family: ${params.fontFamily};
        color: ${params.fontColor};
        -webkit-text-stroke: 2.5px ${params.strokeColor};
        background-image: url(data:image/png;base64,${params.img.toString('base64')});
        background-repeat: no-repeat;
      }
    </style>
  </head>
  <body>
    <div>${text}</div>
  </body>
  <script>
    const dom = document.querySelector('body')
    const div = dom.querySelector('div')
    let fontSize = ${params.maxFontSize}
    dom.style.fontSize = fontSize + 'px'
    while (div.offsetWidth >= ${params.offsetWidth} && fontSize > ${params.minFontSize}) {
      dom.style.fontSize = --fontSize + 'px'
    }
  </script>`
}

function escapeHTML(str: string) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\'': '&#39;',
    '"': '&quot;'
  }[tag] ?? tag))
}
