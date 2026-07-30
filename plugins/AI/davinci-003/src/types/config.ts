import { Schema } from 'koishi'

export interface DvcPluginConfig {
  api: APIConfig
  behavior: BehaviorConfig
  filter: FilterConfig
}

export interface APIConfig {
  selectBaseURL: boolean
  baseURL: string
  selectModel: boolean
  appointModel: string
  key: string[]
  enableContext: boolean
  maxRetryTimes: number
}

export const APIConfig: Schema<APIConfig> = Schema.intersect([
  Schema.union([
    Schema.object({
      selectBaseURL: Schema.const(true),
      baseURL: Schema.union([
        Schema.const('https://api.openai.com').description('https://api.openai.com'),
        Schema.const('https://api.deepseek.com').description('https://api.deepseek.com'),
        Schema.const('https://api.chatanywhere.com.cn').description('https://api.chatanywhere.com.cn'),
        Schema.transform(String, value => value),
      ]).default('https://api.openai.com').description('选择平台'),
    }).description('选择平台'),
    Schema.object({
      selectBaseURL: Schema.const(false),
      baseURL: Schema.string().default('https://api.openai.com').description('自定义平台'),
    }).description('自定义平台'),
  ]),
  Schema.union([
    Schema.object({
      selectModel: Schema.const(true),
      appointModel: Schema.union([
        Schema.const('gpt-5.6-sol').description('gpt-5.6-sol'),
        Schema.const('deepseek-v4-pro').description('deepseek-v4-pro'),
        Schema.const('deepseek-v4-flash').description('deepseek-v4-flash'),
        Schema.transform(String, value => value),
      ]).default('deepseek-v4-flash').description('[选择模型](https://openai.com/api/pricing/)'),
    }).description('选择模型'),
    Schema.object({
      selectModel: Schema.const(false),
      appointModel: Schema.string().default('deepseek-v4-flash').description('自定义模型'),
    }).description('自定义模型'),
  ]),
  Schema.object({
    selectBaseURL: Schema.boolean().default(true).description('选择平台'),
    selectModel: Schema.boolean().default(true).description('选择模型'),
    key: Schema.union([
      Schema.array(String).role('secret'),
      Schema.transform(String, value => [value]),
    ]).default([]).role('secret').description('api_key'),
    enableContext: Schema.boolean().default(true).description('是否启用上下文, 关闭后将减少 token 消耗'),
    maxRetryTimes: Schema.number().default(30).description('报错后最大重试次数'),
  }).description('基础设置'),
])

export interface BehaviorConfig {
  onlyOnePersonality: boolean
  onlyOneContext: boolean
  whisper: boolean
  waiting: boolean
  nickwake: boolean

  recall: boolean
  recall_time: number

  lang: string
  enableReasoningContent: boolean
  max_tokens: number
  temperature: number
  authority: number
  superuser: string[]
  usage?: number

  alias: string[]
  resolution?: string
  output: 'image' | 'quote' | 'figure' | 'minimal' | 'voice'

  private: boolean
  mention: boolean
  randnum: number
}

export const BehaviorConfig: Schema<BehaviorConfig> = Schema.object({
  onlyOnePersonality: Schema.boolean().default(false).description('所有人共用一个人设，开启后将无法切换人格、删除人格、添加人格'),
  onlyOneContext: Schema.boolean().default(false).description('所有人共用一个上下文'),
  whisper: Schema.boolean().default(false).description('语音回复，开启后 AI 将回复你的语音消息'),
  waiting: Schema.boolean().default(true).description('消息反馈，开启后会发送 `思考中...`'),
  nickwake: Schema.boolean().default(false).description('当聊天中出现 AI 的人格名称，AI 将回复你的消息'),

  recall: Schema.boolean().default(true).description('一段时间后会撤回“思考中”'),
  recall_time: Schema.number().default(5000).description('撤回的时间'),

  lang: Schema.string().description('要翻译的目标语言').default('英文'),

  enableReasoningContent: Schema.boolean().default(false).description('是否输出思维链内容'),
  max_tokens: Schema.number().description('最大上下文长度').default(512000),
  temperature: Schema.number().role('slider').min(0.01).max(1).step(0.01).default(0.01).description('温度'),
  authority: Schema.number().role('slider').min(0).max(5).step(1).description('允许使用的最低权限').default(1),
  superuser: Schema.array(String).default(['3118087750']).description('可以无限调用的用户'),
  usage: Schema.number().description('每人每日可用次数').default(100),

  alias: Schema.array(String).default(['ai']).description('指令别名'),
  resolution: Schema.string().default('1024x1024').description('生成图像的默认比例'),
  output: Schema.union([
    Schema.const('minimal').description('只发送文字消息'),
    Schema.const('quote').description('引用消息'),
    Schema.const('figure').description('以聊天记录形式发送'),
    Schema.const('image').description('将对话转成图片'),
    Schema.const('voice').description('发送语音')
  ]).description('输出方式。').default('image'),

  private: Schema.boolean().default(true).description('开启后私聊AI可触发对话, 不需要使用指令'),
  mention: Schema.boolean().default(true).description('开启后机器人被提及(at/引用)可触发对话'),
  randnum: Schema.number().role('slider').min(0).max(1).step(0.01).default(0).description('随机触发对话的概率，如需关闭可设置为 0'),
}).description('进阶设置')

export interface FilterConfig {
  blockuser: string[]
  blockchannel: string[]
}

export const FilterConfig: Schema<FilterConfig> = Schema.object({
  blockuser: Schema.array(String).default([]).description('屏蔽的用户'),
  blockchannel: Schema.array(String).default([]).description('屏蔽的频道')
}).description('过滤器')
