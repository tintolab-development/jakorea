import type { Dayjs } from 'dayjs'
import type { InstructorApplicationNotificationRequest } from '@/features/program/general/api/applications-api-client'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import {
  NOTIFY_TIMING_CAPABILITY,
  assertNotifyTimingSupported,
  type NotifyTimingCapability,
} from '@/shared/lib/notify-timing-capability'

/**
 * 강사 단건 승인·반려·승인 취소·반려 취소 중첩 `Notification`.
 * OpenAPI `Notification.timing`은 IMMEDIATE | SCHEDULED | ON_ANNOUNCEMENT를 받는다.
 * 기본 capability는 `scheduledOnly` — 발표일을 고르지 않는 화면(1사1교·일반 개인형)은 기존처럼 차단한다.
 * 일반(기관형) 강사 신청은 시안대로 발표일을 열어 `full`을 넘긴다.
 */
export function toInstructorApplicationNotificationRequest(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null,
  capability: NotifyTimingCapability = NOTIFY_TIMING_CAPABILITY.scheduledOnly
): InstructorApplicationNotificationRequest {
  assertNotifyTimingSupported(notifyTiming, capability)
  if (notifyTiming === 'on_announcement') {
    return { timing: 'ON_ANNOUNCEMENT', scheduledAt: null }
  }
  if (notifyTiming === 'manual') {
    return {
      timing: 'SCHEDULED',
      scheduledAt: manualNotifyAt?.toISOString() ?? null,
    }
  }
  return { timing: 'IMMEDIATE', scheduledAt: null }
}
