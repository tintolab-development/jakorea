import type { Dayjs } from 'dayjs'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import type { UjatAssignmentCancelRequest } from '@/features/program/ujat/api/education-execution-api'

export function toUjatAssignmentCancelRequest(input: {
  /** 배정 알림 미발송이면 사유 생략 가능 */
  reason?: string | null
  notifyTiming?: PermissionModalNotifyTiming | string | null
  manualNotifyAt?: Dayjs | null
  /** true면 timing/scheduledAt 포함 (알림 발송 후 취소) */
  includeCancelNotification?: boolean
}): UjatAssignmentCancelRequest {
  // 미발송: reason/timing/scheduledAt 강제 금지 → 빈 body (BE가 예약 배정 알림만 supersede)
  if (!input.includeCancelNotification) {
    return {}
  }

  const reason = input.reason?.trim() || null
  const isScheduled = input.notifyTiming === 'manual'
  return {
    reason,
    timing: isScheduled ? 'SCHEDULED' : 'IMMEDIATE',
    // IMMEDIATE는 scheduledAt null (빈 문자열 금지)
    scheduledAt: isScheduled ? (input.manualNotifyAt?.toISOString() ?? null) : null,
  }
}
