import { Schema } from "koishi"

interface StyleConfig {
  fontFamily: string
  maxFontSize: number
  minFontSize: number
  offsetWidth: number
}

export interface XiBaoConfig {
  setAvatar: boolean
  sendXiBao: boolean
  xiBao: StyleConfig
  beiBao: StyleConfig
  advanced: {
    importCSS: string
    custom: string
  }
}

export const XiBaoConfig: Schema<XiBaoConfig> = Schema.object({
  sendXiBao: Schema.boolean().default(true).description('是否发送喜报'),
  setAvatar: Schema.boolean().default(false).description('是否设置头像'),
  xiBao: Schema.object({
    fontFamily: Schema.string().default('"HarmonyOS Sans SC", "Source Han Sans CN", sans-serif')
      .description('字体（参照 CSS 中的 [font-family](https://developer.mozilla.org/zh-CN/docs/Web/CSS/font-family) ）'),
    maxFontSize: Schema.number().min(1).default(80).description('最大字体大小（px）'),
    minFontSize: Schema.number().min(1).default(38).description('最小字体大小（px）'),
    offsetWidth: Schema.number().min(1).default(900)
      .description('单行最大宽度（px），任意一行文本达到此宽度后会缩小字体以尽可能不超出此宽度，直到字体大小等于`minFontSize`'),
  }).description('喜报配置'),
  beiBao: Schema.object({
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
