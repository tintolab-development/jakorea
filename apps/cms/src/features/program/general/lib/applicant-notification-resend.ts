import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type ApplicantNotificationResendSubjectKind = 'instructor' | 'institution' | 'individual'

export type ApplicantNotificationResendApprovalStatus = 'approved' | 'rejected'

export type ApplicantNotificationResendNotifyOptions = {
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: import('dayjs').Dayjs | null
}

function resolveNotificationKindLabel(
  approvalStatus: ApplicantNotificationResendApprovalStatus
): '승인' | '반려' {
  return approvalStatus === 'rejected' ? '반려' : '승인'
}

function resolveSubjectQuestionLine(
  subjectKind: ApplicantNotificationResendSubjectKind,
  subjectName: string
): string {
  if (subjectKind === 'instructor') {
    return `[${subjectName}] 강사님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?`
  }
  if (subjectKind === 'institution') {
    return `[${subjectName}]의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?`
  }
  return `[${subjectName}] 님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?`
}

function resolveConfirmNotifyLine(
  subjectKind: ApplicantNotificationResendSubjectKind,
  approvalStatus: ApplicantNotificationResendApprovalStatus
): string {
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
  return `${resolveSubjectQuestionLine(subjectKind, trimmedName)}\n${resolveConfirmNotifyLine(subjectKind, approvalStatus)}`
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
  }
}
