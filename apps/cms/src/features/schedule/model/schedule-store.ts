/**
 * 일정 Zustand 스토어
 * Phase 3.1: 상태 관리
 */

import { create } from 'zustand'
import type { Schedule } from '@/types/domain'
import { scheduleService } from '@/entities/schedule/api/schedule-service'

interface ScheduleState {
  schedules: Schedule[]
  selectedSchedule: Schedule | null
  loading: boolean
  error: Error | null
  fetchSchedules: () => Promise<void>
  fetchSchedulesByDateRange: (startDate: string, endDate: string) => Promise<void>
  fetchScheduleById: (id: string) => Promise<void>
  createSchedule: (data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSchedule: (id: string, data: Partial<Omit<Schedule, 'id' | 'createdAt'>>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  checkConflict: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>, excludeId?: string) => Schedule[]
  setSelectedSchedule: (schedule: Schedule | null) => void
  clearError: () => void
}

export const useScheduleStore = create<ScheduleState>(set => ({
  schedules: [],
  selectedSchedule: null,
  loading: false,
  error: null,

  fetchSchedules: async () => {
    set({ loading: true, error: null })
    try {
      const schedules = await scheduleService.getAll()
      set({ schedules, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchSchedulesByDateRange: async (startDate: string, endDate: string) => {
    set({ loading: true, error: null })
    try {
      const schedules = await scheduleService.getByDateRange(startDate, endDate)
      set({ schedules, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  fetchScheduleById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const schedule = await scheduleService.getById(id)
      set({ selectedSchedule: schedule, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  createSchedule: async (data) => {
    set({ loading: true, error: null })
    try {
      const newSchedule = await scheduleService.create(data)
      set(state => ({
        schedules: [...state.schedules, newSchedule],
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  updateSchedule: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedSchedule = await scheduleService.update(id, data)
      set(state => ({
        schedules: state.schedules.map(s => (s.id === id ? updatedSchedule : s)),
        selectedSchedule: state.selectedSchedule?.id === id ? updatedSchedule : state.selectedSchedule,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  deleteSchedule: async (id) => {
    set({ loading: true, error: null })
    try {
      await scheduleService.delete(id)
      set(state => ({
        schedules: state.schedules.filter(s => s.id !== id),
        selectedSchedule: state.selectedSchedule?.id === id ? null : state.selectedSchedule,
        loading: false,
      }))
    } catch (error) {
      set({ error: error as Error, loading: false })
      throw error
    }
  },

  checkConflict: (schedule, excludeId) => {
    return scheduleService.checkConflict(schedule, excludeId)
  },

  setSelectedSchedule: (schedule) => set({ selectedSchedule: schedule }),

  clearError: () => set({ error: null }),
}))





