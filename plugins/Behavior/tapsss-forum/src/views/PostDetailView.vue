<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { postGet, commentList, postListGoodUser } from "../api";
import type { Datum as CommentDatum } from "../types/response/PostCommentListResponse";
import type { Datum as LikeDatum } from "../types/response/PostListGoodUserResponse";
import type { PostList, Datum as PostListDatum } from "../types";
import {
  formatTime,
  removeHashWrappedStrings,
  removeImagesAndLinksFromMarkdown,
  extractImageLinksFromMarkdown,
  findHashWrappedStrings,
  recordBgColor,
  recordTextColor,
  computeType,
} from "../utils/constants";
import { proxyImageUrl } from "../utils/imageProxy";

import MarkdownIt from "markdown-it";
import UserAvatar from "../components/UserAvatar.vue";

const props = defineProps<{
  id: string;
}>();

const router = useRouter();

const post = ref<PostListDatum | null>(null);
const comments = ref<CommentDatum[]>([]);
const likes = ref<LikeDatum[]>([]);
const loading = ref(false);
const commentLoading = ref(false);
const likeLoading = ref(false);
const currentPage = ref(0);
const currentLikePage = ref(0);
const commentsPerPage = 20;
const likesPerPage = 20;
const sortType = ref(0); // 0: 最新, 1: 热门
const showTab = ref<"comments" | "likes">("comments");

const postId = computed(() => parseInt(props.id));

const tags = computed(() => {
  if (!post.value?.text) return [];
  return findHashWrappedStrings(post.value.text);
});

const plainText = computed(() => {
  if (!post.value?.text) return "";
  return removeHashWrappedStrings(
    removeImagesAndLinksFromMarkdown(post.value.text),
  ).trim();
});

const md = new MarkdownIt({ breaks: true, linkify: true });
const renderedText = computed(() => {
  return md.render(plainText.value);
});

const images = computed(() => {
  if (!post.value?.text) return [];
  return extractImageLinksFromMarkdown(post.value.text).map(proxyImageUrl);
});

const hasRecord = computed(() => !!post.value?.recordId);
const recordGameType = computed(() => post.value?.recordType ?? 0); // 0=Minesweeper, 1=Puzzle, 2=2048, 3=Schulte, 4=Nono

const recordBg = computed(() => recordBgColor[recordGameType.value]);
const recordColor = computed(() => recordTextColor[recordGameType.value]);

async function loadPost() {
  loading.value = true;
  try {
    const response = await postGet(postId.value);
    if (response.code === 200 && response.data) {
      // @ts-ignore
      post.value = response.data;
    } else {
      console.error("Failed to fetch post:", response.msg);
    }
  } catch (error) {
    console.error("Error fetching post:", error);
  } finally {
    loading.value = false;
  }
}

async function loadComments(type = 0, page = 0) {
  commentLoading.value = true;
  try {
    const response = await commentList(
      postId.value,
      type,
      page,
      commentsPerPage,
    );
    if (response.code === 200 && response.data) {
      if (page === 0) {
        comments.value = response.data;
      } else {
        comments.value.push(...response.data);
      }
    } else {
      console.error("Failed to fetch comments:", response.msg);
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
  } finally {
    commentLoading.value = false;
  }
}

async function loadLikes(page = 0) {
  likeLoading.value = true;
  try {
    const response = await postListGoodUser(postId.value, page, likesPerPage);
    if (response.code === 200 && response.data) {
      if (page === 0) {
        likes.value = response.data;
      } else {
        likes.value.push(...response.data);
      }
    } else {
      console.error("Failed to fetch likes:", response.msg);
    }
  } catch (error) {
    console.error("Error fetching likes:", error);
  } finally {
    likeLoading.value = false;
  }
}

function switchTab(tab: "comments" | "likes") {
  showTab.value = tab;
  if (tab === "likes" && likes.value.length === 0) {
    loadLikes(0);
  }
}

function changeSort(type: number) {
  sortType.value = type;
  currentPage.value = 0;
  loadComments(type, 0);
}

function loadMoreComments() {
  currentPage.value++;
  loadComments(sortType.value, currentPage.value);
}

function loadMoreLikes() {
  currentLikePage.value++;
  loadLikes(currentLikePage.value);
}

function openReplies(commentId: number) {
  const routeData = router.resolve({
    name: "reply",
    params: { commentId: commentId.toString() },
  });
  window.open(routeData.href, "_blank");
}

function openImage(url: string) {
  window.open(url, "_blank");
}

function openReplay(recordId?: number) {
  if (!recordId) return;
  const routeData = router.resolve({
    name: "replay",
    params: { recordId: recordId.toString() },
  });
  window.open(routeData.href, "_blank");
}

onMounted(() => {
  loadPost();
  loadComments();
});
</script>

<template>
  <div class="post-detail">
    <div v-if="loading" class="loading">加载帖子中...</div>

    <div v-else-if="post" class="post-content">
      <!-- 返回按钮 -->
      <router-link to="/" class="back-btn"> ← 返回列表 </router-link>

      <!-- 帖子内容 -->
      <div class="post-header">
        <div class="user-info">
          <UserAvatar
            className="avatar"
            :user="post.user"
            :size="60"
          />
          <div class="user-meta">
            <div class="name-row">
              <span class="nickname">{{ post.user.nickName }}</span>
              <span v-if="post.user.timingRank === 1" class="rank-badge rank-1">
                雷帝
              </span>
              <span
                v-else-if="post.user.timingRank && post.user.timingRank <= 300"
                class="rank-badge"
              >
                {{
                  post.user.timingLevel === -1
                    ? "萌新"
                    : ["萌新", "入门", "熟练", "高手", "大神"][
                        post.user.timingLevel
                      ]
                }}
                {{ post.user.timingRank }}
              </span>
            </div>
            <div class="time-device">
              {{ formatTime(post.createTime) }}
              <span v-if="post.device">📱{{ post.device }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 标题 -->
      <h1 class="post-title">{{ post.title }}</h1>

      <!-- 标签 -->
      <div class="post-tags" v-if="tags.length > 0">
        <span v-for="tag in tags" :key="tag" class="tag">#{{ tag }}</span>
      </div>

      <!-- 内容 -->
      <div class="post-body">
        <div class="post-text markdown-body" v-html="renderedText"></div>

        <!-- 图片 -->
        <div class="post-images" v-if="images.length > 0">
          <img
            v-for="(img, idx) in images"
            :key="idx"
            :src="img"
            class="post-img"
            @click="openImage(img)"
          />
        </div>

        <!-- 当前游戏记录模块渲染 -->
        <div
          class="record-box"
          v-if="hasRecord"
          :style="{ backgroundColor: recordBg, color: recordColor, cursor: 'pointer' }"
          @click="openReplay(post.recordId)"
        >
          <div class="record-icon">
            <img
              :src="`/icon/${recordGameType}.png`"
              style="width: 48px; height: 48px; object-fit: contain"
              alt="icon"
            />
          </div>
          <div class="record-details">
            <template v-if="recordGameType === 0 && post.record">
              <div class="r-col">
                <div class="r-val">
                  {{
                    computeType(
                      post.record.row,
                      post.record.column,
                      post.record.mine,
                    )
                  }}
                </div>
                <div class="r-lbl">难度</div>
              </div>
              <div class="r-col">
                <div class="r-val">{{ post.record.time / 1000 }}</div>
                <div class="r-lbl">时间</div>
              </div>
              <div class="r-col">
                <div class="r-val">{{ post.record.bvs }}</div>
                <div class="r-lbl">3BV/s</div>
              </div>
            </template>
            <template v-if="recordGameType === 1 && post.puzzleRecord">
              <div class="r-col">
                <div class="r-val">
                  {{ post.puzzleRecord.row }}x{{ post.puzzleRecord.column }}
                </div>
                <div class="r-lbl">难度</div>
              </div>
              <div class="r-col">
                <div class="r-val">{{ post.puzzleRecord.time / 1000 }}</div>
                <div class="r-lbl">时间</div>
              </div>
              <div class="r-col">
                <div class="r-val">{{ post.puzzleRecord.step }}</div>
                <div class="r-lbl">步数</div>
              </div>
            </template>
            <!-- Similar for 2048, Schulte, Nono if provided -->
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="post-stats">
        <div class="stat">
          <span class="stat-icon">💬</span>
          <span class="stat-count">{{ post.commentCount }}</span>
          <span class="stat-label">评论</span>
        </div>
        <div class="stat">
          <span class="stat-icon">👍</span>
          <span class="stat-count">{{ post.goodCount }}</span>
          <span class="stat-label">点赞</span>
        </div>
        <div class="stat">
          <span class="stat-icon">👁️</span>
          <span class="stat-count">{{ post.viewCount || 0 }}</span>
          <span class="stat-label">浏览</span>
        </div>
      </div>
    </div>

    <!-- 评论和点赞区域 -->
    <div class="comments-section">
      <div class="comments-header">
        <div class="tab-buttons">
          <button
            :class="['section-tab-btn', { active: showTab === 'comments' }]"
            @click="switchTab('comments')"
          >
            评论 ({{ post?.commentCount || 0 }})
          </button>
          <button
            :class="['section-tab-btn', { active: showTab === 'likes' }]"
            @click="switchTab('likes')"
          >
            点赞 ({{ post?.goodCount || 0 }})
          </button>
        </div>

        <div class="sort-tabs" v-if="showTab === 'comments'">
          <button
            :class="['sort-btn', { active: sortType === 0 }]"
            @click="changeSort(0)"
          >
            最新
          </button>
          <button
            :class="['sort-btn', { active: sortType === 1 }]"
            @click="changeSort(1)"
          >
            热门
          </button>
        </div>
      </div>

      <template v-if="showTab === 'comments'">
        <div v-if="commentLoading && comments.length === 0" class="loading">
          加载评论中...
        </div>

        <div v-else-if="comments.length === 0" class="empty-comments">
          暂无评论
        </div>

        <div v-else class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-header">
              <UserAvatar
                className="comment-avatar"
                :user="comment.user"
                :size="40"
              />
              <div class="comment-meta">
                <div class="comment-name">{{ comment.user.nickName }}</div>
                <div class="comment-time">
                  {{ formatTime(comment.createTime) }}
                </div>
              </div>
              <div class="comment-stats">
                <span class="comment-good">👍 {{ comment.goodCount }}</span>
              </div>
            </div>
            <div class="comment-content">{{ comment.comment }}</div>

            <!-- 回复 -->
            <div v-if="comment.replyCount > 0" class="replies">
              <div
                class="reply-list"
                v-if="comment.replyList && comment.replyList.length > 0"
              >
                <div
                  v-for="reply in comment.replyList"
                  :key="reply.id"
                  class="reply-item"
                >
                  <div class="reply-header">
                    <UserAvatar
                      className="reply-avatar"
                      :user="reply.user"
                      :size="24"
                    />
                    <div class="reply-meta">
                      <span class="reply-name">{{ reply.user.nickName }}</span>
                      <span class="reply-time">{{
                        formatTime(reply.createTime)
                      }}</span>
                    </div>
                  </div>
                  <div class="reply-content">{{ reply.comment }}</div>
                </div>
              </div>

              <div v-if="comment.replyCount > 4" class="view-more-replies">
                <a href="#" @click.prevent="openReplies(comment.id)"
                  >查看更多回复 (共 {{ comment.replyCount }} 条)</a
                >
              </div>
            </div>
          </div>

          <div class="load-more-comments">
            <button
              @click="loadMoreComments"
              :disabled="commentLoading"
              class="load-more-btn"
            >
              {{ commentLoading ? "加载中..." : "加载更多评论" }}
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="showTab === 'likes'">
        <div v-if="likeLoading && likes.length === 0" class="loading">
          加载点赞列表中...
        </div>

        <div v-else-if="likes.length === 0" class="empty-comments">
          暂无点赞
        </div>

        <div v-else class="likes-list">
          <div v-for="like in likes" :key="like.id" class="like-item">
            <UserAvatar
              className="like-avatar"
              :user="like"
              :size="40"
            />
            <div class="like-meta">
              <div class="like-name">{{ like.nickName }}</div>
              <div
                v-if="like.timingRank && like.timingRank > 0"
                class="like-badge"
              >
                <span v-if="like.timingRank === 1" class="rank-badge rank-1"
                  >雷帝</span
                >
                <span v-else-if="like.timingRank <= 300" class="rank-badge">
                  {{
                    like.timingLevel === -1
                      ? "萌新"
                      : ["萌新", "入门", "熟练", "高手", "大神"][
                          like.timingLevel
                        ]
                  }}
                  {{ like.timingRank }}
                </span>
              </div>
            </div>
          </div>

          <div class="load-more-comments">
            <button
              @click="loadMoreLikes"
              :disabled="likeLoading"
              class="load-more-btn"
            >
              {{ likeLoading ? "加载中..." : "加载更多点赞" }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.post-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  display: inline-block;
  margin-bottom: 20px;
  color: #fa7299;
  text-decoration: none;
  font-size: 1rem;
  padding: 8px 16px;
  border: 1px solid #444;
  border-radius: 20px;
  transition: all 0.3s;
}

.back-btn:hover {
  background-color: #2a2a2a;
  border-color: #fa7299;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 1.2rem;
}

.post-content {
  background-color: #1b1b1b;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
}

.post-header {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nickname {
  font-weight: bold;
  font-size: 1.2rem;
}

.rank-badge {
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 4px;
  background-color: #fa7299;
  color: white;
}

.rank-1 {
  background-color: #ffd700;
  color: #000;
}

.time-device {
  font-size: 0.9rem;
  color: #999;
  margin-top: 5px;
}

.post-title {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 20px 0;
  color: #ffffff;
}

.post-tags {
  margin: 15px 0;
}

.tag {
  color: #fa7299;
  margin-right: 10px;
  font-size: 1.1rem;
}

.post-body {
  margin: 25px 0;
}

.post-text {
  color: #e0e0e0;
  line-height: 1.6;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.post-text :deep(p) {
  margin-bottom: 10px;
}

.post-text :deep(a) {
  color: #fa7299;
  text-decoration: none;
}

.post-text :deep(a:hover) {
  text-decoration: underline;
}

.post-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
}

.post-img {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s;
}

.post-img:hover {
  transform: scale(1.05);
}

.record-box {
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.record-icon {
  font-size: 2rem;
  margin-right: 20px;
}

.record-details {
  display: flex;
  gap: 40px;
  text-align: center;
}

.r-val {
  font-size: 1.2rem;
  font-weight: bold;
}

.r-lbl {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 4px;
}

.post-stats {
  display: flex;
  gap: 30px;
  padding-top: 20px;
  border-top: 1px solid #333;
  margin-top: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ea1a6;
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-count {
  font-weight: bold;
  font-size: 1.1rem;
}

.stat-label {
  font-size: 0.9rem;
}

.comments-section {
  background-color: #1b1b1b;
  border-radius: 12px;
  padding: 30px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.comments-header h2 {
  color: #ffffff;
  font-size: 1.5rem;
}

.tab-buttons {
  display: flex;
  gap: 20px;
}

.section-tab-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  transition: color 0.3s;
}

.section-tab-btn:hover {
  color: #ddd;
}

.section-tab-btn.active {
  color: #ffffff;
  border-bottom: 2px solid #fa7299;
  padding-bottom: 5px;
}

.sort-tabs {
  display: flex;
  gap: 10px;
}

.sort-btn {
  padding: 8px 16px;
  background-color: #2a2a2a;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.sort-btn:hover {
  background-color: #3a3a3a;
}

.sort-btn.active {
  background-color: #fa7299;
  color: #ffffff;
}

.empty-comments {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 1.1rem;
}

.comments-list {
  margin-top: 20px;
}

.comment-item {
  padding: 20px;
  border-bottom: 1px solid #2a2a2a;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.comment-meta {
  flex: 1;
}

.comment-name {
  font-weight: bold;
  font-size: 1rem;
  color: #ffffff;
}

.comment-time {
  font-size: 0.8rem;
  color: #999;
  margin-top: 3px;
}

.comment-stats {
  color: #9ea1a6;
}

.comment-good {
  font-size: 0.9rem;
}

.comment-content {
  color: #e0e0e0;
  line-height: 1.5;
  font-size: 1rem;
}

.replies {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid #444;
}

.reply-count {
  color: #999;
  font-size: 0.9rem;
  padding: 8px 0;
}

.load-more-comments {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.load-more-btn {
  padding: 12px 30px;
  background-color: #2a2a2a;
  color: #ffffff;
  border: 1px solid #444;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.load-more-btn:hover:not(:disabled) {
  background-color: #3a3a3a;
  border-color: #fa7299;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reply-list {
  margin-top: 10px;
}

.reply-item {
  padding: 10px 0;
  border-bottom: 1px dashed #333;
}

.reply-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.reply-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.likes-list {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.like-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #2a2a2a;
  border-radius: 8px;
  transition: transform 0.2s;
}

.like-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.like-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.like-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.like-name {
  font-weight: bold;
  font-size: 0.95rem;
  color: #ffffff;
}

.like-badge {
  display: flex;
  align-items: center;
}

/* 覆盖默认的 grid 布局对于 load-more-comments 的影响 */
.likes-list .load-more-comments {
  grid-column: 1 / -1;
}

.reply-name {
  font-weight: bold;
  font-size: 0.9rem;
  color: #ddd;
}

.reply-time {
  font-size: 0.75rem;
  color: #888;
}

.reply-content {
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
  padding-left: 34px;
}

.view-more-replies {
  margin-top: 10px;
  font-size: 0.9rem;
}

.view-more-replies a {
  color: #fa7299;
  text-decoration: none;
}

.view-more-replies a:hover {
  text-decoration: underline;
}
</style>
