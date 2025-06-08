import { Context, Schema, Logger } from 'koishi'
import * as saolei from './saolei'
import { resolve } from 'path';
import { readFileSync } from 'fs';
export const name = 'stnb'
export const logger = new Logger(name);

export const Rule: Schema<Rule> = Schema.object({
  platform: Schema.string().description('平台名称。').required(),
  channelId: Schema.string().description('频道 ID。').required(),
  guildId: Schema.string().description('群组 ID。'),
  selfId: Schema.string().description('机器人 ID。'),
})
export interface Rule {
  platform: string
  channelId: string
  selfId?: string
  guildId?: string
}

export interface Config {
  cmd: string
  rules: Rule[]
}
export const Config: Schema<Config> = Schema.object({
  cmd: Schema.string().default('斯坦牛逼').description('命令别名'),
  rules: Schema.array(Rule).description('推送规则。'),
})

export function compute(mode: number, time: number, bvs: number) {
  var cont: number = 435.001
  if (mode == 1) {
    cont = 47.229
  }
  if (mode == 2) {
    cont = 153.73
  }
  const st: number = cont / ((time ** 1.7) / (time * bvs))
  return st.toFixed(3)

};
export const usage = `${readFileSync(resolve(__dirname, '../readme.md')).toString('utf-8')}`

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh'))
  ctx.plugin(saolei)
  ctx.command('stnb <time:number> <bvs:number> <mode:number>', '扫雷stnb计算')
    .alias(config.cmd)
    .action(async ({ session }, ...prompt) => {
      try {
        const time: number = prompt?.[0]
        const bvs: number = prompt?.[1]
        let mode: number = prompt?.[2] ?? 3
        if (!bvs) {
          return session.text('.nobvs')
        }
        if (!time) {
          return session.text('.notime')
        }
        if (!mode) {
          return session.text('.nomode')
        }
        if (![1, 2, 3].includes(Number(mode))){
          mode = 3
        }
        return compute(mode, time, bvs)
      }
      catch (err) {
        logger.warn(err)
        return String(err)
      }
    })
}
