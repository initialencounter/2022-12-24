import { Context, Service } from "koishi";
import { Datum, GameNews } from "../types/gameNews";
import HttpService from "./httpService";
import { GameNewsConfig } from "../types/gameNewsConfig";
import XiBao from "./xiBao";
import ActiveMsg from "./activeMsg";

declare module 'koishi' {
  interface Context {
    httpService: HttpService;
    xiBao: XiBao;
    activeMsg: ActiveMsg;
  }
}

class GameNewsProvider extends Service {
  static inject = ['xiBao', 'httpService', 'activeMsg'];
  private newsCheckTimer: NodeJS.Timeout | null = null;
  private readonly pluginConfig: GameNewsConfig;
  constructor(ctx: Context, config: GameNewsConfig) {
    super(ctx, 'gameNews')
    this.pluginConfig = config;

    ctx.on('ready', async () => {
      this.startPeriodicNewsCheck(30 * 1000);
    });

    // 在插件销毁时清理定时器
    ctx.on('dispose', () => {
      this.stopPeriodicNewsCheck();
    });
  }
  flitterNewsByPushRecordConfig(newsText: string, recordType: number): boolean {
    const config = this.pluginConfig.passLine;
    let mode: string = newsText.match(/(\d+x\d+)/)?.[1];
    let time = parseFloat(newsText.match(/\((\d+(\.\d+)?)\)/)?.[1] || '0');
    if (newsText.includes('平均') || newsText.includes('连拧')) return false;
    switch (recordType) {
      case 0: // 扫雷
        if (newsText.includes('无尽') || newsText.includes('Endless')) {
          const level = newsText.match(/第(\d+)\s*关/)?.[1];
          return level ? parseInt(level) >= config.minesweeper.endless : false;
        } else {
          if (newsText.includes('时间纪录')) {
            if (newsText.includes('初级')) {
              return time <= config.minesweeper.classic.time.beg;
            } else if (newsText.includes('中级')) {
              return time <= config.minesweeper.classic.time.int;
            } else if (newsText.includes('高级')) {
              return time <= config.minesweeper.classic.time.exp;
            }
          } else {
            if (newsText.includes('初级')) {
              return time >= config.minesweeper.classic.bvs.beg;
            }
            else if (newsText.includes('中级')) {
              return time >= config.minesweeper.classic.bvs.int;
            }
            else if (newsText.includes('高级')) {
              return time >= config.minesweeper.classic.bvs.exp;
            }
          }
        }
        return false;
      case 1: // 华容道
        if (newsText.includes('盲')) {
          if (config.puzzle.blind[mode] >= time) return true;
        } else {
          if (config.puzzle.classic[mode] >= time) return true;
        }
        return false;
      case 2:
        if (newsText.includes('打乱')) {
          if (newsText.includes('简单')) {
            if (config.schulteGrid.simpleDisrupt[mode] >= time) return true
          } else {
            if (config.schulteGrid.classicDisrupt[mode] >= time) return true
          }
        } else {
          if (newsText.includes('简单')) {
            if (config.schulteGrid.simple[mode] >= time) return true;
          } else {
            if (config.schulteGrid.classic[mode] >= time) return true;
          }
        }
        return false;
      case 3:
        if (newsText.includes('时间纪录')) {
          if (config['2048'].time[mode] >= time) return true;
        }
        if (newsText.includes('分数纪录')) {
          const score = parseInt(newsText.match(/分数纪录\((\d+)/)?.[1] || '0');
          if (config['2048'].score[mode] <= score) return true;
        }
        return false;
      default:
        if (newsText.includes('初级')) {
          return time <= config.nonoSweeper.beg;
        } else if (newsText.includes('中级')) {
          return time <= config.nonoSweeper.int;
        } else if (newsText.includes('高级')) {
          return time <= config.nonoSweeper.exp;
        } else if (newsText.includes('专家')) {
          return time <= config.nonoSweeper.exxp;
        }
        return false;
    }
  }

  /**
     * 获取游戏资讯
     * @param page 页码
     * @param count 每页数量
     */
  async postGameNews(params: { page: number, count: number }): Promise<GameNews> {
    const path = '/Minesweeper/game/news';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<GameNews>(path, method, params);
  }

  /**
   * 获取所有新的游戏资讯
   * @param lastRecordId 上次纪录的最大ID
   * @param isFirstTime 是否为首次获取（首次只获取第一页用于初始化）
   * @returns 返回所有新的游戏资讯和更新后的最大ID
   */
  async getAllGameNews(lastRecordId: number = 0, isFirstTime: boolean = false): Promise<{ allNews: Datum[], maxRecordId: number }> {
    const allNews: Datum[] = [];
    let currentPage = 0;
    let maxRecordId = lastRecordId;
    let hasMoreNews = true;

    while (hasMoreNews) {
      try {
        this.ctx.logger('GameNews').debug(`正在获取第 ${currentPage + 1} 页...`);
        const gameNews = await this.postGameNews({ page: currentPage, count: 20 });

        if (!gameNews.data) {
          this.ctx.logger('GameNews').warn("获取游戏资讯失败，数据格式不正确");
          break;
        }

        if (gameNews.data.length === 0) {
          this.ctx.logger('GameNews').debug("没有更多游戏资讯");
          break;
        }

        // 如果是首次获取，只处理第一页并设置初始ID
        if (isFirstTime) {
          this.ctx.logger('GameNews').debug("首次获取，只处理第一页用于初始化");
          // 首次获取时，纪录最新的ID作为起点，不添加任何资讯到结果中
          maxRecordId = gameNews.data[0].id;
          this.ctx.logger('GameNews').debug(`初始化最大ID: ${maxRecordId}`);
          break;
        }

        // 检查最后一个资讯的ID（最旧的）
        const lastNewsInPage = gameNews.data[gameNews.data.length - 1];

        // 如果最后一个ID小于等于上次纪录的ID，说明没有更多新资讯了
        if (lastNewsInPage.id <= lastRecordId) {
          // 只添加ID大于lastRecordId的新资讯
          const newNewsInPage = gameNews.data.filter(news => news.id > lastRecordId);
          allNews.push(...newNewsInPage);

          // 更新最大ID（第一个是最新的，ID最大）
          if (newNewsInPage.length > 0) {
            maxRecordId = Math.max(maxRecordId, newNewsInPage[0].id);
          }

          hasMoreNews = false;
        } else {
          // 只添加ID大于lastRecordId的新资讯，避免重复
          const newNewsInPage = gameNews.data.filter(news => news.id > lastRecordId);
          allNews.push(...newNewsInPage);

          // 更新最大ID（第一个是最新的，ID最大）
          maxRecordId = Math.max(maxRecordId, gameNews.data[0].id);

          currentPage++;
        }

        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        this.ctx.logger('GameNews').error(`获取第 ${currentPage + 1} 页游戏资讯失败:`, error);
        break;
      }
    }

    this.ctx.logger('GameNews').debug(`共获取到 ${allNews.length} 条新游戏资讯，最大ID: ${maxRecordId}`);
    return { allNews, maxRecordId };
  }

  /**
   * 启动定期检查新游戏资讯
   * @param intervalMs 检查间隔（毫秒），默认5秒
   */
  startPeriodicNewsCheck(intervalMs: number = 5 * 1000) {
    // 如果已有定时器，先清除它
    this.stopPeriodicNewsCheck();

    let latestRecordId = 0;
    let isFirstCheck = true;

    const checkNews = async () => {
      try {
        this.ctx.logger('GameNews').debug(`开始定期检查游戏资讯，当前最新纪录ID: ${latestRecordId}`);
        const { allNews, maxRecordId } = await this.getAllGameNews(latestRecordId, isFirstCheck);

        if (isFirstCheck) {
          this.ctx.logger('GameNews').debug(`首次初始化，设置起始ID: ${maxRecordId}`);
          isFirstCheck = false;
        } else if (allNews.length > 0) {
          for (const news of allNews) {
            this.ctx.logger('GameNews').success(this.formatNews(news));
            if (this.flitterNewsByPushRecordConfig(news.text, news.recordType)) {
              const imgEle = await this.ctx.xiBao.render(this.formatNews(news))
              this.ctx.logger('GameNews').success(`符合推送条件: ${news.text}`);
              await this.ctx.activeMsg.pushMessage(this.pluginConfig.rules, imgEle);
            }
          }

          // 这里可以添加推送通知逻辑
          // 例如：向特定频道发送消息
        } else {
          this.ctx.logger('GameNews').debug("没有新的游戏资讯");
        }

        latestRecordId = maxRecordId;
      } catch (error) {
        this.ctx.logger('GameNews').error("定期检查游戏资讯失败:", error);
      }
    };

    // 立即执行一次（首次初始化）
    checkNews();

    // 设置定期检查
    this.newsCheckTimer = setInterval(checkNews, intervalMs);
    this.ctx.logger('GameNews').info(`已启动游戏资讯定期检查，间隔: ${intervalMs / 1000}秒`);
  }

  formatNews(news: Datum): string {
    let recordType: string
    let recordTypeEn: string
    switch (news.recordType) {
      case 0:
        recordType = '';
        recordTypeEn = '';
        break;
      case 1:
        recordType = '数字华容道';
        recordTypeEn = '[Puzzle]';
        break;
      case 2:
        recordType = '舒尔特方格';
        recordTypeEn = '[SchulteGrid]';
        break;
      case 3:
        recordType = '';
        recordTypeEn = '';
        break;
      default:
        recordType = '数织';
        recordTypeEn = '[NonoSweeper]';
        break;
    }
    let newsText: string;
    if (news.text.startsWith('Make')) {
      newsText = `${recordTypeEn} ${news.user.nickName} ${news.text}`;
    } else {
      newsText = `${news.user.nickName}刷新${recordType}${news.text.slice(2)}`;
    }
    return newsText.trim();
  }


  /**
   * 停止定期检查新游戏资讯
   */
  stopPeriodicNewsCheck() {
    if (this.newsCheckTimer) {
      clearInterval(this.newsCheckTimer);
      this.newsCheckTimer = null;
      this.ctx.logger('GameNews').info('已停止游戏资讯定期检查');
    }
  }
}

export default GameNewsProvider;
