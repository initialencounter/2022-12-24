import { Context, Service } from "koishi";
import { JGameAPIConfig } from "../types/api";
import { BattleList } from "../types";
import { prependBufferToStringTyped } from "../utils";
import { BasicInfoResponse } from "../types/basicInfo";
import { BattleStatEntryResponse } from "../types/battleStatEntry";
import { OnLineStateResponse } from "../types/onlineState";

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


  async makeRequest<T>(path: string, method: string, bodyParams: Record<string, string>): Promise<T> {
    const body = JSON.stringify(bodyParams);
    const headers = this.makeHeaders(body.length, method, path);
    const url = this.pluginConfig.baseURL + path;
    const response = await fetch(url, {
      method,
      headers: { ...headers },
      body
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Promise<T>;
  }

  makeHeaders(bodyLength: number, method: string, path: string) {
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
    return await this.makeRequest<BattleList>('/go/jgame/get_battle_list', 'POST', bodyParams);
  }

  async fetchBasicInfo(scene: string): Promise<BasicInfoResponse> {
    const bodyParams = { scene };
    return await this.makeRequest<BasicInfoResponse>('/go/jgame/get_basic_info', 'POST', bodyParams);
  }

  async fetchBattleStatEntry(scene: string): Promise<BattleStatEntryResponse> {
    const bodyParams = { scene };
    return await this.makeRequest<BattleStatEntryResponse>('/go/jgame/get_battle_stat_entry', 'POST', bodyParams);
  }

  async getOnlineState(scene: string): Promise<OnLineStateResponse> {
    const bodyParams = { scene };
    return await this.makeRequest<OnLineStateResponse>('/go/jgame/get_online_state', 'POST', bodyParams);
  }
}

export default JGameAPI;
