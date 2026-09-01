import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { getGeneralInterview2NextStatusTransitionDelayMs } from '@/features/program/general/lib/general-volunteer-interview2-display'

/**
 * 배정 면접 종료 시각 경과에 따라 대기↔완료가 바뀌도록 주기적 재렌더.
 * @see apps/cms/.cursor/rules/process/general-volunteer-interview2-screening-status-spec.md
 */
export function useGeneralInterview2EffectiveStatusTick(
  rows: GeneralVolunteerApplicantRow[]
): void {
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timerId: ReturnType<typeof setTimeout> | undefined

    const scheduleNext = () => {
      if (cancelled) return
      const delay = getGeneralInterview2NextStatusTransitionDelayMs(rows, dayjs())
      timerId = setTimeout(() => {
        if (cancelled) return
        setTick(prev => prev + 1)
        scheduleNext()
      }, delay)
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timerId != null) clearTimeout(timerId)
    }
  }, [rows])
}
