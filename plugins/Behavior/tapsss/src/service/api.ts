import { Context, HTTP, Service } from "koishi";
import { PostResponse } from "../types/response/PostResponse";
import { PostCommentListResponse } from "../types/response/PostCommentListResponse";
import { PostGetTopResponse } from "../types/response/PostGetTopResponse";
import { PostListReplyResponse } from "../types/response/PostListReply";
import { PostListGoodUserResponse } from "../types/response/PostListGoodUserResponse";
import { UserSaoleiResponse } from "../types/response/UserSaoleiResponse";
import { UserHomeResponse } from "../types/response/UserHomeResponse";
import { DailyStarResponse } from "../types/response/DailyStar";
import { PostList } from "../types/postList";
import { GameNews } from "../types/gameNews";
import { APIServiceConfig } from "../types/apiService";
import { aesEcbEncrypt, extractJsonFromEncrypted } from "../utils/aes";
import { computeMD5 } from "../utils/md5";
import { LoginResponse } from "../types/response/LoginResponse";
import { RecordGetResponse } from "../types/response/RecordGet";
import { PostGetResponse } from "../types/response/PostGetResponse";

const GAME_PATH = ['minesweeper', 'puzzle', 'schulte', 'tzfe', 'nono']
declare module 'koishi' {
  interface Context {
    tapsssAPI: TapsssAPI;
  }
}

class TapsssAPI extends Service {
  headers: Headers;
  uid: string;
  token: string;
  decryptSecretKey: string
  encryptSecretKey: string
  constructor(ctx: Context, config: APIServiceConfig) { // Replace 'any' with actual config type
    super(ctx, 'tapsssAPI');
    this.uid = config.headers.uid || '';
    this.token = config.headers.token || '';
    this.decryptSecretKey = config.decryptSecretKey;
    this.encryptSecretKey = config.encryptSecretKey;
    this.headers = ctx.config.headers;
    ctx.logger('[Tapsss] tapsssAPI').warn('Tapsss API 服务已启动，', this.uid, this.token)
  }

  makeApiKey(
    body: string,
    timeStamp: string = Date.now().toString(),
  ): string {
    return computeMD5(this.uid + this.token + timeStamp + computeMD5(body) + "api");
  }

  encryptBody(body: string): string {
    return aesEcbEncrypt(body, this.encryptSecretKey);
  }

  async executeRequest<T>(path: string, method: HTTP.Method, params: Record<string, any>): Promise<T> {
    const data = new URLSearchParams(params).toString();
    const body = this.encryptBody(data);
    const timeStamp = Date.now().toString();
    // const timeStamp = '1752668107525'; // 获取当前时间戳
    const apiKey = this.makeApiKey(body, timeStamp);
    const headers = this.headers;
    headers.set('time-stamp', timeStamp);
    headers.set('api-key', apiKey);
    headers.set('Content-Length', body.length.toString()); // 获取字符串长度
    headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');

    try {
      const response = await fetch(`http://${headers.get('Host')}${path}`,
        {
          method,
          headers,
          body
        });
      const cipher = await response.text();
      const jsonStr = extractJsonFromEncrypted(cipher, this.decryptSecretKey) as string;
      const json = JSON.parse(jsonStr);
      return json as T;
    } catch (error) {
      this.ctx.logger('[Tapsss] GameNews').error('获取游戏资讯失败:', error);
      throw error;
    }
  }

  async login(params: { username: string, password: string }): Promise<LoginResponse> {
    const path = '/Minesweeper/user/login';
    const method = 'POST';
    return this.executeRequest<LoginResponse>(path, method, params);
  }

  async good(params: { postId: number, isGood: boolean }): Promise<PostResponse> {
    const path = '/Minesweeper/post/good';
    const method = 'POST';
    return this.executeRequest<PostResponse>(path, method, params);
  }

  async commentGood(params: { commentId: number, isGood: boolean }): Promise<PostResponse> {
    const path = '/Minesweeper/post/comment/good';
    const method = 'POST';
    return this.executeRequest<PostResponse>(path, method, params);
  }

  /**
   * postId=1776986&parentId=184109&replyId=0&comment="测试评论"
   * @param params
   * @returns
   */
  async commentAdd(params: {
    postId: number,
    parentId: number,
    replyId: number,
    comment: string
  }): Promise<PostResponse> {
    const path = '/Minesweeper/post/comment/add';
    const method = 'POST';
    return this.executeRequest<PostResponse>(path, method, params);
  }

  async commentDelete(params: { commentId: number }): Promise<PostResponse> {
    const path = '/Minesweeper/post/comment/delete';
    const method = 'POST';
    return this.executeRequest<PostResponse>(path, method, params);
  }

  /**
   * postId=1776986&sort=0&page=0&count=20
   * sort 0: latest, 1: hot
   */
  async commentList(params: {
    postId: number,
    sort: number,
    page: number,
    count: number
  }): Promise<PostCommentListResponse> {
    const path = '/Minesweeper/post/comment/list';
    const method = 'POST';
    return this.executeRequest<PostCommentListResponse>(path, method, params);
  }

  async commentGetTop(params: { commentId: number }): Promise<PostGetTopResponse> {
    const path = '/Minesweeper/post/comment/get/top';
    const method = 'POST';
    return this.executeRequest<PostGetTopResponse>(path, method, params);
  }

  async commentListReply(params: { commentId: number, page: number, count: number }): Promise<PostListReplyResponse> {
    const path = '/Minesweeper/post/comment/list/reply';
    const method = 'POST';
    return this.executeRequest<PostListReplyResponse>(path, method, params);
  }

  async listGoodUser(params: { postId: number, page: number, count: number }): Promise<PostListGoodUserResponse> {
    const path = '/Minesweeper/post/list/good/user';
    const method = 'POST';
    return this.executeRequest<PostListGoodUserResponse>(path, method, params);
  }

  async userSaolei(): Promise<UserSaoleiResponse> {
    const path = '/Minesweeper/user/saolei';
    const method = 'POST';
    return this.executeRequest<UserSaoleiResponse>(path, method, {});
  }

  async userHome(params: { targetUid?: number, targetName?: string }): Promise<UserHomeResponse> {
    const path = '/Minesweeper/user/home';
    const method = 'POST';
    return this.executeRequest<UserHomeResponse>(path, method, params);
  }

  async postGet(params: { postId: number }): Promise<PostGetResponse> {
    const path = '/Minesweeper/post/get';
    const method = 'POST';
    return this.executeRequest<PostGetResponse>(path, method, params);
  }

  async getStar(): Promise<DailyStarResponse> {
    const path = '/Minesweeper/minesweeper/record/get/star';
    const method = 'POST';
    return await this.executeRequest<DailyStarResponse>(path, method, {});
  }

  async MessageSend(params: { toUid: string, messageType: number, message: string }): Promise<PostResponse> {
    const path = '/im/message/send';
    const method = 'POST';
    return this.executeRequest<PostResponse>(path, method, params);
  }

  async fetchPostList(params: { type: number, page: number, count: number }): Promise<PostList> {
    const path = '/Minesweeper/post/list';
    const method = 'POST';
    return this.executeRequest<PostList>(path, method, params);
  }

  /**
   * 获取游戏资讯
   * @param page 页码
   * @param count 每页数量
   */
  async postGameNews(params: { page: number, count: number }): Promise<GameNews> {
    const path = '/Minesweeper/game/news';
    const method = 'POST';
    return await this.executeRequest<GameNews>(path, method, params);
  }

  async getRecord(params: { recordId: number }, gameType: number): Promise<RecordGetResponse> {
    const path = `/Minesweeper/${GAME_PATH[gameType]}/record/get`;
    const method = 'POST';
    return await this.executeRequest<RecordGetResponse>(path, method, params);
  }

}

export default TapsssAPI;
