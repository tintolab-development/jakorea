import type { ApplicationDecisionCancelRequest } from '@/shared/api/generated/dashboard/schemas/applicationDecisionCancelRequest'
import type { Notification } from '@/shared/api/generated/dashboard/schemas/notification'

type CancelNotificationTiming = NonNullable<Notification['timing']>

const CANCEL_NOTIFICATION_TIMINGS: ReadonlySet<string> = new Set<CancelNotificationTiming>([
  'IMMEDIATE',
  'SCHEDULED',
  'ON_ANNOUNCEMENT',
])

function isCancelNotificationTiming(value: string): value is CancelNotificationTiming {
  return CANCEL_NOTIFICATION_TIMINGS.has(value)
}

function isBlankWireValue(value: unknown): boolean {
  if (value == null) return true
  if (value === 0) return true
  if (typeof value === 'string' && (value.trim() === '' || value.trim() === '-')) return true
  return false
}

function sanitizeScheduledAt(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const scheduledAt = value.trim()
  if (!scheduledAt || scheduledAt === '-') return undefined
  return scheduledAt
}

function sanitizeNotification(
  notification: { timing?: string | null; scheduledAt?: string | null } | null | undefined
): Notification | undefined {
  if (notification == null || typeof notification !== 'object') return undefined
  const timing = notification.timing?.trim().toUpperCase()
  if (!timing || !isCancelNotificationTiming(timing)) return undefined

  if (timing === 'SCHEDULED') {
    const scheduledAt = sanitizeScheduledAt(notification.scheduledAt)
    if (!scheduledAt) return undefined
    return { timing, scheduledAt }
  }

  return { timing }
}

/**
 * TT 기관 승인 취소 body. 일반 기관 ApplicationDecisionCancelRequest와 같다.
 * selectedScheduleId / slots / preferredScheduleRank / requestedScheduleId 는 넣지 않는다.
 */
export function buildTrainedTeacherOrganizationCancelApprovalRequest(input: {
  reason: string
  notification?: { timing?: string | null; scheduledAt?: string | null } | null
}): ApplicationDecisionCancelRequest {
  const reason = input.reason.trim()
  const notification = sanitizeNotification(input.notification)
  if (isBlankWireValue(reason)) {
    return notification ? { reason: '승인 취소', notification } : { reason: '승인 취소' }
  }
  return notification ? { reason, notification } : { reason }
}
