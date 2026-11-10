import type { Dayjs } from 'dayjs'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import {
  INSTRUCTOR_JA_FAULT_PARTY_HINT,
  INSTRUCTOR_JA_FAULT_PARTY_REQUIRED_MESSAGE,
} from '@/shared/constants/messages'

export {
  INSTRUCTOR_JA_FAULT_PARTY_HINT,
  INSTRUCTOR_JA_FAULT_PARTY_REQUIRED_MESSAGE,
}

/** CMS 강사 취소 귀책. USER = 강사 사유(JA 감점), ADMIN = 운영 사유(감점 없음) */
export type InstructorCancelFaultParty = 'USER' | 'ADMIN'

export type InstructorAssignmentCancelRequest = {
  reason?: string
  timing?: string
  scheduledAt?: string | null
  faultParty?: InstructorCancelFaultParty | null
}

export function toInstructorAssignmentCancelRequest(input: {
  reason: string
  notifyTiming?: PermissionModalNotifyTiming | string | null
  manualNotifyAt?: Dayjs | null
  faultParty: InstructorCancelFaultParty
}): InstructorAssignmentCancelRequest {
  const isScheduled = input.notifyTiming === 'manual'
  return {
    reason: input.reason,
    timing: isScheduled ? 'SCHEDULED' : 'IMMEDIATE',
    scheduledAt: isScheduled ? (input.manualNotifyAt?.toISOString() ?? null) : null,
    faultParty: input.faultParty,
  }
}

/**
 * 일반 기관형 참여 기관 상세 — 배정 취소 요청(시안 12-1·12-2).
 * - 귀책은 보내지 않는다(API 선택값, 생략 시 서버 ADMIN).
 * - 알림 발송 전(`notificationSent === false`)이면 사유·알림 시점을 생략한다.
 */
export function toInstitutionDetailAssignmentCancelRequest(
  input: {
    reason: string
    notifyTiming?: PermissionModalNotifyTiming | string | null
    manualNotifyAt?: Dayjs | null
  },
  notificationSent?: boolean
): InstructorAssignmentCancelRequest {
  if (notificationSent === false) return {}
  const isScheduled = input.notifyTiming === 'manual'
  return {
    reason: input.reason,
    timing: isScheduled ? 'SCHEDULED' : 'IMMEDIATE',
    scheduledAt: isScheduled ? (input.manualNotifyAt?.toISOString() ?? null) : null,
  }
}
