/**
 * 신청 Zustand 스토어
 * Phase 2.2: 신청 데이터 상태 관리 및 상태 전이
 */

import { create } from 'zustand'
import type { Application, UUID } from '../types'
import type { ApplicationListParams, ApplicationFilters } from '../services/mock/applicationService'
import * as applicationService from '../services/mock/applicationService'

interface ApplicationStore {
  // 목록 데이터
  applications: Application[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: ApplicationFilters
  sortBy: 'submittedAt' | 'status' | 'createdAt'
  sortOrder: 'asc' | 'desc'

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 액션
  fetchApplications: (params?: Partial<ApplicationListParams>) => Promise<void>
  fetchApplicationById: (id: UUID) => Promise<Application | null>
  createApplication: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateApplication: (id: UUID, data: Partial<Omit<Application, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteApplication: (id: UUID) => Promise<void>
  updateApplicationStatus: (id: UUID, status: Application['status']) => Promise<void>
  setFilters: (filters: Partial<ApplicationFilters>) => void
  setSort: (sortBy: 'submittedAt' | 'status' | 'createdAt', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  // 초기 상태
  applications: [],
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  },
  filters: {},
  sortBy: 'submittedAt',
  sortOrder: 'desc',

  isLoading: false,
  error: null,

  // 목록 조회
  fetchApplications: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const requestParams: ApplicationListParams = {
        page: params.page ?? state.pagination.page,
        pageSize: params.pageSize ?? state.pagination.pageSize,
        search: params.search ?? state.filters.search,
        programId: params.programId ?? state.filters.programId,
        subjectType: params.subjectType ?? state.filters.subjectType,
        status: params.status ?? state.filters.status,
        sortBy: params.sortBy ?? state.sortBy,
        sortOrder: params.sortOrder ?? state.sortOrder,
      }

      const response = await applicationService.getApplications(requestParams)
      set({
        applications: response.data,
        pagination: {
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '신청 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchApplicationById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const application = await applicationService.getApplicationById(id)
      set({ isLoading: false })
      return application
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '신청 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createApplication: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await applicationService.createApplication(data)
      // 목록 새로고침
      await get().fetchApplications()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '신청 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 수정
  updateApplication: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await applicationService.updateApplication(id, data)
      // 목록 새로고침
      await get().fetchApplications()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '신청 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 삭제
  deleteApplication: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await applicationService.deleteApplication(id)
      // 목록 새로고침
      await get().fetchApplications()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '신청 삭제에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 상태 변경
  updateApplicationStatus: async (id, status) => {
    set({ isLoading: true, error: null })
    try {
      await applicationService.updateApplicationStatus(id, status)
      // 목록 새로고침
      await get().fetchApplications()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '신청 상태 변경에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
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

