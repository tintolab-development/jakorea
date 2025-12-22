/**
 * 일정 Zustand 스토어
 * Phase 3.1: 일정 데이터 상태 관리 및 중복 감지
 */

import { create } from 'zustand'
import type { Schedule, UUID } from '../types'
import type { ScheduleListParams, ScheduleFilters } from '../services/mock/scheduleService'
import type { ScheduleConflict } from '../schemas/scheduleSchema'
import * as scheduleService from '../services/mock/scheduleService'

interface ScheduleStore {
  // 목록 데이터
  schedules: Schedule[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  filters: ScheduleFilters
  sortBy: 'date' | 'startTime' | 'createdAt'
  sortOrder: 'asc' | 'desc'

  // 로딩 상태
  isLoading: boolean
  error: string | null

  // 중복 감지 관련
  conflicts: ScheduleConflict[]

  // 액션
  fetchSchedules: (params?: Partial<ScheduleListParams>) => Promise<void>
  fetchScheduleById: (id: UUID) => Promise<Schedule | null>
  createSchedule: (
    data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ schedule: Schedule; conflicts: ScheduleConflict[] }>
  updateSchedule: (
    id: UUID,
    data: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>
  ) => Promise<{ schedule: Schedule; conflicts: ScheduleConflict[] }>
  deleteSchedule: (id: UUID) => Promise<void>
  detectConflicts: (
    schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> | Schedule,
    excludeId?: UUID
  ) => ScheduleConflict[]
  getSchedulesByInstructor: (instructorId: UUID) => Promise<Schedule[]>
  setFilters: (filters: Partial<ScheduleFilters>) => void
  setSort: (sortBy: 'date' | 'startTime' | 'createdAt', sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  clearConflicts: () => void
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  // 초기 상태
  schedules: [],
  pagination: {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  },
  filters: {},
  sortBy: 'date',
  sortOrder: 'asc',
  isLoading: false,
  error: null,
  conflicts: [],

  // 목록 조회
  fetchSchedules: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const state = get()
      const requestParams: ScheduleListParams = {
        page: params.page ?? state.pagination.page,
        pageSize: params.pageSize ?? state.pagination.pageSize,
        programId: params.programId ?? state.filters.programId,
        instructorId: params.instructorId ?? state.filters.instructorId,
        startDate: params.startDate ?? state.filters.startDate,
        endDate: params.endDate ?? state.filters.endDate,
        search: params.search ?? state.filters.search,
        sortBy: params.sortBy ?? state.sortBy,
        sortOrder: params.sortOrder ?? state.sortOrder,
      }

      const response = await scheduleService.getSchedules(requestParams)
      set({
        schedules: response.data,
        pagination: {
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        },
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 목록 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
    }
  },

  // 상세 조회
  fetchScheduleById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const schedule = await scheduleService.getScheduleById(id)
      set({ isLoading: false })
      return schedule
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 조회에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      return null
    }
  },

  // 생성
  createSchedule: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const result = await scheduleService.createSchedule(data)
      // 목록 새로고침
      await get().fetchSchedules()
      set({
        conflicts: result.conflicts,
        isLoading: false,
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 등록에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 수정
  updateSchedule: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const result = await scheduleService.updateSchedule(id, data)
      // 목록 새로고침
      await get().fetchSchedules()
      set({
        conflicts: result.conflicts,
        isLoading: false,
      })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 수정에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 삭제
  deleteSchedule: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await scheduleService.deleteSchedule(id)
      // 목록 새로고침
      await get().fetchSchedules()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '일정 삭제에 실패했습니다'
      set({
        error: errorMessage,
        isLoading: false,
      })
      throw error
    }
  },

  // 중복 감지
  detectConflicts: (schedule, excludeId) => {
    const conflicts = scheduleService.detectConflicts(schedule, excludeId)
    set({ conflicts })
    return conflicts
  },

  // 강사별 일정 조회
  getSchedulesByInstructor: async (instructorId) => {
    set({ isLoading: true, error: null })
    try {
      const schedules = await scheduleService.getSchedulesByInstructor(instructorId)
      set({ isLoading: false })
      return schedules
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '강사 일정 조회에 실패했습니다'
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
      sortOrder: sortOrder || 'asc',
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

  // 중복 감지 결과 초기화
  clearConflicts: () => {
    set({ conflicts: [] })
  },
}))






