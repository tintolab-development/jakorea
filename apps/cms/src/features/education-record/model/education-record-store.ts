/**
 * 실적 통계 Zustand 스토어
 * Program 엔티티 기반
 */

import { create } from 'zustand'
import type { Program } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'

interface EducationRecordState {
  records: Program[]
  loading: boolean
  error: Error | null
  fetchRecords: () => Promise<void>
  clearError: () => void
}

export const useEducationRecordStore = create<EducationRecordState>(set => ({
  records: [],
  loading: false,
  error: null,

  fetchRecords: async () => {
    set({ loading: true, error: null })
    try {
      const programs = await programService.getAll()
      set({ records: programs, loading: false })
    } catch (error) {
      set({ error: error as Error, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))



