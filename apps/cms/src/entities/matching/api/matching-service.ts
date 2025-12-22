/**
 * Matching API 서비스 (Mock)
 * Phase 3.2: 강사 매칭 관리
 */

import type { Matching } from '@/types/domain'
import type { UUID } from '@/types'

export interface MatchingFormData {
  programId: string
  roundId: string
  instructorId: string
  scheduleId?: string
  status: Matching['status']
}
import { mockMatchings, mockMatchingsMap } from '@/data/mock'

export const matchingService = {
  /**
   * 모든 매칭 조회
   */
  async getAll(): Promise<Matching[]> {
    // Mock: 약간의 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100))
    return Promise.resolve([...mockMatchings])
  },

  /**
   * ID로 매칭 조회
   */
  async getById(id: UUID): Promise<Matching> {
    await new Promise(resolve => setTimeout(resolve, 50))
    const matching = mockMatchingsMap.get(id)
    if (!matching) {
      throw new Error(`Matching with id ${id} not found`)
    }
    return Promise.resolve(matching)
  },

  /**
   * 프로그램 ID로 매칭 조회
   */
  async getByProgramId(programId: UUID): Promise<Matching[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return Promise.resolve(mockMatchings.filter(m => m.programId === programId))
  },

  /**
   * 회차 ID로 매칭 조회
   */
  async getByRoundId(roundId: UUID): Promise<Matching[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return Promise.resolve(mockMatchings.filter(m => m.roundId === roundId))
  },

  /**
   * 강사 ID로 매칭 조회
   */
  async getByInstructorId(instructorId: UUID): Promise<Matching[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return Promise.resolve(mockMatchings.filter(m => m.instructorId === instructorId))
  },

  /**
   * 매칭 생성
   */
  async create(data: MatchingFormData): Promise<Matching> {
    await new Promise(resolve => setTimeout(resolve, 200))
    const newMatching: Matching = {
      id: `matching-${Date.now()}`,
      programId: data.programId,
      roundId: data.roundId,
      instructorId: data.instructorId,
      scheduleId: data.scheduleId,
      status: data.status,
      matchedAt: new Date().toISOString(),
      history: [
        {
          id: `history-${Date.now()}`,
          matchingId: `matching-${Date.now()}`,
          action: 'created',
          changedAt: new Date().toISOString(),
          changedBy: 'system',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockMatchings.push(newMatching)
    mockMatchingsMap.set(newMatching.id, newMatching)
    return Promise.resolve(newMatching)
  },

  /**
   * 매칭 수정
   */
  async update(id: UUID, data: Partial<MatchingFormData>): Promise<Matching> {
    await new Promise(resolve => setTimeout(resolve, 200))
    const matching = mockMatchingsMap.get(id)
    if (!matching) {
      throw new Error(`Matching with id ${id} not found`)
    }

    const updatedMatching: Matching = {
      ...matching,
      ...data,
      updatedAt: new Date().toISOString(),
      history: [
        ...(matching.history || []),
        {
          id: `history-${Date.now()}`,
          matchingId: id,
          action: data.status && data.status !== matching.status ? 'updated' : 'updated',
          previousValue: matching.status,
          newValue: data.status || matching.status,
          changedAt: new Date().toISOString(),
          changedBy: 'system',
        },
      ],
    }

    const index = mockMatchings.findIndex(m => m.id === id)
    if (index !== -1) {
      mockMatchings[index] = updatedMatching
    }
    mockMatchingsMap.set(id, updatedMatching)
    return Promise.resolve(updatedMatching)
  },

  /**
   * 매칭 삭제
   */
  async delete(id: UUID): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
    const index = mockMatchings.findIndex(m => m.id === id)
    if (index !== -1) {
      mockMatchings.splice(index, 1)
    }
    mockMatchingsMap.delete(id)
    return Promise.resolve()
  },

  /**
   * 매칭 확정
   */
  async confirm(id: UUID): Promise<Matching> {
    return this.update(id, { status: 'active' })
  },

  /**
   * 매칭 취소
   */
  async cancel(id: UUID, reason?: string): Promise<Matching> {
    const matching = mockMatchingsMap.get(id)
    if (!matching) {
      throw new Error(`Matching with id ${id} not found`)
    }

    return this.update(id, {
      status: 'cancelled',
    }).then(updated => {
      const cancelled = {
        ...updated,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
      }
      const index = mockMatchings.findIndex(m => m.id === id)
      if (index !== -1) {
        mockMatchings[index] = cancelled
      }
      mockMatchingsMap.set(id, cancelled)
      return cancelled
    })
  },

  // Phase 1.3: Mock 데이터 참조 추상화 - 조회 헬퍼 함수
  /**
   * ID로 매칭 전체 조회 (동기)
   * @param id 매칭 ID
   * @returns 매칭 또는 undefined
   */
  getByIdSync: (id: UUID): Matching | undefined => {
    return mockMatchingsMap.get(id)
  },
}

