import { Context, Fragment, Next, segment, Session } from 'koishi'
import { } from '@initencounter/sst'
import { } from '../service/chat'
import { } from '../service/session'
import { } from '../service/personality'
import { BehaviorConfig } from '../types/config'

class DvcMiddleware {
  static inject = {
    dvc: { required: true },
    dvcSession: { required: true },
    dvcPersonality: { required: true },
    sst: { required: false },
  }

  private readonly pluginConfig: BehaviorConfig

  constructor(private ctx: Context, config: BehaviorConfig) {
    this.pluginConfig = config
    //at和私信触发对话的实现方法
    ctx.middleware(async (session, next) => {
      return this.middleware(session, next)
    })
  }

  /**
   * @param session 当前会话
   * @param next 通过函数
   * @returns 消息
   */
  async middleware(
    session: Session,
    next: Next,
  ): Promise<string | string[] | segment | void | Fragment> {
    // 语音触发
    if (!session.elements) return next()
    if (
      session.elements.filter((i) => i.type === 'audio' || i.type === 'record')
        .length > 0 &&
      this.pluginConfig.whisper &&
      this.ctx.sst
    ) {
      const text: string = await this.ctx.sst.audio2text(session)
      if (!text) return session.text('commands.dvc.messages.louder')
      return this.ctx.dvc.dvc(session, text)
    }
    // 私信触发
    if (session.subtype === 'private' && this.pluginConfig.private)
      return this.ctx.dvc.dvc(session, session.content ?? '')

    // 艾特触发
    if (session.stripped.appel && this.pluginConfig.mention) {
      let msg: string = ''
      for (let i of session.elements.slice(1)) {
        if (i.type === 'text') msg += i?.attrs?.content
      }
      return this.ctx.dvc.dvc(session, msg)
    }
    // 昵称触发
    if (this.pluginConfig.nickwake) {
      for (var i of this.ctx.dvcPersonality.names) {
        if (session.content && session.content.startsWith(i)) {
          if (session.userId)
            this.ctx.dvcSession.setPersonality(session.userId, i)
          return await this.ctx.dvc.dvc(session, session.content)
        }
      }
    }
    return next()
  }
}

export default DvcMiddleware
