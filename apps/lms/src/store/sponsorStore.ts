/**
 * 스폰서 Zustand 스토어
 * Phase 1.3: 스폰서 데이터 상태 관리
 */

import { create } from 'zustand'
import type { Sponsor, UUID, PaginatedResponse } from '../types'
import type { SponsorListParams, SponsorFilters } from '../services/mock/sponsorService'
import * as sponsorService from '../services/mock/sponsorService'

interface SponsorStore {
  // 목록 데이터
  sponsors: Sponsor[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: SponsorFilters
  sortBy: 'name' | 'createdAt'
  sortOrder: 'asc' | 'desc'

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 액션
  fetchSponsors: (params?: Partial<SponsorListParams>) => Promise<void>
  fetchSponsorById: (id: UUID) => Promise<Sponsor | null>
  createSponsor: (data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSponsor: (id: UUID, data: Partial<Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteSponsor: (id: UUID) => Promise<void>
  setFilters: (filters: Partial<SponsorFilters>) => void
  setSort: (sortBy: 'name' | 'createdAt', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

export const useSponsorStore = create<SponsorStore>((set, get) => ({
  // 초기 상태
  sponsors: [],
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
  fetchSponsors: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const result: PaginatedResponse<Sponsor> = await sponsorService.getSponsors({
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...params,
      })

      set({
        sponsors: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '스폰서 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchSponsorById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const sponsor = await sponsorService.getSponsorById(id)
      set({ isLoading: false })
      return sponsor
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '스폰서 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createSponsor: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await sponsorService.createSponsor(data)
      // 목록 새로고침
      await get().fetchSponsors()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '스폰서 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 수정
  updateSponsor: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await sponsorService.updateSponsor(id, data)
      // 목록 새로고침
      await get().fetchSponsors()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '스폰서 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 삭제
  deleteSponsor: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await sponsorService.deleteSponsor(id)
      // 목록 새로고침
      await get().fetchSponsors()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '스폰서 삭제에 실패했습니다'
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

