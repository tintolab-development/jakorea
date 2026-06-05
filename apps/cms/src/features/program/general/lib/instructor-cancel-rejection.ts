import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  patchApplicantInstructorForCancelRejection,
  type ApplicantInstructorApprovalNotifyOptions,
} from '@/data/mock/applicant-instructors'
import { formatModalBoldPhrase, formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type InstructorCancelRejectionNotifyVariant = 'alreadySent' | 'pendingNotification'

export type InstructorCancelRejectionConfirmPayload =
  | {
      variant: 'alreadySent'
      reason: string
      notifyTiming: PermissionModalNotifyTiming
      manualNotifyAt?: import('dayjs').Dayjs | null
    }
  | { variant: 'pendingNotification' }

export function resolveInstructorCancelRejectionNotifyVariant(
  row: ApplicantInstructorRow
): InstructorCancelRejectionNotifyVariant {
  if (row.rejectionNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (
    row.rejectionNotifyTiming === 'on_announcement' ||
    row.rejectionNotifyTiming === 'manual'
  ) {
    return 'pendingNotification'
  }

  if (row.approvalStatus === 'rejected' && row.approvalNotificationSentAt?.trim()) {
    return 'alreadySent'
  }

  return 'pendingNotification'
}

export function buildInstructorCancelRejectionMessage(
  instructorName: string,
  variant: InstructorCancelRejectionNotifyVariant
): string {
  const trimmedName = instructorName.trim() || '강사'
  const subject = formatModalBracketedSubjectName(trimmedName)
  const pendingApproval = formatModalBoldPhrase('승인 대기 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${subject} 강사님의 프로그램 참여 반려를 취소하시겠습니까?\n취소 시 강사님에게 반려 취소 알림이 새롭게 발송됩니다.\n또한, 해당 강사님은 자동으로 ${pendingApproval}됩니다.`
  }

  return `${subject} 강사님의 프로그램 참여를 취소하시겠습니까?\n취소 시 기존의 반려 알림은 자동으로 ${notifyCancel}되며,\n해당 강사님은 자동으로 ${pendingApproval}됩니다.`
}

export function patchInstructorForCancelRejection(
  row: ApplicantInstructorRow,
  notifyOptions?: ApplicantInstructorApprovalNotifyOptions
): ApplicantInstructorRow {
  return patchApplicantInstructorForCancelRejection(row, notifyOptions)
}

export function toInstructorCancelRejectionNotifyOptions(
  payload: Extract<InstructorCancelRejectionConfirmPayload, { variant: 'alreadySent' }>
): ApplicantInstructorApprovalNotifyOptions {
  return {
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason: payload.reason.trim() || undefined,
  }
}
