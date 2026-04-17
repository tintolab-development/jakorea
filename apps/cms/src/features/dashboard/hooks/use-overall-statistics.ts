/**
 * 관리자 전체 통계 데이터 로드 훅
 * Dashboard 페이지의 통계 useEffect를 분리 (비즈니스 로직 동일)
 * React Query 전환 시 키: `dashboardQueryKeys.overallStatistics()`
 */

import { useState, useEffect } from 'react'
import {
  getOverallStatistics,
  type OverallStatistics,
} from '@/features/dashboard/api/statistics-service'

export function useOverallStatistics(isAdmin: boolean) {
  const [data, setData] = useState<OverallStatistics | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      setData(null)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const result = await getOverallStatistics()
        if (!cancelled) setData(result)
      } catch (error) {
        if (!cancelled) console.error('통계 데이터 로드 실패:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  return { data, loading }
}
