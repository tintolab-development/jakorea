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
}

