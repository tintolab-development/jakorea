import type { Dayjs } from 'dayjs'
import type { InstructorAssignmentCreateRequestTiming } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentCreateRequestTiming'
import type { InstructorAssignmentListItemResponseAssignmentNotificationStatus } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentListItemResponseAssignmentNotificationStatus'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import {
  NOTIFY_TIMING_CAPABILITY,
  assertNotifyTimingSupported,
} from '@/shared/lib/notify-timing-capability'
import { toFlatDecisionNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import {
  toInstitutionDetailAssignmentCancelRequest,
  type InstructorAssignmentCancelRequest,
} from '@/features/program/general/lib/instructor-cancel-fault-party'

/** 강사 배정 완료 알림 발송 상태 (BE 항목 1-A). 구버전 응답은 필드가 없다. */
export type InstructorAssignmentNotificationStatus =
  InstructorAssignmentListItemResponseAssignmentNotificationStatus

/**
 * 배정 알림 발송 여부.
 * - SENT → true(「발송 후」: 사유 필수·알림 시점 선택)
 * - NONE / SCHEDULED / CANCELLED → false(「발송 전」: 안내만, body `{}`)
 * - 필드 없음(구버전 응답) → undefined(기존처럼 「발송 후」로 연다)
 */
export function isInstructorAssignmentNotificationSent(
  status: InstructorAssignmentNotificationStatus | string | null | undefined
): boolean | undefined {
  if (status === 'SENT') return true
  if (status === 'NONE' || status === 'SCHEDULED' || status === 'CANCELLED') return false
  return undefined
}

/**
 * 선택한 배정들의 취소 팝업 분기. 하나라도 발송 후면 「발송 후」, 모두 발송 전이면 「발송 전」.
 * 상태를 모르는 배정이 섞이면 undefined(기존 「발송 후」).
 */
export function resolveInstructorUnassignNotificationSent(
  sentFlags: ReadonlyArray<boolean | undefined>
): boolean | undefined {
  if (sentFlags.length === 0) return undefined
  if (sentFlags.some(flag => flag === undefined)) return undefined
  return sentFlags.some(flag => flag === true)
}

/**
 * 배정 1건 취소 body — POST …/instructor-assignments/{assignmentId}/cancel (평탄 필드).
 * - 발송 전(`sent === false`): `{}` — 예약된 배정 알림은 BE가 자동 취소한다.
 * - 발송 후·미상: `{ reason, timing, scheduledAt? }`. faultParty는 보내지 않는다(생략 시 ADMIN).
 */
export function toInstructorUnassignCancelBody(
  payload: {
    reason: string
    notifyTiming?: PermissionModalNotifyTiming | string | null
    manualNotifyAt?: Dayjs | null
  },
  sent: boolean | undefined
): InstructorAssignmentCancelRequest {
  if (sent === false) return {}
  const body = toInstitutionDetailAssignmentCancelRequest(payload, true)
  return body.timing === 'SCHEDULED' ? body : { reason: body.reason, timing: body.timing }
}

/** 발송 전으로 보고 `{}`로 취소했는데 서버가 발송 후로 판단(400 VALIDATION_FAILED) */
export function isInstructorUnassignReasonRequiredError(error: unknown): boolean {
  return getApiErrorHttpStatus(error) === 400 && getApiErrorCode(error) === 'VALIDATION_FAILED'
}

/** 이미 취소·완료된 배정(409 INSTRUCTOR_ASSIGNMENT_CONFLICT) */
export function isInstructorAssignmentConflictError(error: unknown): boolean {
  return getApiErrorCode(error) === 'INSTRUCTOR_ASSIGNMENT_CONFLICT'
}

export const INSTRUCTOR_ASSIGNMENT_CANCEL_CONFLICT_MESSAGE =
  '이미 취소되었거나 완료된 배정입니다. 목록을 새로고침했습니다.'

export const INSTRUCTOR_UNASSIGN_NOTIFICATION_ALREADY_SENT_MESSAGE =
  '배정 알림이 이미 발송되었습니다. 취소 사유와 알림 발송 시점을 입력한 뒤 다시 취소해 주세요.'

/**
 * 강사 배정 생성 알림 시점 (BE 항목 2). POST …/programs/{programId}/instructor-assignments 평탄 필드.
 * - 즉시: 생략(서버 IMMEDIATE)
 * - 직접 설정: `{ timing: 'SCHEDULED', scheduledAt }`
 * - 발표일에 맞춰서: `{ timing: 'ON_ANNOUNCEMENT' }` — scheduledAt 동시 전송 금지.
 *   일반 프로그램(기관형·개인형)만 허용. `allowOnAnnouncement=false`(1사1교 등)는 기존처럼 차단한다.
 */
export function toInstructorAssignmentCreateNotifyTiming(
  notifyTiming: PermissionModalNotifyTiming | string | null | undefined,
  manualNotifyAt: Dayjs | null | undefined,
  options: { allowOnAnnouncement: boolean }
): { timing: InstructorAssignmentCreateRequestTiming; scheduledAt?: string } | undefined {
  assertNotifyTimingSupported(
    notifyTiming,
    options.allowOnAnnouncement
      ? NOTIFY_TIMING_CAPABILITY.full
      : NOTIFY_TIMING_CAPABILITY.scheduledOnly
  )
  if (notifyTiming === 'on_announcement') return { timing: 'ON_ANNOUNCEMENT' }
  const scheduled = toFlatDecisionNotifyTiming(notifyTiming, manualNotifyAt)
  if (!scheduled || scheduled.timing !== 'SCHEDULED' || !scheduled.scheduledAt) return undefined
  return { timing: 'SCHEDULED', scheduledAt: scheduled.scheduledAt }
}

export const INSTRUCTOR_ASSIGNMENT_ANNOUNCEMENT_DATE_REQUIRED_MESSAGE =
  '프로그램 발표일을 먼저 설정해 주세요.'

/** 409 APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED — 강사 배정 「발표일에 맞춰서」 */
export function formatInstructorAssignmentAnnouncementDateMessage(error: unknown): string | null {
  return getApiErrorCode(error) === 'APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED'
    ? INSTRUCTOR_ASSIGNMENT_ANNOUNCEMENT_DATE_REQUIRED_MESSAGE
    : null
}
