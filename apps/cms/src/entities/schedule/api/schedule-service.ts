/**
 * 일정 Mock 서비스
 * Phase 3.1: Mock API 서비스 + 중복 감지 로직
 */

import type { Schedule } from '@/types/domain'
import { mockSchedules, mockSchedulesMap } from '@/data/mock'

export const scheduleService = {
  getAll: async (): Promise<Schedule[]> => {
    return Promise.resolve(mockSchedules)
  },

  getById: async (id: string): Promise<Schedule> => {
    const schedule = mockSchedulesMap.get(id)
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`)
    }
    return Promise.resolve(schedule)
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<Schedule[]> => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Promise.resolve(
      mockSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date)
        return scheduleDate >= start && scheduleDate <= end
      })
    )
  },

  create: async (data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> => {
    const newSchedule: Schedule = {
      ...data,
      id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockSchedules.push(newSchedule)
    mockSchedulesMap.set(newSchedule.id, newSchedule)
    return Promise.resolve(newSchedule)
  },

  update: async (id: string, data: Partial<Omit<Schedule, 'id' | 'createdAt'>>): Promise<Schedule> => {
    const schedule = mockSchedulesMap.get(id)
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`)
    }
    const updatedSchedule: Schedule = {
      ...schedule,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    const index = mockSchedules.findIndex(s => s.id === id)
    if (index !== -1) {
      mockSchedules[index] = updatedSchedule
    }
    mockSchedulesMap.set(id, updatedSchedule)
    return Promise.resolve(updatedSchedule)
  },

  delete: async (id: string): Promise<void> => {
    const index = mockSchedules.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`Schedule not found: ${id}`)
    }
    mockSchedules.splice(index, 1)
    mockSchedulesMap.delete(id)
    return Promise.resolve()
  },

  /**
   * 일정 중복 감지 (동일 강사 동일 시간대)
   */
  checkConflict: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>, excludeId?: string): Schedule[] => {
    if (!schedule.instructorId) {
      return []
    }

    const scheduleDate = new Date(schedule.date)
    const scheduleStart = new Date(`${schedule.date}T${schedule.startTime}:00`)
    const scheduleEnd = new Date(`${schedule.date}T${schedule.endTime}:00`)

    return mockSchedules.filter(s => {
      if (excludeId && s.id === excludeId) {
        return false
      }
      if (!s.instructorId || s.instructorId !== schedule.instructorId) {
        return false
      }

      const sDate = new Date(s.date)
      if (sDate.toDateString() !== scheduleDate.toDateString()) {
        return false
      }

      const sStart = new Date(`${s.date}T${s.startTime}:00`)
      const sEnd = new Date(`${s.date}T${s.endTime}:00`)

      // 시간 겹침 체크
      return (
        (scheduleStart >= sStart && scheduleStart < sEnd) ||
        (scheduleEnd > sStart && scheduleEnd <= sEnd) ||
        (scheduleStart <= sStart && scheduleEnd >= sEnd)
      )
    })
  },
}




