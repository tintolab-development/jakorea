/**
 * 강사/개인(참여자) 본인 활동 데이터 로드 훅
 * Dashboard 페이지의 활동 데이터 useEffect를 분리 (비즈니스 로직 동일)
 * React Query 전환 시 키: `dashboardQueryKeys.instructorActivity(instructorId)`
 */

import { useState, useEffect } from 'react'
import {
  getInstructorActivitySummary,
  type InstructorActivitySummary,
} from '@/features/dashboard/api/instructor-activity-service'

export function useInstructorActivity(
  enabled: boolean,
  instructorId: string | undefined
) {
  const [data, setData] = useState<InstructorActivitySummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !instructorId) {
      setData(null)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const result = await getInstructorActivitySummary(instructorId)
        if (!cancelled) setData(result)
      } catch (error) {
        if (!cancelled) console.error('활동 데이터 로드 실패:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [enabled, instructorId])

  return { data, loading }
}
