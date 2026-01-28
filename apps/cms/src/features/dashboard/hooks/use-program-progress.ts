/**
 * 전체 프로그램 진행 현황 로딩 훅
 */

import { useCallback, useEffect, useState } from 'react'
import { getOverallProgramProgress, type OverallProgramProgress } from '../api/statistics-service'

interface UseProgramProgressResult {
  progress: OverallProgramProgress | null
  loading: boolean
  refresh: () => Promise<void>
}

export function useProgramProgress(): UseProgramProgressResult {
  const [progress, setProgress] = useState<OverallProgramProgress | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getOverallProgramProgress()
      setProgress(data)
    } catch (error) {
      console.error('전체 프로그램 진행 현황 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { progress, loading, refresh }
}
