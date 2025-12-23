/**
 * 신청 경로 Mock API 서비스
 * V3 Phase 7: 신청 경로 관리
 */

import type { ApplicationPath } from '@/types/domain'
import type { UUID } from '@/types'
import {
  mockApplicationPaths,
  mockApplicationPathsMap,
  getApplicationPathByProgramId,
} from '@/data/mock'

export const applicationPathService = {
  /**
   * 모든 신청 경로 조회
   */
  getAll: async (): Promise<ApplicationPath[]> => {
    // Mock: 비동기 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100))
    return [...mockApplicationPaths]
  },

  /**
   * ID로 신청 경로 조회
   */
  getById: async (id: UUID): Promise<ApplicationPath | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 50))
    return mockApplicationPathsMap.get(id)
  },

  /**
   * 프로그램 ID로 신청 경로 조회
   */
  getByProgramId: async (programId: string): Promise<ApplicationPath | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 50))
    return getApplicationPathByProgramId(programId)
  },

  /**
   * 신청 경로 생성
   */
  create: async (data: Omit<ApplicationPath, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApplicationPath> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const newPath: ApplicationPath = {
      ...data,
      id: `path-${String(mockApplicationPaths.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockApplicationPaths.push(newPath)
    mockApplicationPathsMap.set(newPath.id, newPath)
    return newPath
  },

  /**
   * 신청 경로 수정
   */
  update: async (id: UUID, data: Partial<Omit<ApplicationPath, 'id' | 'createdAt'>>): Promise<ApplicationPath> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const existing = mockApplicationPathsMap.get(id)
    if (!existing) {
      throw new Error(`신청 경로를 찾을 수 없습니다: ${id}`)
    }
    const updated: ApplicationPath = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    mockApplicationPathsMap.set(id, updated)
    const index = mockApplicationPaths.findIndex(p => p.id === id)
    if (index !== -1) {
      mockApplicationPaths[index] = updated
    }
    return updated
  },

  /**
   * 신청 경로 삭제
   */
  delete: async (id: UUID): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const index = mockApplicationPaths.findIndex(p => p.id === id)
    if (index !== -1) {
      mockApplicationPaths.splice(index, 1)
    }
    mockApplicationPathsMap.delete(id)
  },

  // 동기 조회 헬퍼 함수 (Phase 1.3: Mock 데이터 참조 추상화)
  /**
   * ID로 신청 경로 조회 (동기)
   */
  getByIdSync: (id: UUID): ApplicationPath | undefined => {
    return mockApplicationPathsMap.get(id)
  },

  /**
   * 프로그램 ID로 신청 경로 조회 (동기)
   */
  getByProgramIdSync: (programId: string): ApplicationPath | undefined => {
    return getApplicationPathByProgramId(programId)
  },

  /**
   * 모든 신청 경로 조회 (동기)
   */
  getAllSync: (): ApplicationPath[] => {
    return [...mockApplicationPaths]
  },
}

