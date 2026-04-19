import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/api'
import type { UserHomeResponse } from '@/types/response/userHomeResponse'
import type { userSearchResponse } from '@/types/response/userSearchResponse'
import type { UserConfigGetResponse } from '@/types/response/UserConfigGetResponse'

export const useUserStore = defineStore('user', () => {
  const userHome = ref<UserHomeResponse | null>(null)
  const searchResults = ref<userSearchResponse | null>(null)
  const currentConfig = ref<UserConfigGetResponse | null>(null)
  const isLoading = ref(false)

  async function fetchUserHome(targetUid?: number, targetName?: string) {
    isLoading.value = true
    try {
      userHome.value = await api.userHome(targetUid, targetName)
    } finally {
      isLoading.value = false
    }
  }

  async function searchUser(name: string, page: number, count: string) {
    isLoading.value = true
    try {
      searchResults.value = await api.userSearch(name, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUserConfig(uid: number) {
    isLoading.value = true
    try {
      currentConfig.value = await api.userConfigGet(uid)
    } finally {
      isLoading.value = false
    }
  }

  return {
    userHome, searchResults, currentConfig, isLoading,
    fetchUserHome, searchUser, fetchUserConfig
  }
})
