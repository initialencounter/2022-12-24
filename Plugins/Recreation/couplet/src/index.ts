import { Context, Schema, Logger } from 'koishi'
import { } from 'koishi-plugin-rate-limit'
export const name = 'couplet'
export const logger = new Logger(name);

const headers: object = {
  "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
}
export const usage = `

`
export interface Config {
  authority: number
  usage: number
  cpnum: number
}

export const Config: Schema<Config> = Schema.object({
  authority: Schema.number().role('slider').min(0).max(5).step(1).description('允许使用的最低权限').default(1),
  usage: Schema.number().description('每人每日可用次数').default(10),
  cpnum: Schema.number().description('对联生成条数').default(2)
})

export async function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.command('couplet <prompt:text>', 'AI对对联', {
    authority: config.authority,
    maxUsage: config.usage,
    usageName: 'couplet'
  })
    .action(async ({ session }, prompt) => {
      if (!prompt) {
        return session.text(".noargs")
      }
      session.send(session.text('.running'))
      const api_url: string = "https://seq2seq-couplet-model.rssbrain.com/v0.2/couplet/"
      try {
        const resp = await ctx.http.get(`${api_url}{state["${prompt}"]}`, headers)//获取对联
        const couplet_list: string = resp.output

        var msg: string = `上联:\n➤${prompt}\n下联:\n`
        for (var i = 1; i < config.cpnum + 1; i++) {
          var out_put = couplet_list[couplet_list.length - i]
          msg += '➤' + out_put + '\n'
        }
        return msg
      }
      catch (err) {
        logger.warn(err)
        return String(err)
      }
    })
}
