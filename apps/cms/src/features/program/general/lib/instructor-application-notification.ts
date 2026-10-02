import type { Dayjs } from 'dayjs'
import type { InstructorApplicationNotificationRequest } from '@/features/program/general/api/applications-api-client'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

/** 강사 승인 모달과 동일: `manual`만 SCHEDULED, 즉시·발표일은 IMMEDIATE */
export function toInstructorApplicationNotificationRequest(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): InstructorApplicationNotificationRequest {
  const isScheduled = notifyTiming === 'manual'
  return {
    timing: isScheduled ? 'SCHEDULED' : 'IMMEDIATE',
    scheduledAt: isScheduled ? (manualNotifyAt?.toISOString() ?? null) : null,
  }
}
