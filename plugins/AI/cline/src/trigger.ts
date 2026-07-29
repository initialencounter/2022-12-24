import { Context, Session } from 'koishi'
import type { Config } from './config'

export const inject = ['clineAgent', 'markdownToImage']

/** 把引用消息的内容拼接到任务前面 */
function withQuote(session: Session, task: string): string {
  const quote = session.quote?.content?.trim()
  const content = task?.trim() ?? ''
  if (!quote) return content
  if (!content) return `引用消息:\n${quote}`
  return `引用消息:\n${quote}\n\n${content}`
}

export function apply(ctx: Context, config: Config) {
  ctx.command('cline [task:text]', '让 Agent 完成一个任务')
    .action(async ({ session }, task) => {
      if (!session) return '会话不存在'
      const content = withQuote(session, task)
      if (!content) return '请输入任务内容,例如:cline 列出当前目录的文件(也可以引用一条消息后再发送指令)'
      await ctx.clineAgent.run(session, content)
      return ''
    })

  ctx.command('cline.clear', '重置当前频道的 Agent 会话')
    .action(({ session }) => {
      if (!session) return '会话不存在'
      if (!ctx.clineAgent.hasSession(session.cid)) return '当前频道没有进行中的会话'
      ctx.clineAgent.clear(session.cid)
      return '已重置当前频道的 Agent 会话'
    })

  // 私聊 / @机器人 / 昵称 / 语音触发(指令消息由指令中间件优先处理,不会到达这里)
  ctx.inject(['sst'], (ctx) => {
    // 语音触发
    ctx.middleware(async (session, next) => {
      if (config.trigger.whisper) {
        const sst = (ctx as any).sst
        if (sst && session.elements?.some((el) => el.type === 'audio' || el.type === 'record')) {
          const text: string = await sst.audio2text(session)
          if (text) {
            await ctx.clineAgent.run(session, withQuote(session, text))
            return
          }
        }
      }
      return next()
    })
  })

  ctx.middleware(async (session, next) => {
    // 私聊触发
    if (config.trigger.private && session.channelId?.startsWith('private') && session.content) {
      await ctx.clineAgent.run(session, withQuote(session, session.content))
      return
    }
    // @机器人触发
    if (config.trigger.mention && session.stripped.appel && session.stripped.content) {
      await ctx.clineAgent.run(session, withQuote(session, session.stripped.content))
      return
    }
    // 昵称触发
    const text = session.content
    if (config.trigger.nickname.length && text) {
      const nickname = config.trigger.nickname.find((name) => text.startsWith(name))
      if (nickname) {
        const content = withQuote(session, text.slice(nickname.length))
        if (content) {
          await ctx.clineAgent.run(session, content)
          return
        }
      }
    }
    return next()
  })
}
