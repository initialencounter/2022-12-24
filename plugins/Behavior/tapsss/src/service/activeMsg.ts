import { Context, Service } from "koishi"
import { Rule } from "../types/activeMsg"

class ActiveMsg extends Service {
  constructor(ctx: Context) {
    super(ctx, 'activeMsg');
  }

  async pushMessage(targets: Rule[], content: string) {
    for (let { channelId, platform, selfId, guildId } of targets) {
      if ((!guildId) || (!platform) || (!channelId)) {
        continue
      }
      if (!selfId) {
        const channel = (await this.ctx.database.getChannel(platform, channelId, ['assignee', 'guildId']))[0]
        if (!channel) return
        selfId = channel.assignee
        guildId = channel.guildId
      }
      const bot = this.ctx.bots[`${platform}:${selfId}`]
      await bot?.sendMessage(channelId, content, guildId)
    }
  }
}

export default ActiveMsg;
