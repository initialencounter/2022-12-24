import { Context, Schema } from "koishi";
import HttpService from "./service/httpService";
import GameNewsProvider from "./service/gameNews";
import { HttpServiceConfig } from "./types/httpService";
import { GameNewsConfig } from "./types/gameNewsConfig";
import XiBao from "./service/xiBao";
import { XiBaoConfig } from "./types/xibao";
import ActiveMsg from "./service/activeMsg";
import { Rule } from "./types/activeMsg";

class Tapsss {
  constructor(ctx: Context, config: Tapsss.Config) {
    ctx.plugin(HttpService, config.http);
    ctx.plugin(XiBao, config.xiBao);
    ctx.plugin(ActiveMsg);
    ctx.plugin(GameNewsProvider, config.gameNews);
  }
}

namespace Tapsss {
  export interface Config {
    http: HttpServiceConfig;
    gameNews: GameNewsConfig;
    xiBao: XiBaoConfig;
  }
  export const Config: Schema<Config> = Schema.object({
    http: HttpServiceConfig.description('HTTP 服务配置。'),
    gameNews: GameNewsConfig.description('游戏资讯服务配置。'),
    xiBao: XiBaoConfig.description('喜报渲染配置。'),
  });
}

export default Tapsss
