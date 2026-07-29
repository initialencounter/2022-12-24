import { Context, h, segment, Service } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import { } from '@initencounter/vits'
import { } from 'koishi-plugin-markdown-to-image-service'
import { ModelUsage, Msg } from '../types/message'
import { modelUsageToRunStats, statsFooter } from '../utils'

declare module 'koishi' {
  interface Context {
    dvcRenderer: DvcRenderer
  }
}

export const OUTPUT_TYPES = ['quote', 'figure', 'image', 'minimal', 'voice']

export type OutputType = 'image' | 'quote' | 'figure' | 'minimal' | 'voice'

class DvcRenderer extends Service {
  static inject = {
    markdownToImage: { required: false },
    vits: { required: false },
  }

  output_type: string

  constructor(ctx: Context, config: { output: OutputType }) {
    super(ctx, 'dvcRenderer', true)
    this.output_type = config.output
  }

  /** 切换输出模式，返回是否合法 */
  setOutput(type: string): boolean {
    if (OUTPUT_TYPES.indexOf(type) === -1) return false
    this.output_type = type
    return true
  }

  /**
   * 按当前输出模式渲染回复
   * @param userId 用户QQ号
   * @param resp gpt返回的json
   * @returns 文字，图片或聊天记录
   */
  async render(
    userId: string,
    resp: Msg[],
    messageId: string,
    botId: string,
    usage: ModelUsage,
  ): Promise<string | segment> {
    if (this.output_type == 'voice' && this.ctx.vits)
      return this.ctx.vits.say({ input: resp[resp.length - 1].content })
    else if (this.output_type == 'quote')
      return h('quote', { id: messageId }) + resp[resp.length - 1].content
    else if (this.output_type == 'figure') {
      const result = segment('figure')
      for (var msg of resp) {
        if (msg.role == 'user') {
          result.children.push(
            segment(
              'message',
              {
                userId: userId,
                nickname: msg.role,
              },
              msg.content,
            ),
          )
          continue
        }
        if (msg.role == 'assistant') {
          result.children.push(
            segment(
              'message',
              {
                userId: botId,
                nickname: msg.role,
              },
              msg.content,
            ),
          )
        } else {
          result.children.push(
            segment(
              'message',
              {
                userId: userId,
                nickname: msg.role,
              },
              msg.content,
            ),
          )
        }
      }
      return result
    } else if (this.output_type == 'image' && this.ctx.markdownToImage) {
      const runStat = modelUsageToRunStats(usage)
      const footer = statsFooter(runStat)
      const buffer = await this.ctx.markdownToImage.convertToImage(
        resp[resp.length - 1].content + footer,
      )
      return h.image(buffer, 'image/png')
    } else {
      return h.text(resp[resp.length - 1].content)
    }
  }
}

export default DvcRenderer
