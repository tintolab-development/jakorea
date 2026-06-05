import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import {
  patchApplicantSchoolForCancelApproval,
  type ApplicantSchoolApprovalNotifyOptions,
} from '@/data/mock/applicant-institutions'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'

export type InstitutionCancelApprovalNotifyVariant = 'alreadySent' | 'pendingNotification'

export function resolveInstitutionCancelApprovalNotifyVariant(
  row: ApplicantSchoolRow
): InstitutionCancelApprovalNotifyVariant {
  if (row.approvalNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (row.approvalNotifyTiming === 'on_announcement' || row.approvalNotifyTiming === 'manual') {
    return 'pendingNotification'
  }

  if (row.approvalNotificationSentAt?.trim()) {
    return 'alreadySent'
  }

  return 'pendingNotification'
}

export function buildInstitutionCancelApprovalMessage(
  schoolName: string,
  variant: InstitutionCancelApprovalNotifyVariant
): string {
  const trimmedName = schoolName.trim() || '기관'
  const intro = `${formatModalBracketedSubjectName(trimmedName)}의 프로그램 참여 승인을 취소하시겠습니까?`
  const rejectProcess = formatModalBoldPhrase('반려 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 취소 사유가 담당 교사에게 전달되며, 알림이 발송됩니다.\n또한, 해당 기관은 자동으로 ${rejectProcess}됩니다.`
  }

  return `${intro}\n취소 시 입력하신 취소 사유가 담당 교사에게 반려 사유로 전달되며, 알림이 발송됩니다.\n기존의 승인 알림은 자동으로 ${notifyCancel}됩니다.`
}

export function resolveInstitutionCancelApprovalReasonLabel(
  variant: InstitutionCancelApprovalNotifyVariant
): string {
  return variant === 'pendingNotification' ? '취소 사유(반려 사유)' : '취소 사유'
}

export function patchInstitutionForCancelApproval(
  row: ApplicantSchoolRow,
  notifyOptions: ApplicantSchoolApprovalNotifyOptions
): ApplicantSchoolRow {
  return patchApplicantSchoolForCancelApproval(row, notifyOptions)
}
