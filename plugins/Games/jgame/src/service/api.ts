import { Context, Service } from "koishi";
import { JGameAPIConfig } from "../types/api";
import { BattleList } from "../types";
import { prependBufferToStringTyped } from "../utils";

declare module 'koishi' {
  interface Context {
    jgameAPI: JGameAPI;
  }
}

class JGameAPI extends Service {
  headers: Record<string, string>;
  logger = this.ctx.logger('JGame API');
  pluginConfig: JGameAPIConfig
  constructor(ctx: Context, config: JGameAPIConfig) {
    super(ctx, 'jgameAPI');
    this.pluginConfig = config
    this.headers = { ...config.headers };
    ctx.on('ready', () => {
      this.logger.warn('JGame API 服务已启动');
    });
  }

  async makeHeaders(bodyLength: number, method: string, path: string) {
    const headers = this.pluginConfig.headers;
    headers['content-type'] = 'application/json';
    headers['content-length'] = bodyLength.toString();
    headers['accept-encoding'] = 'gzip'
    headers['scheme'] = 'https';
    headers['path'] = path;
    headers['method'] = method;
    // 可以在这里添加其他必要的头部信息
    return headers;

  }
  async fetchBattleList(scene: string, baton?: string): Promise<BattleList> {
    // 实现获取战斗列表的逻辑
    const bodyParams = { scene, filter: 'all' };
    if (baton) {
      bodyParams['baton'] = prependBufferToStringTyped(baton)
    }
    const body = JSON.stringify(bodyParams);
    const headers = await this.makeHeaders(body.length, 'POST', '/go/jgame/get_battle_list');
    const url = this.pluginConfig.baseURL + '/go/jgame/get_battle_list';
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers },
      body
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Promise<BattleList>;
  }

}

export default JGameAPI;
