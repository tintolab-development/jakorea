import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { formatModalBoldPhrase, formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type VolunteerDocumentCancelRejectionNotifyVariant = 'alreadySent' | 'pendingNotification'

export type VolunteerDocumentCancelRejectionConfirmPayload =
  | {
      variant: 'alreadySent'
      reason: string
      notifyTiming: PermissionModalNotifyTiming
      manualNotifyAt?: import('dayjs').Dayjs | null
    }
  | { variant: 'pendingNotification' }

export function resolveVolunteerDocumentCancelRejectionNotifyVariant(
  row: GeneralVolunteerApplicantRow
): VolunteerDocumentCancelRejectionNotifyVariant {
  if (row.documentRejectionNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (
    row.documentRejectionNotifyTiming === 'on_announcement' ||
    row.documentRejectionNotifyTiming === 'manual'
  ) {
    return 'pendingNotification'
  }

  return 'pendingNotification'
}

export function buildVolunteerDocumentCancelRejectionMessage(
  volunteerName: string,
  variant: VolunteerDocumentCancelRejectionNotifyVariant
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  const subject = formatModalBracketedSubjectName(trimmedName)
  const pendingApproval = formatModalBoldPhrase('승인 대기 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${subject} 봉사자의 1차 서류 반려를 취소하시겠습니까?\n취소 시 봉사자에게 반려 취소 알림이 새롭게 발송됩니다.\n또한, 해당 봉사자는 자동으로 ${pendingApproval}됩니다.`
  }

  return `${subject} 봉사자의 1차 서류 반려를 취소하시겠습니까?\n취소 시 기존의 반려 알림은 자동으로 ${notifyCancel}되며,\n해당 봉사자는 자동으로 ${pendingApproval}됩니다.`
}
