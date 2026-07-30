import { Context, Logger, Schema } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { } from '@initencounter/vits'
import { } from '@initencounter/sst'
import { } from '@koishijs/censor'
import { } from '@koishijs/plugin-console'
import { } from 'koishi-plugin-markdown-to-image-service'
import { APIConfig, BehaviorConfig, DvcPluginConfig, FilterConfig } from './types/config'
import ChatAPI from './service/chatAPI'
import DvcSession from './service/session'
import DvcPersonality from './service/personality'
import DvcRenderer from './service/renderer'
import DVc from './service/chat'
import DvcCommand from './plugin/command'
import DvcMiddleware from './plugin/middleware'
import DvcConsole from './plugin/console'

const name = 'davinci-003'
const logger = new Logger(name)

class Davinci003 {
  static inject = {
    console: { required: true },
    database: { required: true },
    vits: { required: false },
    sst: { required: false },
    censor: { required: false },
    markdownToImage: { required: false },
  }

  constructor(ctx: Context, config: Davinci003.Config) {
    ctx.i18n.define('zh', require('./locales/zh'))

    ctx.on('ready', () => {
      if (!ctx.markdownToImage && config.behavior.output == 'image')
        logger.warn('未启用 markdownToImage，将无法发送图片消息')
      if (!ctx.vits && config.behavior.output == 'voice')
        logger.warn('未启用 vits，将无法输出语音')
    })

    // 服务层
    ctx.plugin(ChatAPI, {
      ...config.api,
      temperature: config.behavior.temperature,
      enableReasoningContent: config.behavior.enableReasoningContent,
    })
    ctx.plugin(DvcPersonality)
    ctx.plugin(DvcSession)
    ctx.plugin(DvcRenderer, { output: config.behavior.output, max_tokens: config.behavior.max_tokens })
    ctx.plugin(DVc, config)

    // 插件层
    ctx.plugin(DvcCommand, config)
    ctx.plugin(DvcMiddleware, config.behavior)
    ctx.plugin(DvcConsole, config.api)
  }
}

namespace Davinci003 {
  export interface Config extends DvcPluginConfig { }

  export const Config: Schema<Config> = Schema.object({
    api: APIConfig.description('API 服务配置。'),
    behavior: BehaviorConfig.description('进阶设置。'),
    filter: FilterConfig.description('过滤器。'),
  })
}

export default Davinci003
