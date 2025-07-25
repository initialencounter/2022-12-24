import { Context, Service } from "koishi";


declare module 'koishi' {
  interface Tables {
    tapsssPostStoragev4: TapsssPostStorage
  }
  interface Context {
    postStorage: PostStorage;
  }
}

export interface TapsssPostStorage {
  postId: number;
  commentId?: number;
  isComment: boolean;
  uid: string;
  createTime: Date;
  parentId: number;
  messageId: string;
}

const TABLE_NAME = 'tapsssPostStoragev4';

class PostStorage extends Service {
  static inject = ['database'];

  constructor(ctx: Context) {
    super(ctx, 'postStorage');
    ctx.model.extend(TABLE_NAME, {
      // 各字段类型
      postId: 'integer',
      commentId: 'integer',
      isComment: 'boolean',
      uid: "string",
      createTime: "timestamp",
      parentId: "integer",
      messageId: "text",
    }, {
      primary: 'messageId', //设置 uid 为主键
    })
    this.clearCache(); // 清理旧缓存
  }

  // Method to get a post from the cache
  async getPost(messageId: string): Promise<TapsssPostStorage[]> {
    return await this.ctx.database.get(TABLE_NAME, { messageId })
  }

  // Method to set a post in the cache
  async createPost(postData: TapsssPostStorage): Promise<void> {
    await this.ctx.database.create(TABLE_NAME, postData);
  }

  // Method to clear the cache
  clearCache(): void {
    this.ctx.database.remove(TABLE_NAME, {
      createTime: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Clear posts older than 7 days
    });
  }
}

export default PostStorage;
