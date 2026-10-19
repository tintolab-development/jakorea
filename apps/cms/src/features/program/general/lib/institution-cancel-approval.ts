import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import {
  patchApplicantSchoolForCancelApproval,
  type ApplicantSchoolApprovalNotifyOptions,
} from '@/features/program/shared/model/applicant-institution'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'

export type InstitutionCancelApprovalNotifyVariant = 'alreadySent' | 'pendingNotification'

export type InstitutionCancelApprovalNotificationResult = 'not-created' | 'created' | 'unknown'

export function resolveInstitutionCancelApprovalNotificationResult(response: {
  notificationEventId?: number | null
}): InstitutionCancelApprovalNotificationResult {
  if (!Object.prototype.hasOwnProperty.call(response, 'notificationEventId')) {
    return 'unknown'
  }
  return response.notificationEventId == null ? 'not-created' : 'created'
}

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
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 취소 사유가 저장됩니다.\n기존 승인 알림은 자동으로 ${notifyCancel}됩니다.\n취소 안내 알림은 정책에 따라 발송·예약되지 않을 수 있습니다.`
  }

  return `${intro}\n취소 시 입력하신 취소 사유가 저장됩니다.\n기존 승인 알림은 자동으로 ${notifyCancel}됩니다.\n취소 안내 알림은 정책에 따라 발송·예약되지 않을 수 있습니다.`
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
