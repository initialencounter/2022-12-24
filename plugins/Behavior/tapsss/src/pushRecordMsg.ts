import { Context, h } from "koishi"

import { Schema } from "koishi"

export interface Rule {
  platform: string
  channelId: string
  selfId?: string
  guildId?: string
}

export const Rule: Schema<Rule> = Schema.object({
  platform: Schema.string().description('平台名称。').required(),
  channelId: Schema.string().description('频道 ID。').required(),
  guildId: Schema.string().description('群组 ID。'),
  selfId: Schema.string().description('机器人 ID。'),
})


export async function pushMessage(ctx: Context, targets: Rule[], content: string) {
  for (let { channelId, platform, selfId, guildId } of targets) {
    if ((!guildId) || (!platform) || (!channelId)) {
      continue
    }
    if (!selfId) {
      const channel = (await ctx.database.getChannel(platform, channelId, ['assignee', 'guildId']))[0]
      if (!channel) return
      selfId = channel.assignee
      guildId = channel.guildId
    }
    const bot = ctx.bots[`${platform}:${selfId}`]
    bot?.sendMessage(channelId, content, guildId)
  }
}
