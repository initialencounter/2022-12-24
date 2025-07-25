import { Context, h } from "koishi";
import { } from "koishi-plugin-cron";
import { } from "../service/api";
import { } from "../service/activeMsg";
import { } from "koishi-plugin-puppeteer";
import { DailyStarConfig } from "../types/dailyStarConfig";
import { DailyStarResponse } from "../types/response/DailyStar";
import { render } from "../utils/renderRecord";
import { } from "../service/imageCache";


class DailyStar {
  static inject = ['cron', 'tapsssAPI', 'activeMsg', 'canvas', 'imageCache'];
  constructor(private ctx: Context, config: DailyStarConfig) {
    ctx.cron('2 0 * * *', async () => {
      try {
        const dailyStar = await this.getDailyStar();
        const elements = h.image(dailyStar, 'image/png');
        await ctx.activeMsg.pushMessage(config.rules, elements)
      } catch (error) {
        console.error('Failed to fetch daily star:', error);
      }
    })
    ctx.command('今日之星', '获取今日之星')
      .action(async () => {
        const dailyStar = await this.getDailyStar()
        return h.image(dailyStar, 'image/png');
      })
  };


  async getDailyStar(): Promise<Buffer> {
    const response: DailyStarResponse = await this.ctx.tapsssAPI.getStar();
    const avatar = await this.ctx.imageCache.fetchImage(response.data.user.avatar);
    return render(response.data, this.ctx.canvas, avatar);
  }

}

export default DailyStar;
