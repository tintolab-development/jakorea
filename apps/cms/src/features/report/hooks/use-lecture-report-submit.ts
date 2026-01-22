/**
 * 강의보고서 제출 훅
 * Phase 0.2.7: 강의보고서 실제 제출 프로세스 (FR-E03)
 */

import { useState, useCallback } from 'react'
import { reportService } from '@/entities/report/api/report-service'
import type { Report } from '@/types/domain'

interface UseLectureReportSubmitParams {
  activityId?: string
  scheduleId?: string
  programId?: string
}

export function useLectureReportSubmit(params: UseLectureReportSubmitParams) {
  const [loading, setLoading] = useState(false)

  const submit = useCallback(
    async (fields: Record<string, string | number | Date>): Promise<Report> => {
      setLoading(true)
      try {
        const report = await reportService.submit({
          type: 'lecture',
          activityId: params.activityId,
          scheduleId: params.scheduleId,
          programId: params.programId,
          fields,
        })
        return report
      } finally {
        setLoading(false)
      }
    },
    [params.activityId, params.scheduleId, params.programId]
  )

  return { submit, loading }
}
