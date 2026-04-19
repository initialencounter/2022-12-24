import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/api'
import type { RecordGetResponse } from '@/types/response/RecordGet'
import type { PuzzleRecordGetResponse } from '@/types/response/PuzzleRecordGetResponse'
import type { SchulteRecordGetResponse } from '@/types/response/SchulteRecordGetResponse'
import type { MinesweeperRecordListResponse } from '@/types/response/MinesweeperRecordListResponse'
import type { SchulteRecordListFilterResponse } from '@/types/response/SchulteRecordListFilterResponse'
import type { PuzzleRecordListFilterResponse } from '@/types/response/PuzzleRecordListFilterResponse'
import type { TzfeRecordListFilterResponse } from '@/types/response/TzfeRecordListFilterResponse'
import type { NonoRecordListFilterResponse } from '@/types/response/NonoRecordListFilterResponse'

export const useRecordStore = defineStore('record', () => {
  const currentRecord = ref<RecordGetResponse | PuzzleRecordGetResponse | SchulteRecordGetResponse | null>(null)

  const minesweeperRecordList = ref<MinesweeperRecordListResponse | null>(null)
  const schulteRecordList = ref<SchulteRecordListFilterResponse | null>(null)
  const puzzleRecordList = ref<PuzzleRecordListFilterResponse | null>(null)
  const tzfeRecordList = ref<TzfeRecordListFilterResponse | null>(null)
  const nonoRecordList = ref<NonoRecordListFilterResponse | null>(null)

  const isLoading = ref(false)

  async function fetchMinesweeperRecord(recordId: number) {
    isLoading.value = true
    try {
      currentRecord.value = await api.minesweeperRecordGet(recordId)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPuzzleRecord(recordId: number) {
    isLoading.value = true
    try {
      currentRecord.value = await api.puzzleRecordGetResponse(recordId)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSchulteRecord(recordId: number) {
    isLoading.value = true
    try {
      currentRecord.value = await api.schulteRecordGet(recordId)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMinesweeperRecordList(userId: string, page: number, count: number) {
    isLoading.value = true
    try {
      minesweeperRecordList.value = await api.minesweeperRecordList(userId, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSchulteRecordList(userId: string, page: number, count: number) {
    isLoading.value = true
    try {
      schulteRecordList.value = await api.schulteRecordListFilter(userId, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPuzzleRecordList(userId: string, page: number, count: number) {
    isLoading.value = true
    try {
      puzzleRecordList.value = await api.puzzleRecordListFilter(userId, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTzfeRecordList(userId: string, page: number, count: number) {
    isLoading.value = true
    try {
      tzfeRecordList.value = await api.tzfeRecordListFilter(userId, page, count)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchNonoRecordList(userId: string, page: number, count: number) {
    isLoading.value = true
    try {
      nonoRecordList.value = await api.nonoRecordListFilter(userId, page, count)
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentRecord, minesweeperRecordList, schulteRecordList, puzzleRecordList, tzfeRecordList, nonoRecordList, isLoading,
    fetchMinesweeperRecord, fetchPuzzleRecord, fetchSchulteRecord,
    fetchMinesweeperRecordList, fetchSchulteRecordList, fetchPuzzleRecordList, fetchTzfeRecordList, fetchNonoRecordList
  }
})
