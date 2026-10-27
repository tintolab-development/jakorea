import type { Dayjs } from 'dayjs'

export type InstructorRoleReviewNotifyTiming = 'immediate' | 'manual' | 'on_announcement'

function toIso(value: Dayjs | string | null | undefined): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  return value.toISOString()
}

/**
 * `InstructorRoleReviewRequest.scheduledAt`
 * 직접 설정만 ISO를 넣고, 즉시·발표일은 생략한다(BE: null/생략 = 즉시 발송).
 */
export function toInstructorRoleReviewScheduledAt(
  notifyTiming: InstructorRoleReviewNotifyTiming | undefined,
  scheduledAt?: Dayjs | string | null
): string | undefined {
  if (notifyTiming !== 'manual') return undefined
  return toIso(scheduledAt)
}
