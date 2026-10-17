import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_INTERVIEW2_STATUS_POLL_MS,
  getGeneralInterview2NextStatusTransitionDelayMs,
} from '@/features/program/general/lib/general-volunteer-interview2-display'

type UseGeneralInterview2EffectiveStatusTickOptions = {
  /** WAITING/COMPLETED 서버 필터 활성 시 주기적 목록 refetch */
  onServerRefetch?: () => void
  serverRefetchIntervalMs?: number
}

/**
 * 배정 면접 종료 시각 경과에 따라 대기↔완료가 바뀌도록 주기적 재렌더.
 * 서버 필터 모드에서는 고정 주기 refetch로 목록·건수를 BE와 맞춘다.
 * @see apps/cms/.cursor/rules/process/general-volunteer-interview2-screening-status-spec.md
 */
export function useGeneralInterview2EffectiveStatusTick(
  rows: GeneralVolunteerApplicantRow[],
  options?: UseGeneralInterview2EffectiveStatusTickOptions
): void {
  const [, setTick] = useState(0)
  const onServerRefetch = options?.onServerRefetch
  const serverRefetchIntervalMs = options?.serverRefetchIntervalMs ?? GENERAL_INTERVIEW2_STATUS_POLL_MS

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

  useEffect(() => {
    if (!onServerRefetch) return

    const intervalId = setInterval(() => {
      onServerRefetch()
    }, serverRefetchIntervalMs)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onServerRefetch()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [onServerRefetch, serverRefetchIntervalMs])
}
