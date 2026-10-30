import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import { patchGeneralIndividualApplicantForCancelApproval } from '@/features/program/general/model/individual-applicant'
import type { ApplicantSchoolApprovalNotifyOptions } from '@/features/program/shared/model/applicant-institution'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'

export type ParticipantCancelApprovalNotifyVariant = 'alreadySent' | 'pendingNotification'

export function resolveParticipantCancelApprovalNotifyVariant(
  row: GeneralIndividualApplicantRow
): ParticipantCancelApprovalNotifyVariant {
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

export function buildParticipantCancelApprovalMessage(
  participantName: string,
  variant: ParticipantCancelApprovalNotifyVariant
): string {
  const trimmedName = participantName.trim() || '참여자'
  // 공통 「프로그램 승인 취소 안내」 — 개인 문구 (승인 알림 발송 완료 / 발송 예정)
  const intro = `${formatModalBracketedSubjectName(trimmedName, '참여자')} 님의 프로그램 승인을 취소하시겠습니까?`

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 ${formatModalBoldPhrase('반려 처리')}됩니다.`
  }

  return `${intro}\n취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.`
}

export function resolveParticipantCancelApprovalReasonLabel(
  _variant: ParticipantCancelApprovalNotifyVariant
): string {
  return '취소 사유'
}

export function patchParticipantForCancelApproval(
  row: GeneralIndividualApplicantRow,
  notifyOptions: ApplicantSchoolApprovalNotifyOptions
): GeneralIndividualApplicantRow {
  return patchGeneralIndividualApplicantForCancelApproval(row, notifyOptions)
}
