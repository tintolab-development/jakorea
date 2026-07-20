import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { formatModalBoldPhrase, formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'

export type VolunteerDocumentCancelApprovalNotifyVariant = 'alreadySent' | 'pendingNotification'

export function resolveVolunteerDocumentCancelApprovalNotifyVariant(
  row: GeneralVolunteerApplicantRow
): VolunteerDocumentCancelApprovalNotifyVariant {
  if (row.documentApprovalNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (
    row.documentApprovalNotifyTiming === 'on_announcement' ||
    row.documentApprovalNotifyTiming === 'manual'
  ) {
    return 'pendingNotification'
  }

  return 'pendingNotification'
}

export function buildVolunteerDocumentCancelApprovalMessage(
  volunteerName: string,
  variant: VolunteerDocumentCancelApprovalNotifyVariant
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  const intro = `${formatModalBracketedSubjectName(trimmedName)} 봉사자의 1차 서류 합격 승인을 취소하시겠습니까?`
  const rejectProcess = formatModalBoldPhrase('반려 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 취소 사유가 봉사자에게 전달되며, 알림이 발송됩니다.\n또한, 해당 봉사자는 자동으로 ${rejectProcess}됩니다.`
  }

  return `${intro}\n취소 시 입력하신 취소 사유가 봉사자에게 반려 사유로 전달되며, 알림이 발송됩니다.\n기존의 승인 알림은 자동으로 ${notifyCancel}됩니다.`
}

export function resolveVolunteerDocumentCancelApprovalReasonLabel(
  variant: VolunteerDocumentCancelApprovalNotifyVariant
): string {
  return variant === 'pendingNotification' ? '취소 사유(반려 사유)' : '취소 사유'
}
