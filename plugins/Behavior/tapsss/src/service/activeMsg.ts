import { Context, h, Service } from "koishi"
import { Rule } from "../types/activeMsg"

declare module 'koishi' {
  interface Context {
    activeMsg: ActiveMsg;
  }
}

class ActiveMsg extends Service {
  constructor(ctx: Context) {
    super(ctx, 'activeMsg');
  }

  async pushMessage(targets: Rule[], content: h): Promise<string[]> {
    const results: string[] = [];
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
      const messageId = await bot?.sendMessage(channelId, content, guildId)
      //@ts-ignore
      results.push(messageId[0]);
      console.log(`Message sent to ${platform} channel ${channelId} by bot ${selfId}: ${messageId}`);
    }
    return results;
  }
}

export default ActiveMsg;
