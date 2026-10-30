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
  const subject = formatModalBracketedSubjectName(trimmedName)

  // 공통 「프로그램 승인 취소 안내」 — 기관 문구 (승인 알림 발송 완료 / 발송 예정)
  if (variant === 'alreadySent') {
    return `${subject}의 프로그램 참여 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 담당 교사에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 기관은 자동으로 ${formatModalBoldPhrase('반려 처리')}됩니다.`
  }

  return `${subject}의 프로그램 승인을 취소하시겠습니까?\n취소 시 입력하신 사유가 담당 교사에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.`
}

export function resolveInstitutionCancelApprovalReasonLabel(
  _variant: InstitutionCancelApprovalNotifyVariant
): string {
  return '취소 사유'
}

export function patchInstitutionForCancelApproval(
  row: ApplicantSchoolRow,
  notifyOptions: ApplicantSchoolApprovalNotifyOptions
): ApplicantSchoolRow {
  return patchApplicantSchoolForCancelApproval(row, notifyOptions)
}
