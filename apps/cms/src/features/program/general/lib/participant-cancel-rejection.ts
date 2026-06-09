import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import { patchGeneralIndividualApplicantForCancelRejection } from '@/data/mock/general-individual-applications-mock'
import type { ApplicantSchoolApprovalNotifyOptions } from '@/data/mock/applicant-institutions'
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

export function buildParticipantCancelRejectionMessage(
  participantName: string,
  variant: ParticipantCancelRejectionNotifyVariant
): string {
  const trimmedName = participantName.trim() || '참여자'
  const subject = formatModalBracketedSubjectName(trimmedName, '참여자')
  const pendingApproval = formatModalBoldPhrase('승인 대기 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${subject}의 프로그램 참여 반려를 취소하시겠습니까?\n취소 시 해당 참여자에게 반려 취소 알림이 새롭게 발송됩니다.\n또한, 해당 참여자는 자동으로 ${pendingApproval}됩니다.`
  }

  return `${subject}의 프로그램 참여를 취소하시겠습니까?\n취소 시 기존의 반려 알림은 자동으로 ${notifyCancel}되며,\n해당 참여자는 자동으로 ${pendingApproval}됩니다.`
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
