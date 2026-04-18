<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { commentReplyList } from "../api";
import { formatTime } from "../utils/constants";
import UserAvatar from "../components/UserAvatar.vue";
import type { Datum } from "../types/response/PostListReply";

const props = defineProps<{
  commentId: string;
}>();

const replies = ref<Datum[]>([]);
const loading = ref(false);
const currentPage = ref(0);
const repliesPerPage = 20;

const numericCommentId = computed(() => parseInt(props.commentId));

async function loadReplies(page = 0) {
  loading.value = true;
  try {
    const response = await commentReplyList(
      numericCommentId.value,
      page,
      repliesPerPage,
    );
    if (response.code === 200 && response.data) {
      if (page === 0) {
        replies.value = response.data;
      } else {
        replies.value.push(...response.data);
      }
    } else {
      console.error("Failed to fetch replies:", response.msg);
    }
  } catch (error) {
    console.error("Error fetching replies:", error);
  } finally {
    loading.value = false;
  }
}

function loadMoreReplies() {
  currentPage.value++;
  loadReplies(currentPage.value);
}

onMounted(() => {
  loadReplies();
});
</script>

<template>
  <div class="reply-detail">
    <div class="reply-header">
      <h2>所有回复</h2>
    </div>

    <div v-if="loading && replies.length === 0" class="loading">
      加载回复中...
    </div>

    <div v-else-if="replies.length === 0" class="empty-replies">暂无回复</div>

    <div v-else class="replies-list">
      <div v-for="reply in replies" :key="reply.id" class="reply-item">
        <div class="reply-header-info">
          <UserAvatar
            className="reply-avatar"
            :user="reply.user"
            :size="40"
          />
          <div class="reply-meta">
            <span class="reply-name">{{ reply.user?.nickName }}</span>
            <span class="reply-time">{{
              formatTime(reply.createTime || 0)
            }}</span>
          </div>
        </div>
        <div class="reply-content">{{ reply.comment }}</div>
      </div>

      <div class="load-more-replies">
        <button
          @click="loadMoreReplies"
          :disabled="loading"
          class="load-more-btn"
        >
          {{ loading ? "加载中..." : "加载更多回复" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reply-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #1b1b1b;
  border-radius: 12px;
  min-height: 80vh;
}

.reply-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.reply-header h2 {
  color: #ffffff;
  font-size: 1.5rem;
}

.loading,
.empty-replies {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 1.1rem;
}

.reply-item {
  padding: 20px;
  border-bottom: 1px solid #2a2a2a;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-header-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.reply-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.reply-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.reply-name {
  font-weight: bold;
  font-size: 1rem;
  color: #ffffff;
}

.reply-time {
  font-size: 0.8rem;
  color: #999;
}

.reply-content {
  color: #e0e0e0;
  line-height: 1.5;
  font-size: 1rem;
}

.load-more-replies {
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
</style>
