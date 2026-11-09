import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'

/** 다음 상태 전환(면접 종료)까지 남은 ms. 프로그램별 종료 시각 계산을 넘긴다. */
export type Interview2NextStatusTransitionDelayResolver<Row> = (rows: Row[], now: Dayjs) => number

export type UseInterview2EffectiveStatusTickOptions = {
  /** 서버 필터 활성 시 주기적 목록 refetch */
  onServerRefetch?: () => void
  serverRefetchIntervalMs?: number
}

const DEFAULT_SERVER_REFETCH_INTERVAL_MS = 60_000

/**
 * 배정 면접 종료 시각 경과에 따라 대기↔완료가 바뀌도록 전환 시각에 맞춰 재렌더한다.
 * 서버 필터 모드에서는 고정 주기 refetch로 목록·건수를 BE와 맞춘다.
 * `resolveNextDelayMs`는 렌더마다 바뀌지 않는 모듈 함수를 넘긴다.
 */
export function useInterview2EffectiveStatusTick<Row>(
  rows: Row[],
  resolveNextDelayMs: Interview2NextStatusTransitionDelayResolver<Row>,
  options?: UseInterview2EffectiveStatusTickOptions
): void {
  const [, setTick] = useState(0)
  const onServerRefetch = options?.onServerRefetch
  const serverRefetchIntervalMs =
    options?.serverRefetchIntervalMs ?? DEFAULT_SERVER_REFETCH_INTERVAL_MS

  useEffect(() => {
    let cancelled = false
    let timerId: ReturnType<typeof setTimeout> | undefined

    const scheduleNext = () => {
      if (cancelled) return
      const delay = resolveNextDelayMs(rows, dayjs())
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
  }, [rows, resolveNextDelayMs])

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
