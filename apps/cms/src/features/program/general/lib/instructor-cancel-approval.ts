import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import {
  patchApplicantInstructorForCancelApproval,
  type ApplicantInstructorApprovalNotifyOptions,
} from '@/features/program/shared/model/applicant-instructor'
import { formatModalBoldPhrase, formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'

export type InstructorCancelApprovalNotifyVariant = 'alreadySent' | 'pendingNotification'

/** 기본 `default`(1사1교·일반 개인형). `general-organization`: 일반(기관형) 시안 08-1·08-2 본문 */
export type InstructorApplicationCopyVariant = 'default' | 'general-organization'

export function resolveInstructorCancelApprovalNotifyVariant(
  row: ApplicantInstructorRow
): InstructorCancelApprovalNotifyVariant {
  if (row.approvalNotifyTiming === 'immediate') {
    return 'alreadySent'
  }
  if (
    row.approvalNotifyTiming === 'on_announcement' ||
    row.approvalNotifyTiming === 'manual'
  ) {
    return 'pendingNotification'
  }

  if (row.approvalNotificationSentAt?.trim()) {
    return 'alreadySent'
  }

  return 'pendingNotification'
}

export function buildInstructorCancelApprovalMessage(
  instructorName: string,
  variant: InstructorCancelApprovalNotifyVariant,
  copyVariant: InstructorApplicationCopyVariant = 'default'
): string {
  const trimmedName = instructorName.trim() || '강사'
  if (copyVariant === 'general-organization') {
    // 시안 08-1(1141:244830)·08-2(1141:245549)
    const subject = `${formatModalBracketedSubjectName(trimmedName)} 님의 프로그램 승인을 취소하시겠습니까?`
    if (variant === 'alreadySent') {
      return `${subject}\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 회원은 자동으로 ${formatModalBoldPhrase('반려 처리')}됩니다.`
    }
    return `${subject}\n취소 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.\n발송 예정인 승인 알림이 있는 경우, 자동으로 취소되며 해당 건만 발송됩니다.`
  }
  const intro = `${formatModalBracketedSubjectName(trimmedName)} 강사님의 프로그램 참여를 취소하시겠습니까?`
  const rejected = formatModalBoldPhrase('반려 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (variant === 'alreadySent') {
    return `${intro}\n취소 시 입력하신 취소 사유가 강사님에게 전달되며, 알림이 발송됩니다.\n또한, 해당 강사님은 자동으로 ${rejected}됩니다.`
  }

  return `${intro}\n취소 시 입력하신 취소 사유가 강사님에게 전달되며, 알림이 발송됩니다.\n기존의 승인 알림은 자동으로 ${notifyCancel}됩니다.\n또한, 해당 강사님은 자동으로 ${rejected}됩니다.`
}

export function resolveInstructorCancelApprovalReasonLabel(
  _variant: InstructorCancelApprovalNotifyVariant
): string {
  return '취소 사유'
}

export function patchInstructorForCancelApproval(
  row: ApplicantInstructorRow,
  notifyOptions: ApplicantInstructorApprovalNotifyOptions
): ApplicantInstructorRow {
  return patchApplicantInstructorForCancelApproval(row, notifyOptions)
}
