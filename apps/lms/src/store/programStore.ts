/**
 * 프로그램 Zustand 스토어
 * Phase 2.1: 프로그램 데이터 상태 관리
 */

import { create } from 'zustand'
import type { Program, UUID } from '../types'
import type { ProgramListParams, ProgramFilters } from '../services/mock/programService'
import * as programService from '../services/mock/programService'

interface ProgramStore {
  // 목록 데이터
  programs: Program[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: ProgramFilters
  sortBy: 'title' | 'status' | 'startDate' | 'createdAt'
  sortOrder: 'asc' | 'desc'

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 액션
  fetchPrograms: (params?: Partial<ProgramListParams>) => Promise<void>
  fetchProgramById: (id: UUID) => Promise<Program | null>
  createProgram: (data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProgram: (id: UUID, data: Partial<Omit<Program, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteProgram: (id: UUID) => Promise<void>
  setFilters: (filters: Partial<ProgramFilters>) => void
  setSort: (sortBy: 'title' | 'status' | 'startDate' | 'createdAt', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

export const useProgramStore = create<ProgramStore>((set, get) => ({
  // 초기 상태
  programs: [],
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

  // 목록 조회
  fetchPrograms: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const result = await programService.getPrograms({
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
        search: state.filters.search,
        sponsorId: state.filters.sponsorId,
        type: state.filters.type,
        format: state.filters.format,
        status: state.filters.status,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...params,
      })

      set({
        programs: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로그램 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchProgramById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const program = await programService.getProgramById(id)
      set({ isLoading: false })
      return program
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로그램 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createProgram: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await programService.createProgram(data)
      // 목록 새로고침
      await get().fetchPrograms()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로그램 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 수정
  updateProgram: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await programService.updateProgram(id, data)
      // 목록 새로고침
      await get().fetchPrograms()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로그램 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 삭제
  deleteProgram: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await programService.deleteProgram(id)
      // 목록 새로고침
      await get().fetchPrograms()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로그램 삭제에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
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
      pagination: { ...get().pagination, page: 1 }, // 정렬 변경 시 첫 페이지로
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
}))

