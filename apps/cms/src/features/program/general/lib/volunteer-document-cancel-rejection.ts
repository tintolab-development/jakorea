import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
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

export type VolunteerDocumentCancelRejectionNotifyOptions = {
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: import('dayjs').Dayjs | null
  rejectionReason?: string
}

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

/** 1차 서류 반려 취소 — 시안 04-1(9781:54768) 두 변형 (면접 있는 봉사자 심사) */
export function buildVolunteerDocumentScreeningCancelRejectionMessage(
  volunteerName: string,
  variant: VolunteerDocumentCancelRejectionNotifyVariant
): string {
  const intro = `${formatModalBracketedSubjectName(volunteerName, '회원')} 님의 1차 서류 반려를 취소하시겠습니까?`
  const waitingProcess = formatModalBoldPhrase('심사 대기 처리')
  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 ${waitingProcess}됩니다.`
  }
  return `${intro}\n취소 시 발송 예정인 반려 알림은 자동으로 취소되며, ${waitingProcess}됩니다.`
}

export function buildVolunteerDocumentCancelRejectionMessage(
  volunteerName: string,
  variant: VolunteerDocumentCancelRejectionNotifyVariant
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  const subject = formatModalBracketedSubjectName(trimmedName, '봉사자')
  const pendingApproval = formatModalBoldPhrase('승인 대기 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${subject}의 프로그램 참여 반려를 취소하시겠습니까?\n취소 시 봉사자에게 반려 취소 알림이 새롭게 발송됩니다.\n또한, 해당 봉사자는 자동으로 ${pendingApproval}됩니다.`
  }

  return `${subject}의 프로그램 참여 반려를 취소하시겠습니까?\n취소 시 기존의 반려 알림은 자동으로 ${notifyCancel}되며,\n해당 봉사자는 자동으로 ${pendingApproval}됩니다.`
}

export function toVolunteerDocumentCancelRejectionNotifyOptions(
  payload: Extract<VolunteerDocumentCancelRejectionConfirmPayload, { variant: 'alreadySent' }>
): VolunteerDocumentCancelRejectionNotifyOptions {
  return {
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason: payload.reason.trim() || undefined,
  }
}
