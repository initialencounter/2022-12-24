import { Context, Schema, Session } from 'koishi'

declare module 'koishi' {
  interface Tables {
    auto_reply: Schedule
  }
}

export interface Schedule {
  id: number
  rules: string
  reply: any
  lastCall: Date
  add_user: string
}

export const len = async (ctx: Context) => {
  const data: any = await ctx.database.get('auto_reply',{},['id'])
  const len: number = data.length
  return len
}

export const rule_update = async (ctx: Context) => {
  let arr: string[] = []
  const data_len: number = await len(ctx)
  for (var idx = 1; idx < data_len + 1; idx++) {
    var rule_fild: {} = await ctx.database.get('auto_reply', { id: [idx] }, ["rules"])
    var rule:string = String(rule_fild[0].rules)
    if (rule) {
      arr.push(rule)
    }
  }
  return arr
}

export const add_data = async (ctx: Context, session: Session, prompt: string, split_str) => {
  try {
    const que: string = prompt.split(split_str)[0]
    const ans: string = prompt.split(split_str)[1]
    const data_len: number = await len(ctx)
    const rules_arr: string[] = await rule_update(ctx)
    if (rules_arr.includes(que)) {
      return '规则重复'
    }
    await ctx.database.create('auto_reply', { rules: que, reply: ans, lastCall: new Date(), add_user: session.userId })
    return 'success to add'
  }
  catch (err) {
    log(err)
    return String(err)
  }
}

export const name = 'auto-reply'

export const log = (s: any) => { console.log(s) }

export interface Config {
  split_str: string
  min_authority: number
  cmd: string
}

export const Config: Schema<Config> = Schema.object({
  split_str: Schema.string().default('#').description('规则的分隔符'),
  min_authority: Schema.number().default(1).description('添加回复规则的最低权限,ps:权限在控制台-数据库中修改权限'),
  cmd:Schema.string().default('set').description('添加规则的触发命令')
})

export async function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh'))
  // 初始化数据库
  ctx.model.extend('auto_reply', {
    // 各字段类型
    id: 'unsigned',
    rules: 'text',
    reply: 'text',
    lastCall: 'timestamp',
    add_user: 'string',
  }, {
    // 使用自增的主键值
    autoInc: true,
  })

  ctx.middleware(async (session, next) => {
    const rules_arr: string[] = await rule_update(ctx)
    // log(rules_arr)
    for (var i in rules_arr) {
      if (rules_arr[i].indexOf(String(session.content)) != -1) {
        var ans_json: {} = await ctx.database.get('auto_reply', { rules: [session.content] }, ['reply'])
        var ans: string = ans_json[0].reply
        return ans
      }
    }
    return next()
  })

  //添加规则
  ctx.command('ar <rule:string>', { authority: config.min_authority })
    .alias(config.cmd)
    .action(async ({ session}, prompt) => {
      //判断规则是否合法
      log(session.content)
      if (session.content.indexOf(config.split_str) == -1) {
        return session.text('.bad-rule',[config.split_str])
      }
      const add_msg: string = await add_data(ctx, session, prompt, config.split_str)
      //判断规则是否添加成功
      if (add_msg == 'success to add') {
        return session.text('.success')
      } else {
        return session.text('.failure',[add_msg])
      }
    })
}
