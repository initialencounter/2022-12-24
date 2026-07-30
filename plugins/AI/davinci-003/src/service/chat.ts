import { Context, Element, h, Logger, segment, Service, Session, User } from 'koishi'
import { getUsage } from 'koishi-plugin-rate-limit'
import { } from '@koishijs/censor'
import { } from './chatAPI'
import { } from './renderer'
import { DvcPluginConfig } from '../types/config'
import { ModelUsage } from '../types/message'
import { recall } from '../utils'
import { SHARED_SESSION_ID } from './session'

const logger = new Logger('davinci-003')

declare module 'koishi' {
  interface Context {
    dvc: DVc
  }
}

class DVc extends Service {
  static inject = {
    chatAPI: { required: true },
    dvcSession: { required: true },
    dvcRenderer: { required: true },
    database: { required: true },
    censor: { required: false },
  }

  private readonly pluginConfig: DvcPluginConfig

  constructor(ctx: Context, config: DvcPluginConfig) {
    super(ctx, 'dvc', true)
    this.pluginConfig = config
  }

  /**
   * 对话入口：黑名单、次数限制、等待消息、文本审核
   * @param session 会话
   * @param prompt 会话内容
   * @returns Promise<string | Element>
   */
  async dvc(
    session: Session,
    prompt: string,
  ): Promise<string | Element | void> {
    if (!session.userId || !session.channelId || !session.messageId) return
    const { behavior, filter } = this.pluginConfig
    // 黑名单拦截
    if (
      filter.blockuser.includes(session.userId) ||
      filter.blockchannel.includes(session.channelId)
    )
      return
    // 限制调用次数
    if (!behavior.superuser.includes(session.userId)) {
      let user: User = await this.ctx.database.getUser(
        session.platform,
        session.userId,
      )
      let usage = getUsage('ai', user)
      if (behavior.usage && usage > behavior.usage)
        return session.text('commands.dvc.messages.usage-exhausted')
    }
    // 内容为空
    if (!prompt && !session.quote?.content)
      return session.text('commands.dvc.messages.no-prompt')
    if (prompt.length > behavior.max_tokens)
      return session.text('commands.dvc.messages.tooLong')
    // 发送等待消息
    if (behavior.waiting) {
      const msgId = (
        await session.bot.sendMessage(
          session.channelId,
          h('quote', { id: session.messageId }) +
          session.text('commands.dvc.messages.thinking'),
          session.guildId,
        )
      )[0]
      if (behavior.recall)
        await recall(session, msgId, behavior.recall_time)
    }
    // 文本审核
    if (this.ctx.censor)
      prompt = await this.ctx.censor.transform(prompt, session)
    // 启用/关闭上下文
    if (!this.pluginConfig.api.enableContext) {
      const { output: text, usage } = await this.ctx.chatAPI.chat([
        { role: 'user', content: prompt },
      ])
      const resp = [
        { role: 'user', content: prompt },
        { role: 'assistant', content: text },
      ]
      return await this.ctx.dvcRenderer.render(
        session.userId,
        resp,
        session.messageId,
        session.bot.selfId,
        usage,
      )
    } else {
      return await this.chat(prompt, session.userId, session)
    }
  }

  /**
   * 带上下文的对话
   * @param msg prompt消息
   * @param sessionid QQ号
   * @param session 会话
   * @returns json消息
   */
  async chat(
    msg: string,
    sessionid: string,
    session: Session,
  ): Promise<string | segment> {
    let name = session.author?.nick || session.username
    logger.info(name + ': ' + msg)
    if (this.pluginConfig.behavior.onlyOneContext) sessionid = SHARED_SESSION_ID
    // 获得对话session
    let session_of_id = this.ctx.dvcSession.getChatSession(sessionid)
    let message: string
    let usage: ModelUsage = {}
    // 设置本次对话内容
    if (
      session_of_id[session_of_id.length - 1].role === 'user' &&
      this.pluginConfig.api.baseURL.includes('api.deepseek.com')
    ) {
      message = 'deepseek 不支持重复的 user, 请等待上一次对话结束'
    } else {
      let rawMsg = { role: 'user', content: msg }
      session_of_id.push(rawMsg)
      // 与ChatGPT交互获得对话内容
      const { output, usage: _usage } = await this.ctx.chatAPI.chat(session_of_id)
      message = output
      usage = _usage
    }

    // 记录上下文
    if (
      session_of_id[session_of_id.length - 1].role !== 'assistant' ||
      !this.pluginConfig.api.baseURL.includes('api.deepseek.com')
    ) {
      session_of_id.push({ role: 'assistant', content: message })
    }

    this.ctx.dvcSession.sessions[sessionid] = session_of_id
    logger.info('ChatGPT返回内容: ')
    logger.info(message)
    return await this.ctx.dvcRenderer.render(
      sessionid,
      session_of_id,
      session.messageId ?? '',
      session.bot.selfId,
      usage,
    )
  }

  /**
   * AI 翻译
   * @param lang 目标语言
   * @param prompt 要翻译的内容
   * @returns 翻译后的内容
   */
  async translate(lang: string, prompt: string): Promise<string> {
    return (
      await this.ctx.chatAPI.chat([
        {
          role: 'system',
          content:
            '你是一个翻译引擎，请将文本翻译为' +
            lang +
            '，只需要翻译不需要解释。',
        },
        {
          role: 'user',
          content: `请帮我我将如下文字翻译成${lang},“${prompt}”`,
        },
      ])
    ).output
  }
}

export default DVc
