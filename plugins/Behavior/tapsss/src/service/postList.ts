import { Context, Service } from "koishi";
import { Datum, LastComment, PostList, PostListConfig } from "../types/postList";
import HttpService from "./httpService";
import XiBao from "./xiBao";
import ActiveMsg from "./activeMsg";

declare module 'koishi' {
  interface Context {
    httpService: HttpService;
    xiBao: XiBao;
    activeMsg: ActiveMsg;
  }
}

class PostListService extends Service {
  static inject = ['xiBao', 'httpService', 'activeMsg'];
  private readonly pluginConfig: PostListConfig;
  private LatestPostCreateTime = 0;
  private LatestPostCommentTime = 0;
  private timer: NodeJS.Timeout | null = null;
  private isFirstFetch = true;

  constructor(ctx: Context, config: PostListConfig) {
    super(ctx, 'postList');
    this.pluginConfig = config;

    ctx.on('ready', async () => {
      this.ctx.logger('PostList').info('PostList service is ready.');
      await this.initializeLatestTimes();
      this.startPeriodicFetch();
    });

    ctx.on('dispose', () => {
      this.ctx.logger('PostList').info('PostList service is being disposed.');
      this.stopPeriodicFetch();
    });
  }

  private async initializeLatestTimes(): Promise<void> {
    try {
      const json = await this.fetchPostList({ type: 0, page: 0, count: 20 });
      if (json.data.length > 0) {
        // 排除置顶帖子，只考虑普通帖子来初始化时间
        const normalPosts = json.data.filter(post => post.stick === 0);
        this.ctx.logger('PostList').info(normalPosts[0]?.text ?? normalPosts[0]?.title ?? 'No posts found');

        // 设置为当前时间前30秒，避免旧帖子因新评论被顶上来的问题
        // 时间戳单位为毫秒，30秒 = 30 * 1000 毫秒
        const currentTime = Date.now();
        this.LatestPostCreateTime = currentTime - 30 * 1000;
        this.LatestPostCommentTime = currentTime - 30 * 1000;
      }
      this.isFirstFetch = false;
    } catch (error) {
      this.ctx.logger('PostList').error('Failed to initialize latest times:', error);
    }
  }

  private startPeriodicFetch(): void {
    this.timer = setInterval(async () => {
      try {
        await this.checkForNewPostsAndComments();
      } catch (error) {
        this.ctx.logger('PostList').error('Error during periodic fetch:', error);
      }
    }, 30 * 1000); // 30秒
  }

  private stopPeriodicFetch(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async checkForNewPostsAndComments(): Promise<void> {
    if (this.isFirstFetch) return;

    const newPosts: Datum[] = [];
    const newComments: Datum[] = [];
    let page = 0;
    let shouldContinue = true;

    while (shouldContinue) {
      const json = await this.fetchPostList({ type: 0, page, count: 20 });

      if (!json.data || json.data.length === 0) {
        break;
      }

      // 过滤掉置顶帖子
      const normalPosts = json.data.filter((post: Datum) => post.stick == 0);

      let hasNewContent = false;

      for (const post of normalPosts) {
        // 检查新帖子
        if (post.createTime > this.LatestPostCreateTime) {
          newPosts.push(post);
          this.LatestPostCreateTime = post.createTime;
          hasNewContent = true;
        }

        // 检查新评论
        if (post.lastComment && post.lastComment.createTime > this.LatestPostCommentTime) {
          newComments.push(post);
          this.LatestPostCommentTime = post.lastComment.createTime;
          hasNewContent = true;
        }
      }

      // 如果当前页没有新内容，且至少有一个帖子，检查是否需要继续翻页
      if (!hasNewContent && normalPosts.length > 0) {
        const oldestPost = normalPosts[normalPosts.length - 1];
        // 如果最后一个帖子的创建时间和评论时间都早于记录的时间，停止翻页
        if (oldestPost.createTime <= this.LatestPostCreateTime &&
          (!oldestPost.lastComment || oldestPost.lastComment.createTime <= this.LatestPostCommentTime)) {
          shouldContinue = false;
        }
      }

      page++;

      // 防止无限循环，最多翻10页
      if (page >= 10) {
        break;
      }
    }

    // 处理新帖子和评论
    if (newPosts.length > 0) {
      await this.handleNewPosts(newPosts);
    }

    if (newComments.length > 0) {
      await this.handleNewComments(newComments);
    }
  }

  private async handleNewPosts(posts: Datum[]): Promise<void> {
    // 处理新帖子的逻辑
    for (const post of posts) {
      const message = `新帖子: [${post.user.nickName}]: ${post.title || (post.text.length > 20 ? post.text.slice(0, 20) : post.text)}\n${post?.text}`;
      this.ctx.logger('PostList').info(message);
      await this.ctx.activeMsg.pushMessage(this.pluginConfig.rules, message);
    }
  }

  private async handleNewComments(posts: Datum[]): Promise<void> {
    // 处理新评论的逻辑
    for (const post of posts) {
      const message = `${post.title || (post.text.length > 20 ? post.text.slice(0, 20) : post.text)}\n新评论: [${post.lastComment.user.nickName}]: ${post.lastComment.comment}`;
      this.ctx.logger('PostList').info(message);
      await this.ctx.activeMsg.pushMessage(this.pluginConfig.rules, message);
    }
  }

  async fetchPostList(params: { type: number, page: number, count: number }): Promise<PostList> {
    const path = '/Minesweeper/post/list';
    const method = 'POST';
    return this.ctx.httpService.executeRequest<PostList>(path, method, params);
  }
}

export default PostListService;
