import { Context, Session } from "koishi";
import { TapsssPostStorage } from "../service/postStorage";
import { } from "../service/api";

class TapsssCommand {
  static inject = ['postStorage', 'tapsssAPI'];
  constructor(private ctx: Context) {
    ctx.command('评论 <content:text>', '添加评论')
      .action(async ({ session }) => {
        const content = this.getContent(session).slice(3).trim();
        if (!content) {
          return '评论内容不能为空';
        }
        const post = await this.getPostId(session);
        if (!post) return '找不到帖子或评论';
        try {
          await ctx.tapsssAPI.commentAdd({
            postId: post.postId,
            parentId: post.commentId || 0,
            replyId: post.isComment ? Number(post.uid) : 0,
            comment: content,
          });
        } catch (error) {
          return `评论失败: ${error.message}`;
        }
      })

    ctx.command('删除评论 <commentId:number>', '删除评论')
      .option('commentId', '-c <commentId:number>')
      .action(async ({ session, options }, commentId) => {
        let id = commentId;
        if (!id) {
          if (options.commentId) {
            id = options.commentId;
          } else {
            return '评论ID不能为空';
          }
        }
        try {
          await ctx.tapsssAPI.commentDelete({ commentId: id });
          return '评论已删除';
        } catch (error) {
          return `删除评论失败: ${error.message}`;
        }
      })

    ctx.command('点赞', '点赞帖子或评论')
      .action(async ({ session }) => {
        try {

          // 处理引用消息的情况
          if (session?.quote?.id) {
            const post = await this.ctx.postStorage.getPost(session.quote.id);
            if (post && post.length > 0) {
              const targetPost = post[0];
              if (targetPost.isComment) {
                await ctx.tapsssAPI.commentGood({ commentId: targetPost.commentId, isGood: true });
                return '已点赞评论';
              } else {
                await ctx.tapsssAPI.good({ postId: targetPost.postId, isGood: true });
                return '已点赞帖子';
              }
            } else {
              return '未找到引用的帖子或评论';
            }
          }

          return '请指定帖子ID(-p)、评论ID(-c)，或引用一条消息';
        } catch (error) {
          return `点赞失败: ${error.message}`;
        }
      })

    ctx.command('取消点赞', '取消点赞帖子或评论')
      .action(async ({ session }) => {
        try {
          // 处理引用消息的情况
          if (session?.quote?.id) {
            const post = await this.ctx.postStorage.getPost(session.quote.id);
            if (post && post.length > 0) {
              const targetPost = post[0];
              if (targetPost.isComment) {
                await ctx.tapsssAPI.commentGood({ commentId: targetPost.commentId, isGood: false });
                return '已取消点赞评论';
              } else {
                await ctx.tapsssAPI.good({ postId: targetPost.postId, isGood: false });
                return '已取消点赞帖子';
              }
            } else {
              return '未找到引用的帖子或评论';
            }
          }

          return '请指定帖子ID(-p)、评论ID(-c)，或引用一条消息';
        } catch (error) {
          return `取消点赞失败: ${error.message}`;
        }
      })

    ctx.command('点赞列表', '查看点赞用户列表')
      .option('postId', '-p <postId:number>')
      .action(async ({ session, options }) => {
        let postId = options.postId;
        if (!options.postId) {
          postId = (await this.getPostId(session)).postId;
        }

        if (!postId) return '帖子ID不能为空';
        try {
          const response = await ctx.tapsssAPI.listGoodUser({ postId, page: 0, count: 20 });
          return `点赞用户列表: ${response.data.map(user => user.nickName).join(', ')}`;
        } catch (error) {
          return `获取点赞用户列表失败: ${error.message}`;
        }
      })
  }

  async getPostId(session: Session): Promise<TapsssPostStorage> {
    if (session?.quote?.id) {
      const post = await this.ctx.postStorage.getPost(session.quote.id);
      if (post && post.length > 0) {
        return post[0];
      }
    }
    return null;
  }

  getContent(session: Session): string {
    if (session.elements[0].type === 'text') {
      return session.elements[0].attrs.content
    }
    return '';
  }

}

export default TapsssCommand;
