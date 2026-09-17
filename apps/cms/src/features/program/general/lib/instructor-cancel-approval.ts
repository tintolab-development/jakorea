import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import {
  patchApplicantInstructorForCancelApproval,
  type ApplicantInstructorApprovalNotifyOptions,
} from '@/features/program/shared/model/applicant-instructor'
import { formatModalBoldPhrase, formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'

export type InstructorCancelApprovalNotifyVariant = 'alreadySent' | 'pendingNotification'

export function resolveInstructorCancelApprovalNotifyVariant(
  row: ApplicantInstructorRow
): InstructorCancelApprovalNotifyVariant {
  if (row.approvalNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (
    row.approvalNotifyTiming === 'on_announcement' ||
    row.approvalNotifyTiming === 'manual'
  ) {
    return 'pendingNotification'
  }

  if (row.approvalNotificationSentAt?.trim()) {
    return 'alreadySent'
  }

  return 'pendingNotification'
}

export function buildInstructorCancelApprovalMessage(
  instructorName: string,
  variant: InstructorCancelApprovalNotifyVariant
): string {
  const trimmedName = instructorName.trim() || '강사'
  const intro = `${formatModalBracketedSubjectName(trimmedName)} 강사님의 프로그램 참여를 취소하시겠습니까?`
  const pendingApproval = formatModalBoldPhrase('승인 대기 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 취소 사유가 강사님에게 전달되며, 알림이 발송됩니다.\n또한, 해당 강사님은 자동으로 ${pendingApproval}됩니다.`
  }

  return `${intro}\n취소 시 입력하신 취소 사유가 강사님에게 전달되며, 알림이 발송됩니다.\n기존의 승인 알림은 자동으로 ${notifyCancel}됩니다.\n또한, 해당 강사님은 자동으로 ${pendingApproval}됩니다.`
}

export function resolveInstructorCancelApprovalReasonLabel(
  _variant: InstructorCancelApprovalNotifyVariant
): string {
  return '취소 사유'
}

export function patchInstructorForCancelApproval(
  row: ApplicantInstructorRow,
  notifyOptions: ApplicantInstructorApprovalNotifyOptions
): ApplicantInstructorRow {
  return patchApplicantInstructorForCancelApproval(row, notifyOptions)
}
