import { Context, Service } from "koishi";
import { PostResponse } from "../types/response/PostResponse";
import { PostCommentListResponse } from "../types/response/PostCommentListResponse";
import { PostGetTopResponse } from "../types/response/PostGetTopResponse";
import { PostListReplyResponse } from "../types/response/PostListReply";
import { PostListGoodUserResponse } from "../types/response/PostListGoodUserResponse";
import { UserSaoleiResponse } from "../types/response/UserSaoleiResponse";
import { UserHomeResponse } from "../types/response/UserHomeResponse";
import { DailyStarResponse } from "../types/response/DailyStar";
import { PostList } from "../types/postList";
import {  } from "./httpService";
import { GameNews } from "../types/gameNews";

declare module 'koishi' {
  interface Context {
    tapsssAPI: TapsssAPI;
  }
}

class TapsssAPI extends Service {
  static inject = ['httpService'];

  constructor(ctx: Context) { // Replace 'any' with actual config type
    super(ctx, 'tapsssAPI');
  }

  async good(params: { postId: number, isGood: boolean }): Promise<PostResponse> {
    const path = '/Minesweeper/post/good';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostResponse>(path, method, params);
  }

  async commentGood(params: { commentId: number, isGood: boolean }): Promise<PostResponse> {
    const path = '/Minesweeper/post/comment/good';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostResponse>(path, method, params);
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
    return this.ctx.httpService.executeRequest<PostResponse>(path, method, params);
  }

  async commentDelete(params: { commentId: number }): Promise<PostResponse> {
    const path = '/Minesweeper/post/comment/delete';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostResponse>(path, method, params);
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
    return this.ctx.httpService.executeRequest<PostCommentListResponse>(path, method, params);
  }

  async commentGetTop(params: { commentId: number }): Promise<PostGetTopResponse> {
    const path = '/Minesweeper/post/comment/get/top';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostGetTopResponse>(path, method, params);
  }

  async commentListReply(params: { commentId: number, page: number, count: number }): Promise<PostListReplyResponse> {
    const path = '/Minesweeper/post/comment/list/reply';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostListReplyResponse>(path, method, params);
  }

  async listGoodUser(params: { postId: number, page: number, count: number }): Promise<PostListGoodUserResponse> {
    const path = '/Minesweeper/post/list/good/user';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostListGoodUserResponse>(path, method, params);
  }

  async userSaolei(): Promise<UserSaoleiResponse> {
    const path = '/Minesweeper/user/saolei';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<UserSaoleiResponse>(path, method, {});
  }

  async userHome(params: { targetUid: number }): Promise<UserHomeResponse> {
    const path = '/Minesweeper/user/home';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<UserHomeResponse>(path, method, params);
  }

  async postGet(params: { postId: number }): Promise<UserHomeResponse> {
    const path = '/Minesweeper/post/get';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<UserHomeResponse>(path, method, params);
  }

  async getStar(): Promise<DailyStarResponse> {
    const path = '/Minesweeper/minesweeper/record/get/star';
    const method = 'POST';
    return await this.ctx.httpService.executeRequest<DailyStarResponse>(path, method, {});
  }

  async MessageSend(params: { toUid: string, messageType: number, message: string }): Promise<PostResponse> {
    const path = '/im/message/send';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostResponse>(path, method, params);
  }

  async fetchPostList(params: { type: number, page: number, count: number }): Promise<PostList> {
    const path = '/Minesweeper/post/list';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostList>(path, method, params);
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
}

export default TapsssAPI;
