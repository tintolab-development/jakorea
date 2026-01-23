/**
 * 신청 경로 Zustand Store
 * V3 Phase 7: 신청 경로 관리
 */

import { create } from 'zustand'
import type { ApplicationPath } from '@/types/domain'
import type { UUID } from '@/types'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'

interface ApplicationPathStore {
  paths: ApplicationPath[]
  selectedPath: ApplicationPath | null
  loading: boolean
  error: string | null
  fetchPaths: () => Promise<void>
  fetchPathById: (id: UUID) => Promise<ApplicationPath | undefined>
  fetchPathByProgramId: (programId: string) => Promise<ApplicationPath | undefined>
  createPath: (
    data: Omit<ApplicationPath, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<ApplicationPath>
  updatePath: (
    id: UUID,
    data: Partial<Omit<ApplicationPath, 'id' | 'createdAt'>>
  ) => Promise<ApplicationPath>
  deletePath: (id: UUID) => Promise<void>
  setSelectedPath: (path: ApplicationPath | null) => void
  clearSelectedPath: () => void
}

export const useApplicationPathStore = create<ApplicationPathStore>(set => ({
  paths: [],
  selectedPath: null,
  loading: false,
  error: null,

  fetchPaths: async () => {
    set({ loading: true, error: null })
    try {
      const paths = await applicationPathService.getAll()
      set({ paths, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '신청 경로 조회 실패', loading: false })
    }
  },

  fetchPathById: async (id: UUID) => {
    set({ loading: true, error: null })
    try {
      const path = await applicationPathService.getById(id)
      set({ loading: false })
      return path
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '신청 경로 조회 실패', loading: false })
      return undefined
    }
  },

  fetchPathByProgramId: async (programId: string) => {
    set({ loading: true, error: null })
    try {
      const path = await applicationPathService.getByProgramId(programId)
      set({ loading: false })
      return path
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '신청 경로 조회 실패', loading: false })
      return undefined
    }
  },

  createPath: async (data: Omit<ApplicationPath, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null })
    try {
      const newPath = await applicationPathService.create(data)
      set(state => ({ paths: [...state.paths, newPath], loading: false }))
      return newPath
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '신청 경로 생성 실패', loading: false })
      throw error
    }
  },

  updatePath: async (id: UUID, data: Partial<Omit<ApplicationPath, 'id' | 'createdAt'>>) => {
    set({ loading: true, error: null })
    try {
      const updated = await applicationPathService.update(id, data)
      set(state => ({
        paths: state.paths.map(p => (p.id === id ? updated : p)),
        selectedPath: state.selectedPath?.id === id ? updated : state.selectedPath,
        loading: false,
      }))
      return updated
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '신청 경로 수정 실패', loading: false })
      throw error
    }
  },

  deletePath: async (id: UUID) => {
    set({ loading: true, error: null })
    try {
      await applicationPathService.delete(id)
      set(state => ({
        paths: state.paths.filter(p => p.id !== id),
        selectedPath: state.selectedPath?.id === id ? null : state.selectedPath,
        loading: false,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '신청 경로 삭제 실패', loading: false })
      throw error
    }
  },

  setSelectedPath: path => set({ selectedPath: path }),

  clearSelectedPath: () => set({ selectedPath: null }),
}))
