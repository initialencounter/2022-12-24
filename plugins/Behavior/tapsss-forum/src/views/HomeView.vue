<script lang="ts">
export default {
  name: 'HomeView'
}
</script>

<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import PostCard from '../components/PostCard.vue'
import { fetchPostList } from '../api'
import type { Datum } from '../types'

const router = useRouter()
const posts = ref<Datum[]>([])
const loading = ref(false)
const currentPage = ref(0)
const postsPerPage = 20
const postType = ref(0) // 0: 最新, 1: 热门, 3: 关注
const searchKeyword = ref('')
const savedPosition = ref(0)

function goToSearch() {
  if (searchKeyword.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchKeyword.value.trim())}`)
  }
}

async function loadPosts(type = 0, page = 0) {
  loading.value = true
  try {
    const response = await fetchPostList(type, page, postsPerPage)
    if (response.code === 200 && response.data) {
      if (page === 0) {
        posts.value = response.data
      } else {
        posts.value.push(...response.data)
      }
    } else {
      console.error('Failed to fetch posts:', response.msg)
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
  } finally {
    loading.value = false
  }
}

function changeType(type: number) {
  postType.value = type
  currentPage.value = 0
  loadPosts(type, 0)
}

function loadMore() {
  currentPage.value++
  loadPosts(postType.value, currentPage.value)
}

onMounted(() => {
  if (posts.value.length === 0) {
    loadPosts()
  }
})

onActivated(async () => {
  await nextTick()
  setTimeout(() => {
    window.scrollTo({ top: savedPosition.value, behavior: 'instant' as ScrollBehavior })
  }, 50)
})

onDeactivated(() => {
  savedPosition.value = window.scrollY || document.documentElement.scrollTop
})
</script>

<template>
  <div class="home">
    <header class="forum-header">
      <h1>扫雷社区论坛</h1>
      <p class="subtitle">只读论坛 - 浏览帖子和评论</p>
    </header>

    <div class="filter-tabs">
      <button
        :class="['tab-btn', { active: postType === 0 }]"
        @click="changeType(0)"
      >
        最新
      </button>
      <button
        :class="['tab-btn', { active: postType === 1 }]"
        @click="changeType(1)"
      >
        热门
      </button>
      <button
        :class="['tab-btn', { active: postType === 3 }]"
        @click="changeType(3)"
      >
        关注
      </button>
    </div>

    <div class="posts-container">
      <div v-if="loading && posts.length === 0" class="loading">
        加载中...
      </div>

      <div v-else-if="posts.length === 0" class="empty">
        暂无帖子
      </div>

      <div v-else>
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          class="post-item"
        />

        <div class="load-more">
          <button
            @click="loadMore"
            :disabled="loading"
            class="load-more-btn"
          >
            {{ loading ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.forum-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.forum-header h1 {
  color: #FFFFFF;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.subtitle {
  color: #999;
  font-size: 1.1rem;
  margin-bottom: 10px;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
}

.tab-btn {
  padding: 10px 20px;
  background-color: #2A2A2A;
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.tab-btn:hover {
  background-color: #3A3A3A;
}

.tab-btn.active {
  background-color: #FA7299;
  color: #FFFFFF;
}

.posts-container {
  margin-bottom: 40px;
}

.post-item {
  margin-bottom: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 1.2rem;
}

.load-more {
  text-align: center;
  margin-top: 30px;
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
