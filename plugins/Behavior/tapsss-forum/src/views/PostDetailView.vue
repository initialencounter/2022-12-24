<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { postGet, commentList } from '../api'
import type { PostGetResponse, PostCommentListResponse, Comment } from '../types'
import { formatTime, removeHashWrappedStrings, removeImagesAndLinksFromMarkdown, extractImageLinksFromMarkdown, findHashWrappedStrings } from '../utils/constants'

const props = defineProps<{
  id: string
}>()

const post = ref<any>(null)
const comments = ref<Comment[]>([])
const loading = ref(false)
const commentLoading = ref(false)
const currentPage = ref(0)
const commentsPerPage = 20
const sortType = ref(0) // 0: 最新, 1: 热门

const postId = computed(() => parseInt(props.id))

const tags = computed(() => {
  if (!post.value?.text) return []
  return findHashWrappedStrings(post.value.text)
})

const plainText = computed(() => {
  if (!post.value?.text) return ''
  return removeHashWrappedStrings(removeImagesAndLinksFromMarkdown(post.value.text)).trim()
})

const images = computed(() => {
  if (!post.value?.text) return []
  return extractImageLinksFromMarkdown(post.value.text)
})

async function loadPost() {
  loading.value = true
  try {
    const response = await postGet(postId.value)
    if (response.code === 200 && response.data) {
      post.value = response.data
    } else {
      console.error('Failed to fetch post:', response.msg)
    }
  } catch (error) {
    console.error('Error fetching post:', error)
  } finally {
    loading.value = false
  }
}

async function loadComments(type = 0, page = 0) {
  commentLoading.value = true
  try {
    const response = await commentList(postId.value, type, page, commentsPerPage)
    if (response.code === 200 && response.data) {
      if (page === 0) {
        comments.value = response.data
      } else {
        comments.value.push(...response.data)
      }
    } else {
      console.error('Failed to fetch comments:', response.msg)
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
  } finally {
    commentLoading.value = false
  }
}

function changeSort(type: number) {
  sortType.value = type
  currentPage.value = 0
  loadComments(type, 0)
}

function loadMoreComments() {
  currentPage.value++
  loadComments(sortType.value, currentPage.value)
}

function openImage(url: string) {
  window.open(url, '_blank')
}

onMounted(() => {
  loadPost()
  loadComments()
})
</script>

<template>
  <div class="post-detail">
    <div v-if="loading" class="loading">
      加载帖子中...
    </div>

    <div v-else-if="post" class="post-content">
      <!-- 返回按钮 -->
      <router-link to="/" class="back-btn">
        ← 返回列表
      </router-link>

      <!-- 帖子内容 -->
      <div class="post-header">
        <div class="user-info">
          <img class="avatar" :src="post.user.avatar || 'https://via.placeholder.com/104'" alt="avatar" />
          <div class="user-meta">
            <div class="name-row">
              <span class="nickname">{{ post.user.nickName }}</span>
              <span v-if="post.user.timingRank === 1" class="rank-badge rank-1">
                雷帝
              </span>
              <span v-else-if="post.user.timingRank && post.user.timingRank <= 300" class="rank-badge">
                {{ post.user.timingLevel === -1 ? '萌新' : ['萌新', '入门', '熟练', '高手', '大神'][post.user.timingLevel] }} {{ post.user.timingRank }}
              </span>
            </div>
            <div class="time-device">
              {{ formatTime(post.createTime) }} <span v-if="post.device">📱{{ post.device }}</span>
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
        <p class="post-text">{{ plainText }}</p>

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

        <!-- 游戏记录 -->
        <div v-if="post.recordId" class="record-section">
          <h3>🎮 游戏记录</h3>
          <div class="record-details">
            <div v-if="post.recordType === 0 && post.record" class="record-item">
              <div class="record-label">扫雷</div>
              <div class="record-data">
                <span>难度: {{ post.record.row }}x{{ post.record.column }} {{ post.record.mine }}雷</span>
                <span>时间: {{ (post.record.time / 1000).toFixed(2) }}秒</span>
                <span>3BV/s: {{ post.record.bvs }}</span>
              </div>
            </div>
            <!-- 可以添加其他游戏类型的记录显示 -->
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

    <!-- 评论区域 -->
    <div class="comments-section">
      <div class="comments-header">
        <h2>评论 ({{ comments.length }})</h2>
        <div class="sort-tabs">
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

      <div v-if="commentLoading && comments.length === 0" class="loading">
        加载评论中...
      </div>

      <div v-else-if="comments.length === 0" class="empty-comments">
        暂无评论
      </div>

      <div v-else class="comments-list">
        <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
          <div class="comment-header">
            <img class="comment-avatar" :src="comment.user.avatar || 'https://via.placeholder.com/60'" />
            <div class="comment-meta">
              <div class="comment-name">{{ comment.user.nickName }}</div>
              <div class="comment-time">{{ formatTime(comment.createTime) }}</div>
            </div>
            <div class="comment-stats">
              <span class="comment-good">👍 {{ comment.goodCount }}</span>
            </div>
          </div>
          <div class="comment-content">{{ comment.comment }}</div>

          <!-- 回复 -->
          <div v-if="comment.replyCount > 0" class="replies">
            <div class="reply-count">
              共 {{ comment.replyCount }} 条回复
            </div>
            <!-- 这里可以添加回复列表 -->
          </div>
        </div>

        <div class="load-more-comments">
          <button
            @click="loadMoreComments"
            :disabled="commentLoading"
            class="load-more-btn"
          >
            {{ commentLoading ? '加载中...' : '加载更多评论' }}
          </button>
        </div>
      </div>
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
  color: #FA7299;
  text-decoration: none;
  font-size: 1rem;
  padding: 8px 16px;
  border: 1px solid #444;
  border-radius: 20px;
  transition: all 0.3s;
}

.back-btn:hover {
  background-color: #2A2A2A;
  border-color: #FA7299;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 1.2rem;
}

.post-content {
  background-color: #1B1B1B;
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
  background-color: #FA7299;
  color: white;
}

.rank-1 {
  background-color: #FFD700;
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
  color: #FFFFFF;
}

.post-tags {
  margin: 15px 0;
}

.tag {
  color: #FA7299;
  margin-right: 10px;
  font-size: 1.1rem;
}

.post-body {
  margin: 25px 0;
}

.post-text {
  color: #E0E0E0;
  line-height: 1.6;
  font-size: 1.1rem;
  margin-bottom: 20px;
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

.record-section {
  background-color: #2A2A2A;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.record-section h3 {
  color: #8D9E4B;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.record-label {
  font-weight: bold;
  color: #FA7299;
  min-width: 60px;
}

.record-data {
  display: flex;
  gap: 20px;
  color: #E0E0E0;
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
  color: #9EA1A6;
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
  background-color: #1B1B1B;
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
  color: #FFFFFF;
  font-size: 1.5rem;
}

.sort-tabs {
  display: flex;
  gap: 10px;
}

.sort-btn {
  padding: 8px 16px;
  background-color: #2A2A2A;
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.sort-btn:hover {
  background-color: #3A3A3A;
}

.sort-btn.active {
  background-color: #FA7299;
  color: #FFFFFF;
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
  border-bottom: 1px solid #2A2A2A;
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
  color: #FFFFFF;
}

.comment-time {
  font-size: 0.8rem;
  color: #999;
  margin-top: 3px;
}

.comment-stats {
  color: #9EA1A6;
}

.comment-good {
  font-size: 0.9rem;
}

.comment-content {
  color: #E0E0E0;
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
  background-color: #2A2A2A;
  color: #FFFFFF;
  border: 1px solid #444;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.load-more-btn:hover:not(:disabled) {
  background-color: #3A3A3A;
  border-color: #FA7299;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
