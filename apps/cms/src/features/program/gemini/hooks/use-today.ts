import { useEffect, useState } from 'react'
import dayjs from 'dayjs'

/** `YYYY-MM-DD` — 자정 경과 시 갱신되어 기간 기반 상태가 목록에서 재계산된다. */
export function useToday(): string {
  const [todayKey, setTodayKey] = useState(() => dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    const now = dayjs()
    const nextMidnight = now.add(1, 'day').startOf('day')
    const timeoutMs = Math.max(nextMidnight.diff(now), 0)
    const timerId = window.setTimeout(() => {
      setTodayKey(dayjs().format('YYYY-MM-DD'))
    }, timeoutMs)
    return () => window.clearTimeout(timerId)
  }, [todayKey])

  return todayKey
}
