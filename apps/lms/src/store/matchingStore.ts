/**
 * 매칭 Zustand 스토어
 * Phase 3.2: 매칭 데이터 상태 관리 및 강사 후보 제안
 */

import { create } from 'zustand'
import type { Matching, UUID } from '../types'
import type { MatchingListParams, MatchingFilters, InstructorCandidate } from '../services/mock/matchingService'
import * as matchingService from '../services/mock/matchingService'

interface MatchingStore {
  // 목록 데이터
  matchings: Matching[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: MatchingFilters
  sortBy: 'matchedAt' | 'status' | 'createdAt'
  sortOrder: 'asc' | 'desc'

  // 강사 후보 목록
  candidateInstructors: InstructorCandidate[]

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 액션
  fetchMatchings: (params?: Partial<MatchingListParams>) => Promise<void>
  fetchMatchingById: (id: UUID) => Promise<Matching | null>
  createMatching: (data: Omit<Matching, 'id' | 'createdAt' | 'updatedAt' | 'matchedAt' | 'history'>) => Promise<void>
  updateMatching: (id: UUID, data: Partial<Omit<Matching, 'id' | 'createdAt' | 'updatedAt' | 'matchedAt' | 'history'>>) => Promise<void>
  deleteMatching: (id: UUID) => Promise<void>
  suggestInstructorCandidates: (programId: UUID, roundId?: UUID, excludeInstructorIds?: UUID[]) => Promise<void>
  getMatchingsByProgram: (programId: UUID) => Promise<Matching[]>
  getMatchingsByInstructor: (instructorId: UUID) => Promise<Matching[]>
  setFilters: (filters: Partial<MatchingFilters>) => void
  setSort: (sortBy: 'matchedAt' | 'status' | 'createdAt', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

export const useMatchingStore = create<MatchingStore>((set, get) => ({
  // 초기 상태
  matchings: [],
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  },
  filters: {},
  sortBy: 'matchedAt',
  sortOrder: 'desc',
  candidateInstructors: [],
  isLoading: false,
  error: null,

  // 목록 조회
  fetchMatchings: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const requestParams: MatchingListParams = {
        page: params.page ?? state.pagination.page,
        pageSize: params.pageSize ?? state.pagination.pageSize,
        programId: params.programId ?? state.filters.programId,
        instructorId: params.instructorId ?? state.filters.instructorId,
        status: params.status ?? state.filters.status,
        search: params.search ?? state.filters.search,
        sortBy: params.sortBy ?? state.sortBy,
        sortOrder: params.sortOrder ?? state.sortOrder,
      }

      const response = await matchingService.getMatchings(requestParams)
      set({
        matchings: response.data,
        pagination: {
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '매칭 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchMatchingById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const matching = await matchingService.getMatchingById(id)
      set({ isLoading: false })
      return matching
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '매칭 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createMatching: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await matchingService.createMatching(data)
      // 목록 새로고침
      await get().fetchMatchings()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '매칭 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 수정
  updateMatching: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await matchingService.updateMatching(id, data)
      // 목록 새로고침
      await get().fetchMatchings()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '매칭 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 삭제
  deleteMatching: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await matchingService.deleteMatching(id)
      // 목록 새로고침
      await get().fetchMatchings()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '매칭 삭제에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 강사 후보 제안
  suggestInstructorCandidates: async (programId, roundId, excludeInstructorIds = []) => {
    set({ isLoading: true, error: null })
    try {
      const candidates = matchingService.suggestInstructorCandidates(programId, roundId, excludeInstructorIds)
      set({
        candidateInstructors: candidates,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사 후보 제안에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 프로그램별 매칭 조회
  getMatchingsByProgram: async (programId) => {
    set({ isLoading: true, error: null })
    try {
      const matchings = await matchingService.getMatchingsByProgram(programId)
      set({ isLoading: false })
      return matchings
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로그램별 매칭 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return []
    }
  },

  // 강사별 매칭 조회
  getMatchingsByInstructor: async (instructorId) => {
    set({ isLoading: true, error: null })
    try {
      const matchings = await matchingService.getMatchingsByInstructor(instructorId)
      set({ isLoading: false })
      return matchings
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사별 매칭 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return []
    }
  },

  // 필터 설정
  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
    }))
  },

  // 정렬 설정
  setSort: (sortBy, sortOrder) => {
    set({
      sortBy,
      sortOrder: sortOrder || 'desc',
    })
  },

  // 페이지 설정
  setPage: (page) => {
    set(state => ({
      pagination: { ...state.pagination, page },
    }))
  },

  // 페이지 크기 설정
  setPageSize: (pageSize) => {
    set(state => ({
      pagination: { ...state.pagination, pageSize, page: 1 },
    }))
  },
}))


