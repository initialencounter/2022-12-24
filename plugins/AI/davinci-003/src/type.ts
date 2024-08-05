import { Context, Dict, Schema, Service } from 'koishi'
export class Dvc extends Service {
    static inject = {
      required: ['console', 'database'],
      optional: ['puppeteer', 'vits', 'sst', 'censor']
    }
    output_type: string
    session_config: Dvc.Msg[]
    sessions: Dict
    personality: Dict
    sessions_cmd: string[]
    aliasMap: any
    type: string
    l6k: boolean
    key_number: number
    maxRetryTimes: number
    constructor(ctx: Context, config: Dvc.Config) {
      super(ctx, 'dvc', true)
    }
}
export namespace Dvc {
    export interface Msg {
      role: string
      content: string
    }
    export interface Payload {
      engine: string
      prompt: string
      temperature: number
      max_tokens?: number
      top_p: number
      frequency_penalty: number
      presence_penalty: number
    }
    export interface Config {
      enableContext: boolean
      baseURL: string
      key: string[]
      appointModel: string

      onlyOnePersonality: boolean
      onlyOneContext: boolean
      waiting: boolean
      whisper: boolean
      nickwake: boolean

      recall: boolean
      recall_time: number

      lang: string
      max_tokens: number
      temperature: number
      authority: number
      superuser: string[]
      usage?: number
      minInterval?: number

      alias: string[]
      resolution?: string
      output: string

      private: boolean
      mention: boolean
      randnum: number
      blockuser: string[]
      blockchannel: string[]
      maxRetryTimes: number
    }
    export const Config: Schema<Config> = Schema.intersect([
      Schema.object({
        baseURL: Schema.string().default('https://api.openai.com').description('请求地址'),
        key: Schema.union([
          Schema.array(String).role('secret'),
          Schema.transform(String, value => [value]),
        ]).default([]).role('secret').description('api_key'),
        enableContext: Schema.boolean().default(true).description('是否启用上下文, 关闭后将减少 token 消耗'),
        appointModel: Schema.string().default('gpt-4o-mini').description('[模型](https://openai.com/api/pricing/)'),
      }).description('基础设置'),
      Schema.object({
        onlyOnePersonality: Schema.boolean().default(false).description('所有人共用一个人设，开启后将无法切换人格、删除人格、添加人格'),
        onlyOneContext: Schema.boolean().default(false).description('所有人共用一个上下文'),
        whisper: Schema.boolean().default(false).description('语音回复，开启后 AI 将回复你的语音消息'),
        waiting: Schema.boolean().default(true).description('消息反馈，开启后会发送 `思考中...`'),
        nickwake: Schema.boolean().default(false).description('当聊天中出现 AI 的人格名称，AI 将回复你的消息'),

        recall: Schema.boolean().default(true).description('一段时间后会撤回“思考中”'),
        recall_time: Schema.number().default(5000).description('撤回的时间'),

        lang: Schema.string().description('要翻译的目标语言').default('英文'),

        max_tokens: Schema.number().description('请求长度,否则报错').default(3000),
        temperature: Schema.number().role('slider').min(0).max(1).step(0.01).default(0).description('温度'),
        authority: Schema.number().role('slider').min(0).max(5).step(1).description('允许使用的最低权限').default(1),
        superuser: Schema.array(String).default(['3118087750']).description('可以无限调用的用户'),
        usage: Schema.number().description('每人每日可用次数').default(100),
        minInterval: Schema.number().default(5000).description('连续调用的最小间隔,单位毫秒。'),

        alias: Schema.array(String).default(['ai', 'alowel']).description('触发命令;别名'),
        resolution: Schema.string().default('1024x1024').description('生成图像的默认比例'),
        output: Schema.union([
          Schema.const('minimal').description('只发送文字消息'),
          Schema.const('quote').description('引用消息'),
          Schema.const('figure').description('以聊天记录形式发送'),
          Schema.const('image').description('将对话转成图片'),
          Schema.const('voice').description('发送语音,需要安装ffmpeg')
        ]).description('输出方式。').default('minimal'),

        private: Schema.boolean().default(true).description('开启后私聊AI可触发对话, 不需要使用指令'),
        mention: Schema.boolean().default(true).description('开启后机器人被提及(at/引用)可触发对话'),
        randnum: Schema.number().role('slider').min(0).max(1).step(0.01).default(0).description('随机触发对话的概率，如需关闭可设置为 0'),
        maxRetryTimes: Schema.number().default(30).description('报错后最大重试次数')
      }).description('进阶设置'),

      Schema.object({
        blockuser: Schema.array(String).default([]).description('屏蔽的用户'),
        blockchannel: Schema.array(String).default([]).description('屏蔽的频道')
      }).description('过滤器'),
    ])
  }
