import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/api'
import type { PostList } from '@/types'
import type { PostGetResponse } from '@/types/response/PostGetResponse'
import type { PostCommentListResponse } from '@/types/response/PostCommentListResponse'
import type { PostListGoodUserResponse } from '@/types/response/PostListGoodUserResponse'

export const usePostStore = defineStore('post', () => {
  const postList = ref<PostList | null>(null)
  const currentPost = ref<PostGetResponse | null>(null)
  const currentComments = ref<PostCommentListResponse | null>(null)
  const searchResults = ref<PostList | null>(null)
  const goodUsers = ref<PostListGoodUserResponse | null>(null)

  const isLoading = ref(false)

  async function fetchPostList(type: number = 0, page: number = 0, count: number = 20) {
    isLoading.value = true
    try {
      postList.value = await api.fetchPostList(type, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPost(postId: number) {
    isLoading.value = true
    try {
      currentPost.value = await api.postGet(postId)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchComments(postId: number, sort: number = 0, page: number = 0, count: number = 20) {
    isLoading.value = true
    try {
      currentComments.value = await api.commentList(postId, sort, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function searchPosts(keyword: string, page: number = 0, count: number = 20) {
    isLoading.value = true
    try {
      searchResults.value = await api.postListSearch(keyword, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchGoodUsers(postId: number, page: number = 0, count: number = 20) {
    isLoading.value = true
    try {
      goodUsers.value = await api.postListGoodUser(postId, page, count)
    } finally {
      isLoading.value = false
    }
  }

  return {
    postList, currentPost, currentComments, searchResults, goodUsers, isLoading,
    fetchPostList, fetchPost, fetchComments, searchPosts, fetchGoodUsers
  }
})
