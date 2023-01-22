import { Context, Schema, Logger } from 'koishi'
import { } from '@koishijs/plugin-rate-limit'
import { Configuration, OpenAIApi } from "openai"
export const name = 'davinci-003'
export const logger = new Logger(name);
export interface Config {
  alias: string[]
  key: string
  max_tokens: number
  authority: number
  usage: number
  mode: string
}
export const usage = `
## 注意事项
> 使用前在 <a href="https://beta.openai.com/account/api-keys">beta.openai.com</a> 中获取api-key
本插件仅供学习参考，请勿用于商业行为
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-davinci-003 概不负责。
如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
`
export const Config: Schema<Config> = Schema.object({
  alias: Schema.array(String).default(['davinci', '达芬奇']).description('触发命令;别名'),
  key: Schema.string().description('api_key').required(),
  max_tokens: Schema.number().description('请求长度').default(256),
  authority: Schema.number().description('允许使用的最低权限').default(1),
  usage: Schema.number().description('每人每日可用次数').default(10),
  mode: Schema.union([
    Schema.const('text-davinci-003').description('语言相关text-davinci-003'),
    Schema.const('text-curie-001').description('语言相关text-curie-001'),
    Schema.const('text-babbage-001').description('语言相关text-babbage-001'),
    Schema.const('text-ada-001').description('语言相关text-ada-001'),
    Schema.const('code-cushman-001').description('代码相关code-cushman-001'),
    Schema.const('code-davinci-003').description('代码相关code-davinci-003')
  ]).description('模型选择').default('text-davinci-003')
})


export function apply(ctx: Context, config: Config) {
  let num:number = 1
  while(config.alias.length<5){
    config.alias.push(`davinci${num}`)
    num++
  }
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.command('dvc <prompt:string>', {
    authority: config.authority,
    maxUsage: config.usage,
    usageName: 'ai'
  })
    .alias(config.alias[0], config.alias[1], config.alias[2])
    .action(async ({ session, options }, prompt) => {
      if (!prompt) {
        return session.text('commands.dvc.messages.no-prompt')
      }
      session.send(session.text('commands.dvc.messages.thinking'))
      try {
        const text: string = await opai(prompt, config.key, config.max_tokens, config.mode)
        return text
      }
      catch (err) {
        logger.warn(err)
        return String(err)
      }
    })

}
async function opai(prompt: string, key: string, max_tokens: number, mode: string) {
  const configuration = new Configuration({
    apiKey: key
  });
  const openai = new OpenAIApi(configuration);
  const response = await openai.createCompletion({
    model: mode,
    prompt: prompt,
    temperature: 0.7,
    max_tokens: max_tokens,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  return response.data.choices[0].text
}
