/**
 * 실적 통계 훅
 */

import { useCallback, useMemo, useState } from 'react'
import { message } from 'antd'
import dayjs from 'dayjs'
import type { PerformanceStats } from '@/types/domain'
import { performanceService } from '@/entities/performance/api/performance-service'

export interface PerformanceStatsFilter {
  programId?: string
  period?: string // YYYY-MM
}

export function usePerformanceStats(filters: PerformanceStatsFilter) {
  const [stats, setStats] = useState<PerformanceStats[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await performanceService.getAll()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch performance stats:', error)
      message.error(MESSAGES.error.performanceStatsLoadFailed)
    } finally {
      setLoading(false)
    }
  }, [])

  const availablePrograms = useMemo(() => {
    return Array.from(new Map(stats.map(item => [item.programId, item.programName])).entries()).map(
      ([programId, programName]) => ({ programId, programName })
    )
  }, [stats])

  const availablePeriods = useMemo(() => {
    return Array.from(
      new Set(stats.map(item => dayjs(item.period.startDate).format('YYYY-MM')))
    ).sort().reverse()
  }, [stats])

  const filteredStats = useMemo(() => {
    return stats.filter(item => {
      if (filters.programId && item.programId !== filters.programId) {
        return false
      }
      if (filters.period) {
        const period = dayjs(item.period.startDate).format('YYYY-MM')
        if (period !== filters.period) {
          return false
        }
      }
      return true
    })
  }, [filters.period, filters.programId, stats])

  const summary = useMemo(() => {
    return filteredStats.reduce(
      (acc, item) => {
        acc.programCount += 1
        acc.totalApplications += item.stats.totalApplications
        acc.approvedApplications += item.stats.approvedApplications
        acc.totalStudents += item.stats.totalStudents
        acc.totalInstructors += item.stats.totalInstructors
        acc.totalSettlementAmount += item.stats.totalSettlementAmount
        return acc
      },
      {
        programCount: 0,
        totalApplications: 0,
        approvedApplications: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalSettlementAmount: 0,
      }
    )
  }, [filteredStats])

  return {
    stats,
    filteredStats,
    loading,
    summary,
    availablePrograms,
    availablePeriods,
    fetchStats,
  }
}
