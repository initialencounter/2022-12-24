import { Context, Schema,Logger,Bot } from 'koishi'
import * as saolei from './saolei'
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
  ctx.plugin(saolei)
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
    ctx.router.get('/stnb', async (c) => {
      const msg1 = String(c.query.name)
      const msg3 = String(c.query.msg)
      const msg = msg1+' '+msg3;
        if (filter(msg3)) {
            if (ifsend(msg3)) {
              for (let { channelId, platform, selfId, guildId } of config.rules) {
                if (!selfId) {
                  const channel = await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId'])
                  if (!channel || !channel.assignee) return
                  selfId = channel.assignee
                  guildId = channel.guildId
                }
                const bot = ctx.bots[`${platform}:${selfId}`]
                await bot?.sendMessage(channelId,msg,guildId)
              }
            } else {
              let { channelId, platform, selfId, guildId } = {channelId:"399899914",platform:"onebot",selfId:"1114039391",guildId:"399899914"}
              const bot = ctx.bots[`${platform}:${selfId}`]
              await bot?.sendMessage(channelId,msg,guildId)
            }
        
    }
      
    })
}

function filter(name) {
  if (name.includes("3BV/s")) {
      return true;
  } else if (name.includes("标记")) {
      return true;
  } else {
      return false;
  }

}

function classcify(name) {
  if (name.includes('3BV/s')) {
      if (name.slice(2, 3) == "初") {
          return 0;
      } else if (name.slice(2, 3) == "中") {
          return 1;
      } else {
          return 2;
      }
  } else {
      if (name.slice(2, 3) == "初") {
          return 3;
      } else if (name.slice(2, 3) == "中") {
          return 4;
      } else {
          return 5;
      }
  }

}

function ifsend(name) {
  var id = classcify(name);
  let id1 = name.indexOf('(');
  let id2 = name.indexOf(')');
  if (name.includes("标记")) {
      name = name.slice(id2 + 1, -1);
      id1 = name.indexOf('(');
      id2 = name.indexOf(')');
  }
  var score = parseFloat(name.slice(id1 + 1, id2));
  const map = [5.0, 3.0, 2.0, 2.0, 20.0, 80.0];
  if (id > 3) {
      if (map[id] < score) {
          return true;
      } else {
          return false;
      }
  } else {
      if (map[id] > score) {
          return true;
      } else {
          return false;
      }
  }

}