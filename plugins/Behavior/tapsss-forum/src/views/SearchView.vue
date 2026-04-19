<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import PostCard from "../components/PostCard.vue";
import UserCard from "../components/UserCard.vue";
import { postListSearch } from "../api";
import { userSearch } from "../api";
import type { Datum as PostDatum } from "../types";
import type { Datum as UserDatum } from "../types/response/userSearchResponse";

const route = useRoute();
const searchType = ref<"post" | "user">("post");
const posts = ref<PostDatum[]>([]);
const users = ref<UserDatum[]>([]);
const loading = ref(false);
const currentPage = ref(0);
const postsPerPage = 20;

const keyword = ref((route.query.q as string) || "");

async function searchPosts(page = 0) {
  if (!keyword.value.trim()) return;

  loading.value = true;
  try {
    const response = await postListSearch(keyword.value, page, postsPerPage);
    if (response.code === 200 && response.data) {
      if (page === 0) {
        posts.value = response.data;
      } else {
        posts.value.push(...response.data);
      }
    } else {
      console.error("Failed to search posts:", response.msg);
    }
  } catch (error) {
    console.error("Error searching posts:", error);
  } finally {
    loading.value = false;
  }
}

async function searchUsers(page = 0) {
  if (!keyword.value.trim()) return;

  loading.value = true;
  try {
    const response = await userSearch(keyword.value, page, String(postsPerPage));
    if (response.code === 200 && response.data) {
      if (page === 0) {
        users.value = response.data;
      } else {
        users.value.push(...response.data);
      }
    } else {
      console.error("Failed to search users:", response.msg);
    }
  } catch (error) {
    console.error("Error searching users:", error);
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  currentPage.value++;
  if (searchType.value === "post") {
    searchPosts(currentPage.value);
  } else {
    searchUsers(currentPage.value);
  }
}

function handleSearch() {
  currentPage.value = 0;
  if (searchType.value === "post") {
    searchPosts(0);
  } else {
    searchUsers(0);
  }
}

function switchTab(type: "post" | "user") {
  if (type === searchType.value) return;
  searchType.value = type;
  handleSearch();
}

</script>

<template>
  <div class="search">
    <header class="search-header">
      <router-link to="/" class="back-btn"> ← 返回列表 </router-link>

      <div class="filter-tabs">
        <button
          :class="['tab-btn', { active: searchType === 'post' }]"
          @click="switchTab('post')"
        >
          帖子
        </button>
        <button
          :class="['tab-btn', { active: searchType === 'user' }]"
          @click="switchTab('user')"
        >
          用户
        </button>
      </div>

      <div class="search-box">
        <input
          v-model="keyword"
          type="text"
          :placeholder="searchType === 'post' ? '搜索帖子...' : '搜索用户...'"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="search-btn">搜索</button>
      </div>
    </header>

    <div class="search-results">
      <div v-if="!keyword.trim()" class="empty-search">
        <p>请输入搜索关键词</p>
      </div>

      <div v-else-if="loading && currentPage === 0" class="loading">
        搜索中...
      </div>

      <div v-else-if="searchType === 'post' && posts.length === 0" class="empty-results">
        <p>没有找到与 "{{ keyword }}" 相关的帖子</p>
      </div>
      <div v-else-if="searchType === 'user' && users.length === 0" class="empty-results">
        <p>没有找到与 "{{ keyword }}" 相关的用户</p>
      </div>

      <div v-else>
        <div class="results-info">
          <h2>搜索结果 ({{ searchType === 'post' ? posts.length : users.length }})</h2>
          <p class="search-keyword">关键词: "{{ keyword }}"</p>
        </div>

        <template v-if="searchType === 'post'">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            class="post-item"
          />
        </template>

        <template v-if="searchType === 'user'">
          <UserCard
            v-for="user in users"
            :key="user.id"
            :user="user"
            class="post-item"
          />
        </template>

        <div class="load-more" v-if="(searchType === 'post' && posts.length >= postsPerPage) || (searchType === 'user' && users.length >= postsPerPage)">
          <button @click="loadMore" :disabled="loading" class="load-more-btn">
            {{ loading ? "加载中..." : "加载更多" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.search-header {
  margin-bottom: 30px;
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

.filter-tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.tab-btn {
  padding: 10px 20px;
  background-color: #2a2a2a;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.tab-btn:hover {
  background-color: #3a3a3a;
}

.tab-btn.active {
  background-color: #fa7299;
  color: #ffffff;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 20px;
  background-color: #2a2a2a;
  color: #ffffff;
  border: 1px solid #444;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #fa7299;
}

.search-input::placeholder {
  color: #666;
}

.search-btn {
  padding: 12px 30px;
  background-color: #fa7299;
  color: #ffffff;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.search-btn:hover {
  background-color: #e65c87;
}

.search-results {
  margin-top: 30px;
}

.empty-search,
.loading,
.empty-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.2rem;
}

.results-info {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
}

.results-info h2 {
  color: #ffffff;
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.search-keyword {
  color: #fa7299;
  font-size: 1.1rem;
}

.post-item {
  margin-bottom: 20px;
}

.load-more {
  text-align: center;
  margin-top: 40px;
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
