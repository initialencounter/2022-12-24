import { Context, Schema } from "koishi";
import HttpService from "./service/httpService";
import GameNewsProvider from "./service/gameNews";
import { HttpServiceConfig } from "./types/httpService";
import { GameNewsConfig } from "./types/gameNewsConfig";
import XiBao from "./service/xiBao";
import { XiBaoConfig } from "./types/xibao";
import ActiveMsg from "./service/activeMsg";
import PostListService from "./service/postList";
import { PostListConfig } from "./types/postList";
import TapsssAPI from "./service/api";
import PostStorage from "./service/postStorage";
import TapsssCommand from "./plugin/command";
import DailyStar from "./plugin/dailyStar";
import { DailyStarConfig } from "./types/dailyStarConfig";

class Tapsss {
  constructor(ctx: Context, config: Tapsss.Config) {
    ctx.plugin(HttpService, config.http);
    ctx.plugin(XiBao, config.xiBao);
    ctx.plugin(ActiveMsg);
    ctx.plugin(GameNewsProvider, config.gameNews);
    ctx.plugin(PostListService, config.postList);
    ctx.plugin(TapsssAPI);
    ctx.plugin(PostStorage);
    ctx.plugin(TapsssCommand);
    ctx.plugin(DailyStar, config.dailyStar);
  }
}

namespace Tapsss {
  export interface Config {
    http: HttpServiceConfig;
    gameNews: GameNewsConfig;
    xiBao: XiBaoConfig;
    postList: PostListConfig;
    dailyStar: DailyStarConfig;
  }

  export const Config: Schema<Config> = Schema.object({
    http: HttpServiceConfig.description('HTTP 服务配置。'),
    gameNews: GameNewsConfig.description('游戏资讯服务配置。'),
    xiBao: XiBaoConfig.description('喜报渲染配置。'),
    postList: PostListConfig.description('帖子推送配置。'),
    dailyStar: DailyStarConfig.description('今日之星配置。'),
  });
}

export default Tapsss
