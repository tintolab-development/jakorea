/**
 * 실적 통계 Mock 데이터
 */

import type { PerformanceStats } from '@/types/domain'
import type { UUID } from '@/types'
import { mockPrograms } from './programs'

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function createPerformanceStats(programIndex: number): PerformanceStats {
  const program = mockPrograms[programIndex]
  const programId = program?.id || `program-${programIndex + 1}`
  const programName = program?.title || `프로그램 ${programIndex + 1}`
  const startDate = program?.startDate || new Date().toISOString()
  const endDate = program?.endDate || new Date().toISOString()

  const totalStudents = typeof program?.totalParticipants === 'number'
    ? program.totalParticipants
    : randomBetween(120, 520)
  const totalApplications = Math.max(totalStudents + randomBetween(10, 80), 50)
  const approvedApplications = Math.min(totalApplications, totalStudents + randomBetween(0, 20))

  return {
    id: `perf-${programId}`,
    programId,
    programName,
    period: {
      startDate,
      endDate,
    },
    stats: {
      totalApplications,
      approvedApplications,
      totalSchools: randomBetween(5, 28),
      totalStudents,
      totalInstructors: randomBetween(6, 40),
      totalSessions: randomBetween(10, 120),
      totalSettlementAmount: randomBetween(15000000, 120000000),
      satisfactionScore: Number((Math.random() * 1.5 + 3.2).toFixed(1)),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export const mockPerformanceStats: PerformanceStats[] = Array.from(
  { length: Math.min(mockPrograms.length || 12, 18) },
  (_, index) => createPerformanceStats(index)
)

export const mockPerformanceStatsMap = new Map<UUID, PerformanceStats>()
mockPerformanceStats.forEach(stat => {
  mockPerformanceStatsMap.set(stat.id, stat)
})
