import { Context, h, Session } from 'koishi'
import { } from 'koishi-plugin-markdown-to-image-service'
import type { Config } from './config'

export interface RunStats {
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  reasoningTokenCount?: number
  totalCost?: number
  durationMs: number
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m${Math.round(seconds % 60)}s`
}

/** 生成附加在图片底部的统计信息(markdown 引用块) */
export function statsFooter(stats: RunStats): string {
  const parts: string[] = []
  const tokens: string[] = []
  if (stats.inputTokens) tokens.push(`输入 ${formatNumber(stats.inputTokens)}`)
  if (stats.outputTokens) tokens.push(`输出 ${formatNumber(stats.outputTokens)}`)
  if (stats.cacheReadTokens) tokens.push(`缓存 ${formatNumber(stats.cacheReadTokens)}`)
  if (tokens.length) parts.push(`🔢 Tokens:${tokens.join(' · ')}`)
  if (stats.totalCost) parts.push(`💰 费用:$${stats.totalCost.toFixed(4)}`)
  parts.push(`⏱️ 耗时:${formatDuration(stats.durationMs)}`)
  return `\n\n---\n\n> ${parts.join(' ｜ ')}`
}

/**
 * 将 markdown 渲染为图片发送;
 * markdownToImage 服务不可用或渲染失败时回退为纯文本。
 */
export async function sendRendered(ctx: Context, session: Session, markdown: string): Promise<void> {
  if (ctx.markdownToImage) {
    try {
      const buffer = await ctx.markdownToImage.convertToImage(markdown)
      await session.send(h.image(buffer, 'image/png'))
      return
    } catch (error) {
      ctx.logger('cline').warn('markdown 渲染失败,回退为纯文本', error)
    }
  }
  await session.send(markdown)
}

/** 超过阈值的文本渲染为图片发送,否则发送纯文本 */
export async function sendSmart(ctx: Context, session: Session, config: Config, text: string): Promise<void> {
  if (config.render.enabled && ctx.markdownToImage && text.length > config.render.threshold) {
    await sendRendered(ctx, session, text)
  } else {
    await session.send(text)
  }
}
