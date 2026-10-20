import type { Dayjs } from 'dayjs'
import { toInstructorApplicationNotificationRequest } from '@/features/program/general/lib/instructor-application-notification'
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
  const notification = toInstructorApplicationNotificationRequest(
    input.notifyTiming,
    input.manualNotifyAt
  )
  return {
    reason: input.reason,
    timing: notification.timing,
    scheduledAt: notification.scheduledAt,
    faultParty: input.faultParty,
  }
}
