/**
 * 강사 Zustand 스토어
 * Phase 1.2: 강사 데이터 상태 관리
 */

import { create } from 'zustand'
import type { Instructor, UUID, PaginatedResponse } from '../types'
import type { InstructorListParams, InstructorFilters } from '../services/mock/instructorService'
import * as instructorService from '../services/mock/instructorService'

interface InstructorStore {
  // 목록 데이터
  instructors: Instructor[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: InstructorFilters
  sortBy: 'name' | 'region' | 'rating' | 'createdAt'
  sortOrder: 'asc' | 'desc'

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 필터/정렬 옵션
  regions: string[]
  specialties: string[]

  // 액션
  fetchInstructors: (params?: Partial<InstructorListParams>) => Promise<void>
  fetchInstructorById: (id: UUID) => Promise<Instructor | null>
  createInstructor: (data: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateInstructor: (id: UUID, data: Partial<Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteInstructor: (id: UUID) => Promise<void>
  setFilters: (filters: Partial<InstructorFilters>) => void
  setSort: (sortBy: 'name' | 'region' | 'rating' | 'createdAt', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  fetchOptions: () => Promise<void> // 지역/전문분야 목록 조회
}

export const useInstructorStore = create<InstructorStore>((set, get) => ({
  // 초기 상태
  instructors: [],
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
  specialties: [],

  // 목록 조회
  fetchInstructors: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const result: PaginatedResponse<Instructor> = await instructorService.getInstructors({
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...params,
      })

      set({
        instructors: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchInstructorById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const instructor = await instructorService.getInstructorById(id)
      set({ isLoading: false })
      return instructor
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사 상세 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createInstructor: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await instructorService.createInstructor(data)
      // 목록 새로고침
      await get().fetchInstructors()
      set({ isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 수정
  updateInstructor: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await instructorService.updateInstructor(id, data)
      // 목록 새로고침
      await get().fetchInstructors()
      set({ isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 삭제
  deleteInstructor: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await instructorService.deleteInstructor(id)
      // 목록 새로고침
      await get().fetchInstructors()
      set({ isLoading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사 삭제에 실패했습니다'
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

  // 옵션 조회 (지역/전문분야)
  fetchOptions: async () => {
    try {
      const [regions, specialties] = await Promise.all([
        instructorService.getRegions(),
        instructorService.getSpecialties(),
      ])
      set({ regions, specialties })
    } catch (error) {
      console.error('옵션 조회 실패:', error)
    }
  },
}))

