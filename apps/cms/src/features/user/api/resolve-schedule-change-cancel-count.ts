import type { User } from '@/types/user'

export function coerceScheduleChangeCancelCount(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const count = Math.trunc(raw)
    return count >= 0 ? count : undefined
  }
  if (typeof raw === 'string' && raw.trim()) {
    const count = Number.parseInt(raw.trim(), 10)
    return Number.isFinite(count) && count >= 0 ? count : undefined
  }
  return undefined
}

/** BE member detail·목록 등 — 키는 응답마다 달라 인덱스 시그니처로 받는다. */
type ScheduleChangeCountSource = {
  scheduleChangeCancelCount?: unknown
  scheduleChangeCount?: unknown
  member?: unknown
  [key: string]: unknown
}

function asScheduleChangeCountSource(
  value: unknown
): ScheduleChangeCountSource | undefined {
  if (!value || typeof value !== 'object') return undefined
  return value as ScheduleChangeCountSource
}

/** BE member detail·목록 응답의 루트 또는 `member` 중첩에서 일정 변경&취소 횟수를 읽는다. */
export function resolveScheduleChangeCancelCountFromRecord(
  record: unknown
): number | undefined {
  const source = asScheduleChangeCountSource(record)
  if (!source) return undefined

  const fromRoot =
    coerceScheduleChangeCancelCount(source.scheduleChangeCancelCount) ??
    coerceScheduleChangeCancelCount(source.scheduleChangeCount)
  if (fromRoot != null) return fromRoot

  return resolveScheduleChangeCancelCountFromRecord(source.member)
}

export function applyScheduleChangeCancelCountToUser<T extends Omit<User, 'password'>>(
  user: T,
  source: unknown
): T {
  const count = resolveScheduleChangeCancelCountFromRecord(source)
  if (count != null) {
    user.scheduleChangeCancelCount = count
  }
  return user
}
