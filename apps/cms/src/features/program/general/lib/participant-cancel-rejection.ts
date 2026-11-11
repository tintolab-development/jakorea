import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import { patchGeneralIndividualApplicantForCancelRejection } from '@/features/program/general/model/individual-applicant'
import type { ApplicantSchoolApprovalNotifyOptions } from '@/features/program/shared/model/applicant-institution'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type ParticipantCancelRejectionNotifyVariant = 'alreadySent' | 'pendingNotification'

export type ParticipantCancelRejectionConfirmPayload =
  | {
      variant: 'alreadySent'
      reason: string
      notifyTiming: PermissionModalNotifyTiming
      manualNotifyAt?: import('dayjs').Dayjs | null
    }
  | { variant: 'pendingNotification' }

export function resolveParticipantCancelRejectionNotifyVariant(
  row: GeneralIndividualApplicantRow
): ParticipantCancelRejectionNotifyVariant {
  if (row.rejectionNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (row.rejectionNotifyTiming === 'on_announcement' || row.rejectionNotifyTiming === 'manual') {
    return 'pendingNotification'
  }

  if (row.approvalStatus === 'rejected' && row.approvalNotificationSentAt?.trim()) {
    return 'alreadySent'
  }

  return 'pendingNotification'
}

/** 개인 시안 04-1·04-2(4121:107560·4121:106943) 「프로그램 반려 취소 안내」 */
export const PARTICIPANT_CANCEL_REJECTION_MODAL_TITLE = '프로그램 반려 취소 안내'

export function buildParticipantCancelRejectionMessage(
  participantName: string,
  variant: ParticipantCancelRejectionNotifyVariant
): string {
  const trimmedName = participantName.trim() || '참여자'
  const subject = formatModalBracketedSubjectName(trimmedName, '참여자')
  const pendingApproval = formatModalBoldPhrase('승인 대기 처리')

  if (variant === 'alreadySent') {
    return `${subject} 님의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 ${pendingApproval}됩니다.`
  }

  return `${subject} 님의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 발송 예정인 반려 알림은 자동으로 취소되며, ${pendingApproval}됩니다.`
}

export function patchParticipantForCancelRejection(
  row: GeneralIndividualApplicantRow,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
  return patchGeneralIndividualApplicantForCancelRejection(row, notifyOptions)
}

export function toParticipantCancelRejectionNotifyOptions(
  payload: Extract<ParticipantCancelRejectionConfirmPayload, { variant: 'alreadySent' }>
): ApplicantSchoolApprovalNotifyOptions {
  return {
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason: payload.reason.trim() || undefined,
  }
}
