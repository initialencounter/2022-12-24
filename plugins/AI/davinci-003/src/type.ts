import { Context, Dict, Schema, Service } from "koishi"
export class Dvc extends Service {
    static inject = {
      required: ['console'],
      optional: ['puppeteer', 'vits', 'sst', 'censor']
    }
    output_type: string;
    session_config: Dvc.Msg[];
    sessions: Dict;
    personality: Dict;
    sessions_cmd: string[];
    aliasMap: any;
    type: string
    l6k: boolean;
    key_number: number;
    maxRetryTimes: number;
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
      type: string
      key: string[]
      appointModel: string

      preset_pro: boolean
      single_session: boolean
      waiting: boolean
      whisper: boolean
      nickwake: boolean

      recall: boolean
      recall_time: number
      recall_all: boolean
      recall_all_time: number

      lang: string
      selfId: string

      max_tokens: number
      temperature: number
      authority: number
      superuser: string[]
      usage?: number
      minInterval?: number

      alias: string[]
      resolution?: string
      output: string

      if_private: boolean
      if_at: boolean
      randnum: number
      proxy_reverse: string
      proxy_reverse4: string

      blockuser: string[]
      blockchannel: string[]

      maxRetryTimes: number


    }
    export const Config: Schema<Config> = Schema.intersect([
      Schema.object({
        type: Schema.union([
          Schema.const('gpt3.5-js' as const).description('GPT-3.5 推荐模式'),
          Schema.const('gpt3.5-unit' as const).description('GPT-3.5 超级节俭模式'),
          Schema.const('gpt4' as const).description('GPT-4'),
          Schema.const('gpt4-unit' as const).description('GPT-4 超级节俭模式')
        ] as const).default('gpt3.5-js').description('引擎选择'),
        key: Schema.union([
          Schema.array(String).role('secret'),
          Schema.transform(String, value => [value]),
        ]).default([]).role('secret').description('api_key'),
        appointModel: Schema.string().default("gpt-3.5-turbo").description("模型, 选 GPT4 时需要将模型切换为 gpt4")
      }).description('基础设置'),

      Schema.object({
        preset_pro: Schema.boolean().default(false).description('所有人共用一个人设'),
        single_session: Schema.boolean().default(false).description('所有人共用一个会话'),
        whisper: Schema.boolean().default(false).description('语音输入功能,需要加载sst服务,启用插件tc-sst即可实现'),
        waiting: Schema.boolean().default(true).description('消息反馈，会发送思考中...'),
        nickwake: Schema.boolean().default(false).description('人格昵称唤醒'),

        recall: Schema.boolean().default(true).description('一段时间后会撤回“思考中”'),
        recall_time: Schema.number().default(5000).description('撤回的时间'),
        recall_all: Schema.boolean().default(false).description('一段时间后会撤回所有消息'),
        recall_all_time: Schema.number().default(5000).description('撤回所有消息的时间'),

        lang: Schema.string().description('要翻译的目标语言').default('英文'),
        selfId: Schema.string().description('聊天记录头像的QQ号').default('3118087750'),

        max_tokens: Schema.number().description('请求长度,否则报错').default(3000),
        temperature: Schema.number().role('slider').min(0).max(1).step(0.01).default(0).description('创造力'),
        authority: Schema.number().role('slider').min(0).max(5).step(1).description('允许使用的最低权限').default(1),
        superuser: Schema.array(String).default(['3118087750']).description('可以无限调用的用户'),
        usage: Schema.number().description('每人每日可用次数').default(100),
        minInterval: Schema.number().default(5000).description('连续调用的最小间隔,单位毫秒。'),

        alias: Schema.array(String).default(['ai', 'alowel']).description('触发命令;别名'),
        resolution: Schema.union([
          Schema.const('256x256').description('256x256'),
          Schema.const('512x512').description('512x512'),
          Schema.const('1024x1024').description('1024x1024')
        ]).default('1024x1024').description('生成图像的默认比例'),
        output: Schema.union([
          Schema.const('minimal').description('只发送文字消息'),
          Schema.const('quote').description('引用消息'),
          Schema.const('figure').description('以聊天记录形式发送'),
          Schema.const('image').description('将对话转成图片'),
          Schema.const('voice').description('发送语音,需要安装ffmpeg')
        ]).description('输出方式。').default('minimal'),

        if_private: Schema.boolean().default(true).description('开启后私聊可触发ai'),
        if_at: Schema.boolean().default(true).description('开启后被提及(at/引用)可触发ai'),
        randnum: Schema.number().role('slider').min(0).max(1).step(0.01).default(0).description('随机回复概率，如需关闭可设置为0'),
        proxy_reverse: Schema.string().role('link').default('https://gpt.lucent.blog').description('GPT3反向代理地址'),
        proxy_reverse4: Schema.string().role('link').default('https://chatgpt.nextweb.fun/api/openai').description('GPT4反向代理地址'),
        maxRetryTimes: Schema.number().default(30).description('报错后最大重试次数')
      }).description('进阶设置'),

      Schema.object({
        blockuser: Schema.array(String).default([]).description('屏蔽的用户'),
        blockchannel: Schema.array(String).default([]).description('屏蔽的频道')
      }).description('过滤器'),
    ])
  }
