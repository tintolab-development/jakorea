import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import {
  patchApplicantSchoolForCancelRejection,
  type ApplicantSchoolApprovalNotifyOptions,
} from '@/features/program/shared/model/applicant-institution'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type InstitutionCancelRejectionNotifyVariant = 'alreadySent' | 'pendingNotification'

export type InstitutionCancelRejectionConfirmPayload =
  | {
      variant: 'alreadySent'
      reason: string
      notifyTiming: PermissionModalNotifyTiming
      manualNotifyAt?: import('dayjs').Dayjs | null
    }
  | { variant: 'pendingNotification' }

export function resolveInstitutionCancelRejectionNotifyVariant(
  row: ApplicantSchoolRow
): InstitutionCancelRejectionNotifyVariant {
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

/**
 * 반려 취소 팝업 문구 분기.
 * - `default`: 1사1교 등 기존 문구
 * - `general-organization`: 일반 프로그램(기관형) 시안 04-1(1141:239123)·04-2(1141:239867)
 */
export type InstitutionCancelRejectionCopyVariant = 'default' | 'general-organization'

export const INSTITUTION_CANCEL_REJECTION_MODAL_TITLE = '기관 반려 취소 안내'
export const GENERAL_ORGANIZATION_CANCEL_REJECTION_MODAL_TITLE = '프로그램 반려 취소 안내'

export function resolveInstitutionCancelRejectionModalTitle(
  copyVariant: InstitutionCancelRejectionCopyVariant = 'default'
): string {
  return copyVariant === 'general-organization'
    ? GENERAL_ORGANIZATION_CANCEL_REJECTION_MODAL_TITLE
    : INSTITUTION_CANCEL_REJECTION_MODAL_TITLE
}

/**
 * 반려 취소(알림 발송 후) 알림 옵션.
 * 일반(기관형) 시안 04-2: 즉시 / 발표일에 맞춰서 / 직접 설정 — BE cancel-rejection이 ON_ANNOUNCEMENT 지원
 * (생성 타입 `NotificationTiming`, 전송 body는 `toOrganizationApplicationDecisionCancelRequest`). 기본(1사1교 등)은 기존 2옵션.
 */
export function resolveInstitutionCancelRejectionNotifyTimingOptions(
  copyVariant: InstitutionCancelRejectionCopyVariant = 'default'
): 'two' | 'three' {
  return copyVariant === 'general-organization' ? 'three' : 'two'
}

export function buildInstitutionCancelRejectionMessage(
  schoolName: string,
  variant: InstitutionCancelRejectionNotifyVariant,
  copyVariant: InstitutionCancelRejectionCopyVariant = 'default'
): string {
  const trimmedName = schoolName.trim() || '기관'
  const subject = formatModalBracketedSubjectName(trimmedName)
  const pendingApproval = formatModalBoldPhrase('승인 대기 처리')
  const notifyCancel = formatModalBoldPhrase('발송 취소')

  if (copyVariant === 'general-organization') {
    if (variant === 'alreadySent') {
      return `${subject}의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 입력하신 사유가 담당 교사에게 취소 사유로 안내되며, 알림이 발송됩니다.\n또한, 해당 기관은 자동으로 ${pendingApproval}됩니다.`
    }
    return `${subject}의 프로그램 신청 반려를 취소하시겠습니까?\n취소 시 발송 예정인 반려 알림은 자동으로 취소되며, ${pendingApproval}됩니다.`
  }

  if (variant === 'alreadySent') {
    return `${subject}의 프로그램 참여 반려를 취소하시겠습니까?\n취소 시 담당 교사에게 반려 취소 알림이 새롭게 발송됩니다.\n또한, 해당 기관은 자동으로 ${pendingApproval}됩니다.`
  }

  return `${subject}의 프로그램 참여를 취소하시겠습니까?\n취소 시 기존의 반려 알림은 자동으로 ${notifyCancel}되며,\n해당 기관은 자동으로 ${pendingApproval}됩니다.`
}

export function patchInstitutionForCancelRejection(
  row: ApplicantSchoolRow,
  notifyOptions?: ApplicantSchoolApprovalNotifyOptions
): ApplicantSchoolRow {
  return patchApplicantSchoolForCancelRejection(row, notifyOptions)
}

export function toInstitutionCancelRejectionNotifyOptions(
  payload: Extract<InstitutionCancelRejectionConfirmPayload, { variant: 'alreadySent' }>
): ApplicantSchoolApprovalNotifyOptions {
  return {
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason: payload.reason.trim() || undefined,
  }
}
