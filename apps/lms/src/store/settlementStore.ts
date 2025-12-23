/**
 * 정산 Zustand 스토어
 * Phase 4: 정산 데이터 상태 관리 및 Excel 문서 생성
 */

import { create } from 'zustand'
import type { Settlement, UUID } from '../types'
import type { SettlementListParams, SettlementFilters } from '../services/mock/settlementService'
import * as settlementService from '../services/mock/settlementService'

interface SettlementStore {
  // 목록 데이터
  settlements: Settlement[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: SettlementFilters
  sortBy: 'createdAt' | 'totalAmount' | 'status'
  sortOrder: 'asc' | 'desc'

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 액션
  fetchSettlements: (params?: Partial<SettlementListParams>) => Promise<void>
  fetchSettlementById: (id: UUID) => Promise<Settlement | null>
  createSettlement: (data: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt' | 'documentGeneratedAt'>) => Promise<void>
  updateSettlement: (id: UUID, data: Partial<Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  deleteSettlement: (id: UUID) => Promise<void>
  calculateSettlement: (programId: UUID, instructorId: UUID, matchingId: UUID, baseHours?: number) => Promise<import('../types').SettlementItem[]>
  generateSettlementExcel: (settlementId: UUID) => Promise<Blob>
  getSettlementsByProgram: (programId: UUID) => Promise<Settlement[]>
  getSettlementsByInstructor: (instructorId: UUID) => Promise<Settlement[]>
  getSettlementsByMatching: (matchingId: UUID) => Promise<Settlement[]>
  setFilters: (filters: Partial<SettlementFilters>) => void
  setSort: (sortBy: 'createdAt' | 'totalAmount' | 'status', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

export const useSettlementStore = create<SettlementStore>((set, get) => ({
  // 초기 상태
  settlements: [],
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
  fetchSettlements: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const requestParams: SettlementListParams = {
        page: params.page ?? state.pagination.page,
        pageSize: params.pageSize ?? state.pagination.pageSize,
        programId: params.programId ?? state.filters.programId,
        instructorId: params.instructorId ?? state.filters.instructorId,
        matchingId: params.matchingId ?? state.filters.matchingId,
        status: params.status ?? state.filters.status,
        period: params.period ?? state.filters.period,
        search: params.search ?? state.filters.search,
        sortBy: params.sortBy ?? state.sortBy,
        sortOrder: params.sortOrder ?? state.sortOrder,
      }

      const response = await settlementService.getSettlements(requestParams)
      set({
        settlements: response.data,
        pagination: {
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '정산 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchSettlementById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const settlement = await settlementService.getSettlementById(id)
      set({ isLoading: false })
      return settlement
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '정산 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createSettlement: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await settlementService.createSettlement(data)
      // 목록 새로고침
      await get().fetchSettlements()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '정산 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 수정
  updateSettlement: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await settlementService.updateSettlement(id, data)
      // 목록 새로고침
      await get().fetchSettlements()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '정산 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 삭제
  deleteSettlement: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await settlementService.deleteSettlement(id)
      // 목록 새로고침
      await get().fetchSettlements()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '정산 삭제에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 정산 산출
  calculateSettlement: async (programId, instructorId, matchingId, baseHours = 1) => {
    set({ isLoading: true, error: null })
    try {
      const items = settlementService.calculateSettlement(programId, instructorId, matchingId, baseHours)
      set({ isLoading: false })
      return items
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '정산 산출에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // Excel 문서 생성
  generateSettlementExcel: async (settlementId) => {
    set({ isLoading: true, error: null })
    try {
      const blob = await settlementService.generateSettlementExcel(settlementId)
      set({ isLoading: false })
      return blob
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '정산 문서 생성에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 프로그램별 정산 조회
  getSettlementsByProgram: async (programId) => {
    set({ isLoading: true, error: null })
    try {
      const settlements = await settlementService.getSettlementsByProgram(programId)
      set({ isLoading: false })
      return settlements
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '프로그램별 정산 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return []
    }
  },

  // 강사별 정산 조회
  getSettlementsByInstructor: async (instructorId) => {
    set({ isLoading: true, error: null })
    try {
      const settlements = await settlementService.getSettlementsByInstructor(instructorId)
      set({ isLoading: false })
      return settlements
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사별 정산 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return []
    }
  },

  // 매칭별 정산 조회
  getSettlementsByMatching: async (matchingId) => {
    set({ isLoading: true, error: null })
    try {
      const settlements = await settlementService.getSettlementsByMatching(matchingId)
      set({ isLoading: false })
      return settlements
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '매칭별 정산 조회에 실패했습니다'
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







