import { Context } from 'koishi'
import type { Config } from './config'

export function apply(ctx: Context, config: Config) {
  ctx.command('cline <task:text>', '让 Agent 完成一个任务')
    .action(async ({ session }, task) => {
      if (!task?.trim()) return '请输入任务内容,例如:cline 列出当前目录的文件'
      await ctx.clineAgent.run(session, task)
      return ''
    })

  ctx.command('cline.clear', '重置当前频道的 Agent 会话')
    .action(({ session }) => {
      if (!ctx.clineAgent.hasSession(session.cid)) return '当前频道没有进行中的会话'
      ctx.clineAgent.clear(session.cid)
      return '已重置当前频道的 Agent 会话'
    })

  // 私聊 / @机器人 触发(指令消息由指令中间件优先处理,不会到达这里)
  ctx.middleware(async (session, next) => {
    if (config.trigger.private && session.subtype === 'private' && session.content) {
      await ctx.clineAgent.run(session, session.content)
      return
    }
    if (config.trigger.mention && session.stripped.appel && session.stripped.content) {
      await ctx.clineAgent.run(session, session.stripped.content)
      return
    }
    return next()
  })
}
