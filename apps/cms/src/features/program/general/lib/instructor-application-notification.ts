import type { Dayjs } from 'dayjs'
import type { InstructorApplicationNotificationRequest } from '@/features/program/general/api/applications-api-client'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import {
  NOTIFY_TIMING_CAPABILITY,
  assertNotifyTimingSupported,
} from '@/shared/lib/notify-timing-capability'

/**
 * 강사 단건 승인·반려 중첩 `Notification`.
 * BE DTO `InstructorApplicationRequests.Notification`은 IMMEDIATE | SCHEDULED만 지원한다.
 * 발표일은 즉시 발송으로 바꾸지 않고 차단한다. 일괄은 TimedBulk의 ON_ANNOUNCEMENT를 쓴다.
 */
export function toInstructorApplicationNotificationRequest(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): InstructorApplicationNotificationRequest {
  assertNotifyTimingSupported(notifyTiming, NOTIFY_TIMING_CAPABILITY.scheduledOnly)
  if (notifyTiming === 'manual') {
    return {
      timing: 'SCHEDULED',
      scheduledAt: manualNotifyAt?.toISOString() ?? null,
    }
  }
  return { timing: 'IMMEDIATE', scheduledAt: null }
}
