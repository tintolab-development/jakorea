/**
 * 실적 통계 Mock 서비스
 */

import type { PerformanceStats } from '@/types/domain'
import { mockPerformanceStats, mockPerformanceStatsMap } from '@/data/mock'

export const performanceService = {
  getAll: async (): Promise<PerformanceStats[]> => {
    return Promise.resolve(mockPerformanceStats)
  },

  getById: async (id: string): Promise<PerformanceStats> => {
    const stat = mockPerformanceStatsMap.get(id)
    if (!stat) {
      throw new Error(`PerformanceStats not found: ${id}`)
    }
    return Promise.resolve(stat)
  },

  getByProgramId: async (programId: string): Promise<PerformanceStats | undefined> => {
    const stat = mockPerformanceStats.find(item => item.programId === programId)
    return Promise.resolve(stat)
  },
}
