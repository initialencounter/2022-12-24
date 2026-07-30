import { Context, Logger } from 'koishi'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { } from '@koishijs/plugin-console'
import { } from '../service/chatAPI'
import { } from '../service/session'
import { } from '../service/personality'
import { PersonalityConfig } from '../types/message'
import { APIConfig } from '../types/config'

const logger = new Logger('davinci-003')

const localUsage = readFileSync(resolve(__dirname, '../readme.md'))
  .toString('utf-8')
  .split('更新日志')[0]

declare module '@koishijs/plugin-console' {
  interface Events {
    'davinci-003/getusage'(): string
    'davinci-003/chatTest'(text: string): Promise<string>
    'davinci-003/addPersonality'(
      personality: PersonalityConfig,
    ): Promise<string>
  }
}

class DvcConsole {
  static inject = ['console', 'chatAPI', 'dvcSession', 'dvcPersonality']

  private readonly pluginConfig: APIConfig

  constructor(private ctx: Context, config: APIConfig) {
    this.pluginConfig = config

    ctx.console.addEntry({
      dev: resolve(__dirname, '../../client/index.ts'),
      prod: resolve(__dirname, '../../dist'),
    })

    ctx.console.addListener('davinci-003/chatTest', async (text: string) => {
      const date = new Date().toLocaleString()
      let status = { date }
      logger.info('user:' + text)
      let sessionid =
        'e2b5e6a3b58f06b914e5ede4d5737afb93afd0cc03f25d66e778bb733e589228'
      // 获得对话session
      let session_of_id = ctx.dvcSession.getChatSession(sessionid)
      // 设置本次对话内容
      session_of_id.push({
        role: 'user',
        content: `\n${text}，现在时间是：${JSON.stringify(status)}`,
      })
      // 与ChatGPT交互获得对话内容
      let { output: message } = await ctx.chatAPI.chat(session_of_id)

      // 记录上下文
      session_of_id.push({ role: 'assistant', content: message })

      ctx.dvcSession.sessions[sessionid] = session_of_id
      logger.info(`${this.pluginConfig.appointModel}返回内容: `)
      logger.info(message)
      return message
    })

    ctx.console.addListener('davinci-003/getusage', () => {
      return localUsage
    })

    ctx.console.addListener(
      'davinci-003/addPersonality',
      async (personality: PersonalityConfig) => {
        try {
          ctx.dvcPersonality.add(personality.name, personality.personality)
          return 'success'
        } catch (e) {
          return 'error' + e
        }
      },
    )
  }
}

export default DvcConsole
