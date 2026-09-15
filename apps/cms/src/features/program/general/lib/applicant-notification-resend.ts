import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type ApplicantNotificationResendSubjectKind = 'instructor' | 'institution' | 'individual'

export type ApplicantNotificationResendApprovalStatus = 'approved' | 'rejected'

export type ApplicantNotificationResendNotifyOptions = {
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: import('dayjs').Dayjs | null
  rejectionReason?: string
}

function resolveNotificationKindLabel(
  approvalStatus: ApplicantNotificationResendApprovalStatus
): '승인' | '반려' {
  return approvalStatus === 'rejected' ? '반려' : '승인'
}

function resolveSubjectQuestionLine(
  subjectKind: ApplicantNotificationResendSubjectKind,
  subjectName: string,
  approvalStatus: ApplicantNotificationResendApprovalStatus
): string {
  if (subjectKind === 'individual') {
    return approvalStatus === 'rejected'
      ? '프로그램 승인 반려 알림을 재발송하시겠습니까?'
      : '프로그램 승인 알림을 재발송하시겠습니까?'
  }
  if (subjectKind === 'instructor') {
    return `[${subjectName}] 강사님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?`
  }
  return `[${subjectName}]의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?`
}

function resolveConfirmNotifyLine(
  subjectKind: ApplicantNotificationResendSubjectKind,
  approvalStatus: ApplicantNotificationResendApprovalStatus
): string {
  if (subjectKind === 'individual') {
    return approvalStatus === 'rejected'
      ? '확인 시 입력하신 반려 사유와 함께 알림이 재발송됩니다.'
      : '확인 시 신청자에게 승인 알림이 재발송됩니다.'
  }
  const kindLabel = resolveNotificationKindLabel(approvalStatus)
  if (subjectKind === 'instructor') {
    return `확인 시 강사님에게 ${kindLabel} 알림이 재발송됩니다.`
  }
  return `확인 시 ${kindLabel} 알림이 재발송됩니다.`
}

export function buildApplicantNotificationResendMessage(
  subjectKind: ApplicantNotificationResendSubjectKind,
  subjectName: string,
  approvalStatus: ApplicantNotificationResendApprovalStatus
): string {
  const trimmedName = subjectName.trim() || '신청자'
  return `${resolveSubjectQuestionLine(subjectKind, trimmedName, approvalStatus)}\n${resolveConfirmNotifyLine(subjectKind, approvalStatus)}`
}

/** 반려 재발송 시 사유 입력 필드 노출 */
export function shouldShowApplicantNotificationResendReason(
  subjectKind: ApplicantNotificationResendSubjectKind,
  approvalStatus: ApplicantNotificationResendApprovalStatus
): boolean {
  return subjectKind === 'individual' && approvalStatus === 'rejected'
}

export function resolveApplicantNotificationResendSentAt(
  options: ApplicantNotificationResendNotifyOptions
): Date {
  if (options.notifyTiming === 'manual' && options.manualNotifyAt) {
    return options.manualNotifyAt.toDate()
  }
  return new Date()
}

export function toApplicantNotificationResendNotifyOptions(
  payload: import('@/shared/components/permission-modal').PermissionModalPayload
): ApplicantNotificationResendNotifyOptions {
  return {
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
    rejectionReason: payload.reason.trim() || undefined,
  }
}
