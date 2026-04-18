<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, watch } from 'vue'

const router = useRouter()
const route = useRoute()
const searchKeyword = ref('')

function goToHome() {
  router.push('/')
}

function goToSearch() {
  if (searchKeyword.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchKeyword.value.trim())}`)
  }
}

watch(() => route.path, () => {
  searchKeyword.value = ''
})
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand" @click="goToHome">
        <span class="brand-icon">💣</span>
        <span class="brand-text">扫雷社区</span>
      </div>
      
      <div class="nav-search">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索帖子..."
          class="nav-search-input"
          @keyup.enter="goToSearch"
        />
        <button @click="goToSearch" class="nav-search-btn">
          搜索
        </button>
      </div>
      
      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: route.path === '/' }">
          首页
        </router-link>
        <router-link to="/search" class="nav-link" :class="{ active: route.path === '/search' }">
          搜索
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: #1B1B1B;
  border-bottom: 1px solid #333;
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.brand-icon {
  font-size: 1.8rem;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #FFFFFF;
  white-space: nowrap;
}

.nav-search {
  flex: 1;
  max-width: 500px;
  display: flex;
  gap: 10px;
}

.nav-search-input {
  flex: 1;
  padding: 10px 18px;
  background-color: #2A2A2A;
  color: #FFFFFF;
  border: 1px solid #444;
  border-radius: 20px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.3s;
}

.nav-search-input:focus {
  border-color: #FA7299;
}

.nav-search-input::placeholder {
  color: #666;
}

.nav-search-btn {
  padding: 10px 24px;
  background-color: #FA7299;
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: bold;
  white-space: nowrap;
  transition: background-color 0.3s;
}

.nav-search-btn:hover {
  background-color: #E65C87;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: #9EA1A6;
  text-decoration: none;
  font-size: 1rem;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s;
  white-space: nowrap;
}

.nav-link:hover {
  color: #FFFFFF;
  background-color: #2A2A2A;
}

.nav-link.active {
  color: #FFFFFF;
  background-color: #FA7299;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .nav-search {
    max-width: 100%;
    width: 100%;
  }
  
  .nav-links {
    width: 100%;
    justify-content: center;
  }
}
</style>