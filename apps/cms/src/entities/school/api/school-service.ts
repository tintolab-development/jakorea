/**
 * 학교 Mock 서비스
 * Phase 1.4: Mock API 서비스
 */

import type { School } from '@/types/domain'
import { mockSchools, mockSchoolsMap } from '@/data/mock'

export const schoolService = {
  getAll: async (): Promise<School[]> => {
    return Promise.resolve(mockSchools)
  },

  getById: async (id: string): Promise<School> => {
    const school = mockSchoolsMap.get(id)
    if (!school) {
      throw new Error(`School not found: ${id}`)
    }
    return Promise.resolve(school)
  },

  create: async (data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<School> => {
    const newSchool: School = {
      ...data,
      id: `school-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockSchools.push(newSchool)
    mockSchoolsMap.set(newSchool.id, newSchool)
    return Promise.resolve(newSchool)
  },

  update: async (id: string, data: Partial<Omit<School, 'id' | 'createdAt'>>): Promise<School> => {
    const school = mockSchoolsMap.get(id)
    if (!school) {
      throw new Error(`School not found: ${id}`)
    }
    const updatedSchool: School = {
      ...school,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    const index = mockSchools.findIndex(s => s.id === id)
    if (index !== -1) {
      mockSchools[index] = updatedSchool
    }
    mockSchoolsMap.set(id, updatedSchool)
    return Promise.resolve(updatedSchool)
  },

  delete: async (id: string): Promise<void> => {
    const index = mockSchools.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`School not found: ${id}`)
    }
    mockSchools.splice(index, 1)
    mockSchoolsMap.delete(id)
    return Promise.resolve()
  },

  // Phase 1.3: Mock 데이터 참조 추상화 - 조회 헬퍼 함수
  /**
   * ID로 학교 이름 조회 (동기)
   * @param id 학교 ID
   * @returns 학교 이름 또는 ID
   */
  getNameById: (id: string): string => {
    const school = mockSchoolsMap.get(id)
    return school?.name || id
  },

  /**
   * ID로 학교 전체 조회 (동기)
   * @param id 학교 ID
   * @returns 학교 또는 undefined
   */
  getByIdSync: (id: string): School | undefined => {
    return mockSchoolsMap.get(id)
  },
}




