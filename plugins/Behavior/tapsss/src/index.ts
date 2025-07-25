import { Context, Schema } from "koishi";
import { GameNewsConfig } from "./types/gameNewsConfig";
import XiBao from "./service/xiBao";
import { XiBaoConfig } from "./types/xibao";
import ActiveMsg from "./service/activeMsg";
import { PostListConfig } from "./types/postList";
import TapsssAPI from "./service/api";
import PostStorage from "./service/postStorage";
import TapsssCommand from "./plugin/command";
import DailyStar from "./plugin/dailyStar";
import { DailyStarConfig } from "./types/dailyStarConfig";
import { APIServiceConfig } from "./types/apiService";
import GameNewsProvider from "./plugin/gameNews";
import PostListService from "./plugin/postList";
import ImageCache from "./service/imageCache";

class Tapsss {
  static inject = {
    require: ['canvas', 'database',],
    optional: ['cron',]
  };
  constructor(ctx: Context, config: Tapsss.Config) {
    ctx.plugin(ImageCache);
    ctx.plugin(ActiveMsg);
    ctx.plugin(XiBao, config.xiBao);
    ctx.plugin(TapsssAPI, config.api);
    ctx.plugin(PostStorage);
    ctx.plugin(GameNewsProvider, config.gameNews);
    ctx.plugin(PostListService, config.postList);
    ctx.plugin(TapsssCommand);
    ctx.plugin(DailyStar, config.dailyStar);
  }
}

namespace Tapsss {
  export interface Config {
    api: APIServiceConfig;
    gameNews: GameNewsConfig;
    xiBao: XiBaoConfig;
    postList: PostListConfig;
    dailyStar: DailyStarConfig;
  }

  export const Config: Schema<Config> = Schema.object({
    api: APIServiceConfig.description('Tapsss API 服务配置。'),
    gameNews: GameNewsConfig.description('游戏资讯服务配置。'),
    xiBao: XiBaoConfig.description('喜报渲染配置。'),
    postList: PostListConfig.description('帖子推送配置。'),
    dailyStar: DailyStarConfig.description('今日之星配置。'),
  });
}

export default Tapsss
