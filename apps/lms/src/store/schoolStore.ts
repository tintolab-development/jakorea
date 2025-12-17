/**
 * 학교 Zustand 스토어
 * Phase 1.4: 학교 데이터 상태 관리
 */

import { create } from 'zustand'
import type { School, UUID, PaginatedResponse } from '../types'
import type { SchoolListParams, SchoolFilters } from '../services/mock/schoolService'
import * as schoolService from '../services/mock/schoolService'

interface SchoolStore {
  // 목록 데이터
  schools: School[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: SchoolFilters
  sortBy: 'name' | 'region' | 'createdAt'
  sortOrder: 'asc' | 'desc'

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 필터 옵션
  regions: string[]

  // 액션
  fetchSchools: (params?: Partial<SchoolListParams>) => Promise<void>
  fetchSchoolById: (id: UUID) => Promise<School | null>
  createSchool: (data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSchool: (id: UUID, data: Partial<Omit<School, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteSchool: (id: UUID) => Promise<void>
  setFilters: (filters: Partial<SchoolFilters>) => void
  setSort: (sortBy: 'name' | 'region' | 'createdAt', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  fetchOptions: () => Promise<void> // 지역 목록 조회
}

export const useSchoolStore = create<SchoolStore>((set, get) => ({
  // 초기 상태
  schools: [],
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  },
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  isLoading: false,
  error: null,
  regions: [],

  // 목록 조회
  fetchSchools: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const result: PaginatedResponse<School> = await schoolService.getSchools({
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...params,
      })

      set({
        schools: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '학교 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchSchoolById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const school = await schoolService.getSchoolById(id)
      set({ isLoading: false })
      return school
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '학교 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createSchool: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await schoolService.createSchool(data)
      // 목록 새로고침
      await get().fetchSchools()
      set({ isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '학교 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 수정
  updateSchool: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await schoolService.updateSchool(id, data)
      // 목록 새로고침
      await get().fetchSchools()
      set({ isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '학교 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 삭제
  deleteSchool: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await schoolService.deleteSchool(id)
      // 목록 새로고침
      await get().fetchSchools()
      set({ isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '학교 삭제에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 필터 설정
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }, // 필터 변경 시 첫 페이지로
    }))
  },

  // 정렬 설정
  setSort: (sortBy, sortOrder) => {
    set({
      sortBy,
      sortOrder: sortOrder ?? (get().sortBy === sortBy && get().sortOrder === 'asc' ? 'desc' : 'asc'),
    })
  },

  // 페이지 설정
  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }))
  },

  // 페이지 크기 설정
  setPageSize: (pageSize) => {
    set((state) => ({
      pagination: { ...state.pagination, pageSize, page: 1 }, // 페이지 크기 변경 시 첫 페이지로
    }))
  },

  // 옵션 조회 (지역)
  fetchOptions: async () => {
    try {
      const regions = await schoolService.getRegions()
      set({ regions })
    } catch (error) {
      console.error('옵션 조회 실패:', error)
    }
  },
}))

