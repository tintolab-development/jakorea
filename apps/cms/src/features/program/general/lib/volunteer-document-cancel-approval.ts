import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
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
  // Figma 「Popup / Multiple / w600 / 서류 승인 취소」 (알림 발송 여부 off / on)
  const intro = `${formatModalBracketedSubjectName(trimmedName)} 님의 1차 서류 승인을 취소하시겠습니까?`

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 ${formatModalBoldPhrase('반려 처리')}됩니다.`
  }

  return `${intro}\n취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.`
}

export function resolveVolunteerDocumentCancelApprovalReasonLabel(
  _variant: VolunteerDocumentCancelApprovalNotifyVariant
): string {
  return '취소 사유'
}
