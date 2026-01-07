/**
 * 일정 협의 Mock API 서비스
 * V3 Phase 8: 일정 협의 관리
 */

import type { ScheduleNegotiation } from '@/types/domain'
import type { UUID } from '@/types'
import { mockScheduleNegotiations, mockScheduleNegotiationsMap } from '@/data/mock'

export const scheduleNegotiationService = {
  getAll: async (): Promise<ScheduleNegotiation[]> => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return [...mockScheduleNegotiations]
  },
  getById: async (id: UUID): Promise<ScheduleNegotiation | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 50))
    return mockScheduleNegotiationsMap.get(id)
  },
  create: async (
    data: Omit<ScheduleNegotiation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduleNegotiation> => {
    await new Promise(resolve => setTimeout(resolve, 150))
    const newItem: ScheduleNegotiation = {
      ...data,
      id: `nego-${String(mockScheduleNegotiations.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockScheduleNegotiations.push(newItem)
    mockScheduleNegotiationsMap.set(newItem.id, newItem)
    return newItem
  },
  update: async (
    id: UUID,
    data: Partial<Omit<ScheduleNegotiation, 'id' | 'createdAt'>>
  ): Promise<ScheduleNegotiation> => {
    await new Promise(resolve => setTimeout(resolve, 150))
    const existing = mockScheduleNegotiationsMap.get(id)
    if (!existing) {
      throw new Error(`일정 협의를 찾을 수 없습니다: ${id}`)
    }
    const updated: ScheduleNegotiation = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    const index = mockScheduleNegotiations.findIndex(n => n.id === id)
    if (index !== -1) mockScheduleNegotiations[index] = updated
    mockScheduleNegotiationsMap.set(id, updated)
    return updated
  },
  delete: async (id: UUID): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100))
    const index = mockScheduleNegotiations.findIndex(n => n.id === id)
    if (index !== -1) mockScheduleNegotiations.splice(index, 1)
    mockScheduleNegotiationsMap.delete(id)
  },
}


