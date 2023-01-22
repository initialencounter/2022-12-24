import { Context, Schema,Logger } from 'koishi'
export const name = 'stnb'
export const logger = new Logger(name);
export interface Config {
  cmd: string
}
export const Config: Schema<Config> = Schema.object({
  cmd: Schema.string().default('斯坦牛逼').description('命令别名')
})
export function compute(mode:number, time:number, bvs:number) {
  var cont:number = 435.001
  if (mode == 1) {
    cont = 47.229
  }
  if (mode == 2) {
    cont = 153.73
  }
  const st:number = cont / ((time ** 1.7) / (time * bvs))
  return st.toFixed(3)

};
export const usage = `
  ## 注意事项
  > 本插件参考自 <a href="https://github.com/putianyi889/mmmh-wiki">putianyi889 扫雷术语</a>
  仅供学习参考，请勿用于商业行为
  对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-stnb 概不负责。
  如果有更多文本内容想要修改，可以在<a href="/locales">本地化</a>中修改 zh 内容
  `

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.command('stnb <prompt:text>')
    .alias(config.cmd)
    .action(async ({ session, options },prompt) => {
      try{
        const time:number = parseInt(prompt.split(' ')[0])
        const bvs:number = parseInt(prompt.split(' ')[1])
        const mode:number = parseInt(prompt.split(' ')[2])
        if (!bvs) {
          return session.text('.nobvs')
        } 
        if (!time) {
          return session.text('.notime')
        }
        if (!mode) {
          return session.text('.nomode')
        }
        return compute(mode, time, bvs)
      }
      catch (err) {
        logger.warn(err)
        return String(err)
      }
    })
}
