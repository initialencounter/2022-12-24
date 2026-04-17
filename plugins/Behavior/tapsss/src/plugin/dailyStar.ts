import { Context, h } from "koishi";
import { } from "koishi-plugin-cron";
import { } from "../service/api";
import { } from "../service/activeMsg";
import { DailyStarConfig } from "../types/dailyStarConfig";
import { DailyStarResponse } from "../types/response/DailyStar";
import { render } from "../utils/renderRecord";
import { } from "../service/imageCache";
import { writeFileSync } from "fs";


class DailyStar {
  static inject = ['cron', 'tapsssAPI', 'activeMsg', 'canvas', 'imageCache'];
  constructor(private ctx: Context, config: DailyStarConfig) {
    ctx.cron('2 0 * * *', async () => {
      try {
        const dailyStar = await this.getDailyStar();
        if (!dailyStar) {
          ctx.logger('[Tapsss] DailyStar').error('Failed to fetch daily star: No data received');
          return;
        }
        const elements = h.image(dailyStar, 'image/png');
        await ctx.activeMsg.pushMessage(config.rules, elements)
      } catch (error) {
        console.error('Failed to fetch daily star:', error);
      }
    })
    ctx.command('今日之星', '获取今日之星')
      .action(async () => {
        const dailyStar = await this.getDailyStar()
        if (!dailyStar) return '获取今日之星失败';
        return h.image(dailyStar, 'image/png');
      })

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      ctx.on('ready', async () => {
        ctx.logger('[Tapsss] DailyStar').warn('DailyStar 服务已启动.');
        // 立即执行一次获取今日之星的任务
        try {
          const dailyStar = await this.getDailyStar();
          if (dailyStar)
          writeFileSync('dailyStar.png', dailyStar);
        } catch (error) {
          ctx.logger('[Tapsss] DailyStar').error('Failed to fetch daily star:', error);
        }
      });
    }
  };


  async getDailyStar(): Promise<Buffer | null> {
    const response: DailyStarResponse = await this.ctx.tapsssAPI.getStar();
    const avatar = await this.ctx.imageCache.fetchImage(response.data.user.avatar);
    if (!avatar) return null;
    return render(response.data, this.ctx.canvas, avatar);
  }

}

export default DailyStar;
