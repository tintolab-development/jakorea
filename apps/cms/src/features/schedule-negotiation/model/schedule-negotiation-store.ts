/**
 * 일정 협의 Zustand Store
 * V3 Phase 8: 일정 협의 관리
 */

import { create } from 'zustand'
import type { ScheduleNegotiation } from '@/types/domain'
import type { UUID } from '@/types'
import { scheduleNegotiationService } from '@/entities/schedule-negotiation/api/schedule-negotiation-service'

interface ScheduleNegotiationStore {
  items: ScheduleNegotiation[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  create: (
    data: Omit<ScheduleNegotiation, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<ScheduleNegotiation>
  update: (
    id: UUID,
    data: Partial<Omit<ScheduleNegotiation, 'id' | 'createdAt'>>
  ) => Promise<ScheduleNegotiation>
  delete: (id: UUID) => Promise<void>
}

export const useScheduleNegotiationStore = create<ScheduleNegotiationStore>(set => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const items = await scheduleNegotiationService.getAll()
      set({ items, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '일정 협의 조회 실패',
        loading: false,
      })
    }
  },

  create: async data => {
    set({ loading: true, error: null })
    try {
      const newItem = await scheduleNegotiationService.create(data)
      set(state => ({ items: [...state.items, newItem], loading: false }))
      return newItem
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '일정 협의 생성 실패',
        loading: false,
      })
      throw error
    }
  },

  update: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updated = await scheduleNegotiationService.update(id, data)
      set(state => ({
        items: state.items.map(item => (item.id === id ? updated : item)),
        loading: false,
      }))
      return updated
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '일정 협의 수정 실패',
        loading: false,
      })
      throw error
    }
  },

  delete: async id => {
    set({ loading: true, error: null })
    try {
      await scheduleNegotiationService.delete(id)
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '일정 협의 삭제 실패',
        loading: false,
      })
      throw error
    }
  },
}))


