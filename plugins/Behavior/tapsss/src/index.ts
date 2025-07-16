import { GameNews, Datum } from "./types/gameNews";
import { computeMD5 } from "./utils/md5";
import { Context, Schema } from "koishi";
import { HTTP } from "@koishijs/plugin-http";
import { extractJsonFromEncrypted, aesEcbEncrypt } from "./utils/aes";
import { render, XiBaoConfig } from "./xibao";
import { XiBaoConfigSchema } from "./xibao";
import { pushMessage, Rule } from "./pushRecordMsg";

class Tapsss {
  static inject = ['puppeteer'];
  http: HTTP;
  uid: string;
  token: string;
  decryptSecretKey: string
  encryptSecretKey: string
  private newsCheckTimer: NodeJS.Timeout | null = null;
  constructor(private ctx: Context, config: Tapsss.Config) {
    this.uid = config.headers.uid || '';
    this.token = config.headers.token || '';
    this.decryptSecretKey = config.decryptSecretKey;
    this.encryptSecretKey = config.encryptSecretKey;
    this.http = ctx.http.extend({
      baseURL: `http://${config.headers.Host}`,
      timeout: 5000, // 设置超时时间为 5 秒
      headers: ctx.config.headers as Tapsss.Config['headers'],
    });

    ctx.on('ready', async () => {
      this.startPeriodicNewsCheck(30 * 1000);
    });

    // 在插件销毁时清理定时器
    ctx.on('dispose', () => {
      this.stopPeriodicNewsCheck();
    });
  }

  flitterNewsByPushRecordConfig(newsText: string, recordType: number, config: Tapsss.Config['pushRecordConfig']): boolean {
    let mode: string = newsText.match(/(\d+x\d+)/)?.[1];
    let time = parseFloat(newsText.match(/\((\d+(\.\d+)?)\)/)?.[1] || '0');
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
      case 1:
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
      case 2:
        if (newsText.includes('盲')) {
          if (config.puzzle.blind[mode] >= time) return true;
        } else {
          if (config.puzzle.classic[mode] >= time) return true;
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


  makeApiKey(
    body: string,
    timeStamp: string = Date.now().toString(),
  ): string {
    const apiKey = computeMD5(this.uid + this.token + timeStamp + computeMD5(body) + "api");
    return apiKey;
  }



  /**
   * 获取游戏资讯
   * @param page 页码
   * @param count 每页数量
   */
  async postGameNews(page: number = 0, count: number = 20): Promise<GameNews> {
    const urlQuery = `page=${page}&count=${count}`;
    const body = aesEcbEncrypt(urlQuery, this.encryptSecretKey);
    const timeStamp = Date.now().toString();
    // const timeStamp = '1752668107525'; // 获取当前时间戳
    const apiKey = this.makeApiKey(body, timeStamp);
    const headers = this.http.config.headers;
    headers['time-stamp'] = timeStamp;
    headers['api-key'] = apiKey;
    headers['Content-Length'] = body.length.toString(); // 获取字符串长度
    headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=utf-8';
    // return
    try {
      const response = await fetch(`http://${headers['Host']}/Minesweeper/game/news`,
        {
          method: 'POST',
          headers: headers,
          body: body // 直接发送字符串
        });
      const cipher = await response.text();
      const plaintext = extractJsonFromEncrypted(cipher, this.decryptSecretKey) as string;
      const jsonStr = plaintext;
      const json = JSON.parse(jsonStr);
      return json as GameNews;
    } catch (error) {
      this.ctx.logger('GameNews').error('获取游戏资讯失败:', error);
      throw error;
    }
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
        const gameNews = await this.postGameNews(currentPage, 20);

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
          this.ctx.logger('GameNews').success(`发现 ${allNews.length} 条新游戏资讯\n`);
          allNews.forEach(async (news) => {
            this.ctx.logger('GameNews').success(this.formatNews(news));
            if (this.flitterNewsByPushRecordConfig(news.text, news.recordType, this.ctx.config.pushRecordConfig)) {
              const imgEle = await render(this.ctx, this.ctx.config.xiBaoConfig, this.formatNews(news))
              this.ctx.logger('GameNews').success(`符合推送条件: ${news.text}`);
              await pushMessage(this.ctx, this.ctx.config.rules, imgEle);
            }
          });

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
    let recordType = ''
    let recordTypeEn = ''
    switch (news.recordType) {
      case 0:
        recordType = '';
        recordTypeEn = '';
        break;
      case 1:
        recordType = '舒尔特方格';
        recordTypeEn = '[SchulteGrid]';
        break;
      case 2:
        recordType = '数字华容道';
        recordTypeEn = '[Puzzle]';
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
    let newsText = news.text;
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

namespace Tapsss {
  export interface Config {
    headers: {
      device: string;
      version: string;
      channel: string;
      language: string;
      token?: string;
      uid?: string;
      'time-stamp'?: string;
      'api-key'?: string;
      'Content-Type'?: string;
      'Content-Length'?: string;
      Host: string;
      Connection: string;
      'Accept-Encoding': string;
      'User-Agent': string;
    };
    decryptSecretKey: string;
    encryptSecretKey: string;
    pushRecordConfig: {
      minesweeper: {
        classic: {
          time: {
            beg: number;
            int: number;
            exp: number;
          },
          bvs: {
            beg: number;
            int: number;
            exp: number;
          }
        },
        endless: number;
      },
      schulteGrid: {
        simple: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
          '6x6': number,
          '7x7': number,
          '8x8': number,
          '9x9': number,
          '10x10': number,
        },
        classic: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
          '6x6': number,
          '7x7': number,
          '8x8': number,
          '9x9': number,
          '10x10': number,
        },
        simpleDisrupt: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
          '6x6': number,
          '7x7': number,
          '8x8': number,
          '9x9': number,
          '10x10': number,
        },
        classicDisrupt: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
          '6x6': number,
          '7x7': number,
          '8x8': number,
          '9x9': number,
          '10x10': number,
        },
      },
      puzzle: {
        classic: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
          '6x6': number,
          '7x7': number,
          '8x8': number,
          '9x9': number,
          '10x10': number,
        },
        blind: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
          '6x6': number,
          '7x7': number,
          '8x8': number,
          '9x9': number,
          '10x10': number,
        },

      },
      '2048': {
        time: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
        },
        score: {
          '3x3': number,
          '4x4': number,
          '5x5': number,
        }
      },
      nonoSweeper: {
        beg: number;
        int: number;
        exp: number;
        exxp: number;
      }
    }
    xiBaoConfig: XiBaoConfig;
    rules: Rule[];
  }
  export const Config: Schema<Config> = Schema.object({
    headers: Schema.object({
      device: Schema.string().default('OPD2413').description('设备型号'),
      version: Schema.string().default('30610').description('联萌版本号'),
      channel: Schema.string().default('App'),
      language: Schema.string().default('zh').description('语言'),
      token: Schema.string().default('').description('账号登录 token'),
      uid: Schema.string().default('').description('联萌账号 uid'),
      Host: Schema.string().default('minesweeper.natapp1.cc').description('联萌服务器域名'),
      Connection: Schema.string().default('Keep-Alive'),
      'Accept-Encoding': Schema.string().default('gzip'),
      'User-Agent': Schema.string().default('okhttp/4.7.2'),
    }).description('请求头信息'),
    decryptSecretKey: Schema.string().required(true).description('联萌解密密钥'),
    encryptSecretKey: Schema.string().required(true).description('联萌加密密钥'),
    pushRecordConfig: Schema.object({
      minesweeper: Schema.object({
        classic: Schema.object({
          time: Schema.object({
            beg: Schema.number().default(1).description('初级时间阈值'),
            int: Schema.number().default(15).description('中级时间阈值'),
            exp: Schema.number().default(60).description('高级时间阈值'),
          }),
          bvs: Schema.object({
            beg: Schema.number().default(7).description('初级3BV/s阈值'),
            int: Schema.number().default(4).description('中级3BV/s阈值'),
            exp: Schema.number().default(3).description('高级3BV/s阈值'),
          })
        }),
        endless: Schema.number().default(55).description('无尽模式关卡阈值'),
      }).description('扫雷推送配置'),
      schulteGrid: Schema.object({
        simple: Schema.object({
          '3x3': Schema.number().default(1.1),
          '4x4': Schema.number().default(2.2),
          '5x5': Schema.number().default(4.2),
          '6x6': Schema.number().default(9),
          '7x7': Schema.number().default(17),
          '8x8': Schema.number().default(30),
          '9x9': Schema.number().default(50),
          '10x10': Schema.number().default(90),
        }).description('简单模式'),
        classic: Schema.object({
          '3x3': Schema.number().default(1.1),
          '4x4': Schema.number().default(2.2),
          '5x5': Schema.number().default(4.4),
          '6x6': Schema.number().default(10),
          '7x7': Schema.number().default(20),
          '8x8': Schema.number().default(50),
          '9x9': Schema.number().default(100),
          '10x10': Schema.number().default(140),
        }).description('普通模式'),
        simpleDisrupt: Schema.object({
          '3x3': Schema.number().default(3.2),
          '4x4': Schema.number().default(7),
          '5x5': Schema.number().default(13),
          '6x6': Schema.number().default(23),
          '7x7': Schema.number().default(38),
          '8x8': Schema.number().default(60),
          '9x9': Schema.number().default(100),
          '10x10': Schema.number().default(140),
        }).description('简单打乱模式'),
        classicDisrupt: Schema.object({
          '3x3': Schema.number().default(3.8),
          '4x4': Schema.number().default(8.4),
          '5x5': Schema.number().default(17),
          '6x6': Schema.number().default(32),
          '7x7': Schema.number().default(60),
          '8x8': Schema.number().default(94),
          '9x9': Schema.number().default(150),
          '10x10': Schema.number().default(240),
        }).description('打乱模式'),
      }).description('舒尔特方格推送配置'),
      puzzle: Schema.object({
        classic: Schema.object({
          '3x3': Schema.number().default(0.3),
          '4x4': Schema.number().default(2),
          '5x5': Schema.number().default(7),
          '6x6': Schema.number().default(18),
          '7x7': Schema.number().default(30),
          '8x8': Schema.number().default(60),
          '9x9': Schema.number().default(90),
          '10x10': Schema.number().default(120),
        }).description('普通模式'),
        blind: Schema.object({
          '3x3': Schema.number().default(0.3),
          '4x4': Schema.number().default(3),
          '5x5': Schema.number().default(9),
          '6x6': Schema.number().default(36),
          '7x7': Schema.number().default(60),
          '8x8': Schema.number().default(120),
          '9x9': Schema.number().default(180),
          '10x10': Schema.number().default(240),
        }).description('盲拼模式'),
      }).description('数字华容道推送配置'),
      '2048': Schema.object({
        time: Schema.object({
          '3x3': Schema.number().default(12),
          '4x4': Schema.number().default(90),
          '5x5': Schema.number().default(560),
        }).description('时间模式'),
        score: Schema.object({
          '3x3': Schema.number().default(6600),
          '4x4': Schema.number().default(280000),
          '5x5': Schema.number().default(2000000),
        }).description('分数模式'),
      }).description('2048推送配置'),
      nonoSweeper: Schema.object({
        beg: Schema.number().default(2).description('初级'),
        int: Schema.number().default(20).description('中级'),
        exp: Schema.number().default(80).description('高级'),
        exxp: Schema.number().default(240).description('专家'),
      }).description('数织推送配置'),
    }).description('推送纪录配置'),
    xiBaoConfig: XiBaoConfigSchema,
    rules: Schema.array(Rule).description('推送规则。'),
  });
}

export default Tapsss
