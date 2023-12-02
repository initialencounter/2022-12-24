import { Context, Schema, Dict } from 'koishi'
import PaddleSpeechAsr from './asr'
import PaddleSpeechTts from './tts'

export const name = 'paddlespeech'

export const usage = `
[后端部署教程](https://github.com/PaddlePaddle/PaddleSpeech/blob/develop/docs/source/install_cn.md)<br>
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-paddlespeech 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容<br>

## 使用方法

| 功能 | 指令 |
|  ----  | ----  |
| 语音识别 | asr [链接] |
| 语音合成 | say [文本] |

## 问题反馈
* QQ群：399899914<br>
* 小伙伴如果遇到问题或者有新的想法，欢迎到[这里](https://github.com/initialencounter/mykoishi/issues)反馈哦~

`

export interface Config {
  endpoint: string
  auto_rcg: boolean
  waiting: boolean
  recall: boolean
  recall_time: number
  asr_enable: boolean
  lang: string
  tts_enable: boolean
  speaker_id: number
  speed: number
  max_length: number
}
export const Config: Schema<Dict> =
  Schema.intersect([
    Schema.object({
        endpoint: Schema.string().default('http:127.0.0.1:8888').description('飞桨服务器地址'),
        waiting: Schema.union([
          Schema.const(true).description('开启'),
          Schema.const(false).description('关闭')
        ]).default(true).description('消息反馈，会发送计算中...'),
        asr_enable: Schema.union([
          Schema.const(true).description('开启'),
          Schema.const(false).description('关闭')
        ]).default(true).description('启用语言识别服务'),
        tts_enable: Schema.union([
          Schema.const(true).description('开启'),
          Schema.const(false).description('关闭')
        ]).default(true).description('启用语言合成服务'),
      }),
    Schema.union([
      Schema.object({
        waiting: Schema.const(true),
        recall: Schema.boolean().default(true).description('会撤回计算中'),
        recall_time: Schema.number().default(5000).description('撤回的时间'),
      }).description('消息反馈'),
      Schema.object({
        waiting: Schema.const(false),
      }).description('')
    ]),

    Schema.union([
      Schema.object({
        asr_enable: Schema.const(true),
        auto_rcg: Schema.boolean().default(false).description('自动语音识别,作为服务启用时建议关闭'),
        lang: Schema.union([
          Schema.const('zh_cn').description('汉语'),
          Schema.const('en').description('英语'),
        ]).default('zh_cn').description('语言'),
      }).description('语音识别'),
      Schema.object({
        asr_enable: Schema.const(false)
      }).description('')
    ]),
    Schema.union([
      Schema.object({
        tts_enable: Schema.const(true),
        speaker_id: Schema.number().default(0).description('标准音色'),
        speed: Schema.number().default(1).description('语速'),
        max_length: Schema.number().default(1024).description('字数限制'),
      }).description('语音合成'),
      Schema.object({
        tts_enable: Schema.const(false)
      }).description('')
    ]),
  ])


export function apply(ctx: Context, config: Config) {
  if (config.asr_enable) {
    ctx.plugin(PaddleSpeechAsr, config)
  }
  if (config.tts_enable) {
    ctx.plugin(PaddleSpeechTts, config)
  }
}
