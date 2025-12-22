/**
 * 스폰서 Mock 서비스
 * Phase 1.3: Mock API 서비스
 */

import type { Sponsor } from '@/types/domain'
import { mockSponsors, mockSponsorsMap } from '@/data/mock'

export const sponsorService = {
  getAll: async (): Promise<Sponsor[]> => {
    return Promise.resolve(mockSponsors)
  },

  getById: async (id: string): Promise<Sponsor> => {
    const sponsor = mockSponsorsMap.get(id)
    if (!sponsor) {
      throw new Error(`Sponsor not found: ${id}`)
    }
    return Promise.resolve(sponsor)
  },

  create: async (data: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sponsor> => {
    const newSponsor: Sponsor = {
      ...data,
      id: `sponsor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockSponsors.push(newSponsor)
    mockSponsorsMap.set(newSponsor.id, newSponsor)
    return Promise.resolve(newSponsor)
  },

  update: async (id: string, data: Partial<Omit<Sponsor, 'id' | 'createdAt'>>): Promise<Sponsor> => {
    const sponsor = mockSponsorsMap.get(id)
    if (!sponsor) {
      throw new Error(`Sponsor not found: ${id}`)
    }
    const updatedSponsor: Sponsor = {
      ...sponsor,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    const index = mockSponsors.findIndex(s => s.id === id)
    if (index !== -1) {
      mockSponsors[index] = updatedSponsor
    }
    mockSponsorsMap.set(id, updatedSponsor)
    return Promise.resolve(updatedSponsor)
  },

  delete: async (id: string): Promise<void> => {
    const index = mockSponsors.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`Sponsor not found: ${id}`)
    }
    mockSponsors.splice(index, 1)
    mockSponsorsMap.delete(id)
    return Promise.resolve()
  },

  // Phase 1.3: Mock 데이터 참조 추상화 - 조회 헬퍼 함수
  /**
   * ID로 스폰서 이름 조회 (동기)
   * @param id 스폰서 ID
   * @returns 스폰서 이름 또는 ID
   */
  getNameById: (id: string): string => {
    const sponsor = mockSponsorsMap.get(id)
    return sponsor?.name || id
  },

  /**
   * ID로 스폰서 전체 조회 (동기)
   * @param id 스폰서 ID
   * @returns 스폰서 또는 undefined
   */
  getByIdSync: (id: string): Sponsor | undefined => {
    return mockSponsorsMap.get(id)
  },

  /**
   * 모든 스폰서 조회 (동기)
   * @returns 스폰서 배열
   */
  getAllSync: (): Sponsor[] => {
    return [...mockSponsors]
  },
}




