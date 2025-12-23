/**
 * 강사 Mock 서비스
 * Phase 1.2: Mock API 서비스
 */

import type { Instructor } from '@/types/domain'
import { mockInstructors, mockInstructorsMap } from '@/data/mock'

export const instructorService = {
  getAll: async (): Promise<Instructor[]> => {
    return Promise.resolve(mockInstructors)
  },

  getById: async (id: string): Promise<Instructor> => {
    const instructor = mockInstructorsMap.get(id)
    if (!instructor) {
      throw new Error(`Instructor not found: ${id}`)
    }
    return Promise.resolve(instructor)
  },

  create: async (data: Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Instructor> => {
    const newInstructor: Instructor = {
      ...data,
      id: `instructor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockInstructors.push(newInstructor)
    mockInstructorsMap.set(newInstructor.id, newInstructor)
    return Promise.resolve(newInstructor)
  },

  update: async (id: string, data: Partial<Omit<Instructor, 'id' | 'createdAt'>>): Promise<Instructor> => {
    const instructor = mockInstructorsMap.get(id)
    if (!instructor) {
      throw new Error(`Instructor not found: ${id}`)
    }
    const updatedInstructor: Instructor = {
      ...instructor,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    const index = mockInstructors.findIndex(i => i.id === id)
    if (index !== -1) {
      mockInstructors[index] = updatedInstructor
    }
    mockInstructorsMap.set(id, updatedInstructor)
    return Promise.resolve(updatedInstructor)
  },

  delete: async (id: string): Promise<void> => {
    const index = mockInstructors.findIndex(i => i.id === id)
    if (index === -1) {
      throw new Error(`Instructor not found: ${id}`)
    }
    mockInstructors.splice(index, 1)
    mockInstructorsMap.delete(id)
    return Promise.resolve()
  },

  // Phase 1.3: Mock 데이터 참조 추상화 - 조회 헬퍼 함수
  /**
   * ID로 강사 이름 조회 (동기)
   * @param id 강사 ID
   * @returns 강사 이름 또는 ID
   */
  getNameById: (id: string): string => {
    const instructor = mockInstructorsMap.get(id)
    return instructor?.name || id
  },

  /**
   * ID로 강사 전체 조회 (동기)
   * @param id 강사 ID
   * @returns 강사 또는 undefined
   */
  getByIdSync: (id: string): Instructor | undefined => {
    return mockInstructorsMap.get(id)
  },

  /**
   * 모든 강사 조회 (동기)
   * @returns 강사 배열
   */
  getAllSync: (): Instructor[] => {
    return [...mockInstructors]
  },
}




