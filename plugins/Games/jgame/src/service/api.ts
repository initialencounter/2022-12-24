import { Context, Service } from "koishi";
import { JGameAPIConfig } from "../types/api";
import { BattleList } from "../types";
import { prependBufferToStringTyped } from "../utils";
import { BasicInfoResponse } from "../types/basicInfo";
import { BattleStatEntryResponse } from "../types/battleStatEntry";
import { OnLineStateResponse } from "../types/onlineState";
import { UserProfileQueryUser } from "../types/response/UserProfileQueryUser";
import { CookieParser } from "../utils/cookieParser";
import { SearchUserByKeyword } from "../types/response/SearchUserByKeyword";
import { v4 } from "uuid";
import { RefreshThirdToken } from "../types/response/refreshThirdToken";
import { RefreshThirdTicket } from "../types/response/refreshThirdTicket";
import { resolve } from "path";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { TFTBasicInfoResponse } from "../types/response/TFTBasicInfo";
import { TFTBattleStatEntryResponse } from "../types/response/TFTBattleStatEntry";
import { TFTBattleListResponse } from "../types/response/TFTBattleList";

declare module 'koishi' {
  interface Context {
    jgameAPI: JGameAPI;
  }
}

class JGameAPI extends Service {
  static inject = ['loader'];
  headers: Record<string, string>;
  logger = this.ctx.logger('JGame API');
  pluginConfig: JGameAPIConfig
  opUuid: string
  openid: string
  refreshTicket: string;
  cookiePath: string;
  constructor(ctx: Context, config: JGameAPIConfig) {
    super(ctx, 'jgameAPI');
    this.cookiePath = resolve(ctx.root.baseDir, 'data/jgame_cookie.json');
    this.pluginConfig = config
    this.opUuid = CookieParser.getCookieValue(config.headers.cookie, 'userId')
    this.openid = CookieParser.getCookieValue(config.headers.cookie, 'openid');
    // this.headers = { ...config.headers };
    ctx.on('ready', async () => {
      this.logger.warn('JGame API 服务已启动, uid: ' + this.opUuid);
      this.refreshTicket = config.refreshTicket; // 初始化 refreshTicket
      await this.initializeCookieData();

      // 设置定时刷新
      setInterval(async () => {
        try {
          await this.refreshCookie()
        } catch (error) {
          this.logger.error('定时刷新Cookie失败:', error);
        }
      }, 24 * 60 * 60 * 1000);
    });
  }

  /**
   * 初始化cookie数据，处理首次运行和配置变更
   */
  private async initializeCookieData() {
    try {
      if (!existsSync(this.cookiePath)) {
        // 首次运行，创建cookie文件
        this.logger.info('首次运行，创建cookie数据文件');
        this.saveCookieData();
      } else {
        // 读取已有的cookie数据
        const cookieData = this.loadCookieData();
        this.refreshTicket = cookieData?.latestRefreshTicket || this.pluginConfig.refreshTicket;
        if (cookieData && this.pluginConfig.refreshTicket !== cookieData.configRefreshTicket) {
          // 配置文件中的 refreshTicket 发生变化，需要刷新cookie
          this.logger.warn('检测到配置中的refreshTicket发生变化，正在更新本地cookie数据');
          this.refreshTicket = this.pluginConfig.refreshTicket;
          this.saveCookieData();
        }
      }
      await this.refreshCookie();
    } catch (error) {
      this.logger.error('初始化cookie数据失败:', error);
      // 发生错误时使用配置中的refreshTicket
      this.refreshTicket = this.pluginConfig.refreshTicket;
    }
  }

  /**
   * 加载本地cookie数据
   */
  private loadCookieData(): { configRefreshTicket: string; latestRefreshTicket: string; refreshTime: number } | null {
    try {
      const content = readFileSync(this.cookiePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.warn('读取cookie数据文件失败:', error);
      return null;
    }
  }

  /**
   * 保存cookie数据到本地文件
   */
  private saveCookieData() {
    try {
      const data = {
        configRefreshTicket: this.pluginConfig.refreshTicket,
        latestRefreshTicket: this.refreshTicket,
        refreshTime: Date.now(),
      };
      writeFileSync(this.cookiePath, JSON.stringify(data, null, 2));
    } catch (error) {
      this.logger.error('保存cookie数据失败:', error);
    }
  }

  async refreshCookie() {
    try {
      this.logger.info('开始刷新Cookie...');
      const currentTicket = CookieParser.getMultipleCookieValues(this.pluginConfig.headers.cookie, [
        'clientType', 'uin', 'appid', 'acctype', 'openid', 'access_token', 'userId', 'accountType', 'tid'
      ]);

      const newTicketRep = await this.refreshThirdTicket();
      this.refreshTicket = newTicketRep.data.ct_info.ct;

      // 保存更新后的数据
      this.saveCookieData();

      // 更新cookie
      currentTicket['tid'] = newTicketRep.data.ct_info.wt;
      const latestCookie = CookieParser.objectToCookieString(currentTicket);
      this.pluginConfig.headers.cookie = latestCookie;

      this.logger.info('Cookie刷新成功');
    } catch (error) {
      this.logger.error('刷新Cookie失败:', error);
      throw error;
    }
  }

  async refreshThirdTicket(): Promise<RefreshThirdTicket> {
    const path = '/go/auth/refresh_client_ticket';
    const bodyParams = {
      config_params: {
        lang_type: 0
      },
      ct: this.refreshTicket,
      local_is_new_user: 0,
      user_id: this.opUuid,
    }
    const body = JSON.stringify(bodyParams);
    const headers = this.makeHeaders('POST', path, body.length);
    const url = this.pluginConfig.baseURL + path;
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers },
      body
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json() as RefreshThirdTicket;
    this.logger.info('Third ticket refreshed successfully');
    return data;
  }

  async refreshThirdToken() {
    const path = '/go/auth/refresh_third_token'
    const bodyParams = {
      "type": "qc",
      "uuid": v4(),
      "openid": this.openid,
    };
    return await this.makeRequest<RefreshThirdToken>(path, 'POST', bodyParams);
  }

  async makeRequest<T>(path: string, method: string, bodyParams: Record<string, any>): Promise<T> {
    const body = JSON.stringify(bodyParams);
    const headers = this.makeHeaders(method, path, body.length);
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

  async makeGetRequest<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
    const queryString = new URLSearchParams(queryParams).toString();
    const url = this.pluginConfig.baseURL + path + '?' + queryString;
    const headers = this.makeHeaders('GET', path);
    // headers['path'] = path + '?' + queryString
    headers['if-modified-since'] = new Date().toUTCString(); // 添加时间戳，避免缓存
    headers['content-type'] = 'application/text';
    headers['accept'] = 'application/json';
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...headers }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json() as Promise<T>;
  }

  makeHeaders(method: string, path: string, bodyLength?: number,) {
    const headers = this.pluginConfig.headers;
    headers['content-type'] = 'application/json';
    if (bodyLength) {
      headers['content-length'] = bodyLength.toString();
    }
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

  async fetchTFTBattleList(uuid: string, area_id: number, baton: string = ""): Promise<TFTBattleListResponse> {
    // 实现获取战斗列表的逻辑
    const bodyParams = {
      filter: "",
      baton,
      area_id,
      uuid
    };
    return await this.makeRequest<TFTBattleListResponse>('/go/exploit/get_battle_list', 'POST', bodyParams);
  }

  async fetchBasicInfo(scene: string): Promise<BasicInfoResponse> {
    const bodyParams = { scene };
    return await this.makeRequest<BasicInfoResponse>('/go/jgame/get_basic_info', 'POST', bodyParams);
  }

  async fetchTFTBasicInfo(scene: string): Promise<TFTBasicInfoResponse> {
    const bodyParams = { scene };
    return await this.makeRequest<TFTBasicInfoResponse>('/go/exploit/get_basic_info', 'POST', bodyParams);
  }

  async fetchBattleStatEntry(scene: string): Promise<BattleStatEntryResponse> {
    const bodyParams = { scene };
    return await this.makeRequest<BattleStatEntryResponse>('/go/jgame/get_battle_stat_entry', 'POST', bodyParams);
  }

  async fetchTFTBattleStatEntry(uuid: string, area_id: number,): Promise<TFTBattleStatEntryResponse> {
    const bodyParams = { uuid, area_id };
    return await this.makeRequest<TFTBattleStatEntryResponse>('/go/exploit/get_battle_stat_entry', 'POST', bodyParams);
  }

  async getOnlineState(scene: string): Promise<OnLineStateResponse> {
    const bodyParams = { scene };
    return await this.makeRequest<OnLineStateResponse>('/go/jgame/get_online_state', 'POST', bodyParams);
  }

  async getUserProfileQueryUser(uuid: string): Promise<UserProfileQueryUser> {
    const bodyParams = {
      "opUuid": this.opUuid,
      "isNeedGameInfo": 1,
      "isNeedMedal": 1,
      "isNeedCommunityInfo": 1,
      "isNeedMainInfo": 1,
      "clientType": 9,
      "isNeedDress": 1,
      "isNeedRemark": 1,
      "uuidSceneList": [
        {
          "uuid": uuid,
          "scene": ""
        }
      ]
    };
    return await this.makeRequest<UserProfileQueryUser>('/go/user_profile/query/user', 'POST', bodyParams);
  }

  async searchUserByKeyword(appNum: string, page: number = 0, pageSize: number = 10): Promise<SearchUserByKeyword> {
    const bodyParams = {
      "keyWord": appNum,
      "searchType": '1',
      "page": page.toString(),
      "pageSize": pageSize.toString()
    };
    return await this.makeGetRequest<SearchUserByKeyword>('/go/customize_search/search_type_keyword', bodyParams);
  }

  async getSceneByAppNum(appNum: string): Promise<{
    jgameScene: string | null;
    tftScene: string | null;
    uuid: string | null;
    tftAreaId: number | null;
  }> {
    const scene = {
      jgameScene: null,
      tftScene: null,
      uuid: null,
      tftAreaId: null,
    }
    try {
      const userList: SearchUserByKeyword = await this.searchUserByKeyword(appNum);
      const uuid = userList.data?.userList[0]?.userId;
      scene['uuid'] = uuid;
      const userProfile: UserProfileQueryUser = await this.getUserProfileQueryUser(uuid);

      for (const item of userProfile.data[0].gameInfoList) {
        if (item.gameId === 'jgame') {
          scene.jgameScene = item.scene;
        }
        if (item.gameId === 'tft') {
          scene.tftScene = item.scene;
          scene.tftAreaId = item.areaId;
        }
      }
    } catch (error) {
      this.logger.error('获取JGame Scene失败:', error);
    }
    return scene;
  }
}

export default JGameAPI;
