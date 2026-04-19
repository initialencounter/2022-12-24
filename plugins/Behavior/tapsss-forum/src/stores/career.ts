import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as api from '@/api'
import type { MinesweeperCareerResponse } from '@/types/response/MinesweeperCareerResponse'
import type { SudokuCareerResponse } from '@/types/response/SudokuCareerResponse'
import type { PuzzleCareerResponse } from '@/types/response/PuzzleCareerResponse'
import type { NonoCareerResponse } from '@/types/response/NonoCareerResponse'
import type { TzfeCareerResponse } from '@/types/response/TzfeCareerResponse'
import type { SchulteCareerResponse } from '@/types/response/SchulteCareerResponse'

export const useCareerStore = defineStore('career', () => {
  const minesweeper = ref<MinesweeperCareerResponse | null>(null)
  const sudoku = ref<SudokuCareerResponse | null>(null)
  const puzzle = ref<PuzzleCareerResponse | null>(null)
  const nono = ref<NonoCareerResponse | null>(null)
  const tzfe = ref<TzfeCareerResponse | null>(null)
  const schulte = ref<SchulteCareerResponse | null>(null)

  const isLoading = ref(false)

  async function fetchMinesweeperCareer(uid: number) {
    isLoading.value = true
    try {
      minesweeper.value = await api.minesweeperCareer(uid)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSudokuCareer(targetUid: number) {
    isLoading.value = true
    try {
      sudoku.value = await api.sudokuCareer(targetUid)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPuzzleCareer(uid: number) {
    isLoading.value = true
    try {
      puzzle.value = await api.puzzleCareer(uid)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchNonoCareer(uid: number) {
    isLoading.value = true
    try {
      nono.value = await api.nonoCareer(uid)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTzfeCareer(targetUid: number) {
    isLoading.value = true
    try {
      tzfe.value = await api.tzfeCareer(targetUid)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSchulteCareer(targetUid: number) {
    isLoading.value = true
    try {
      schulte.value = await api.schulteCareer(targetUid)
    } finally {
      isLoading.value = false
    }
  }

  return {
    minesweeper, sudoku, puzzle, nono, tzfe, schulte, isLoading,
    fetchMinesweeperCareer, fetchSudokuCareer, fetchPuzzleCareer,
    fetchNonoCareer, fetchTzfeCareer, fetchSchulteCareer
  }
})
