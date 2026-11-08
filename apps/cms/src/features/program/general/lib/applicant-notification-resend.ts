import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type ApplicantNotificationResendSubjectKind =
  | 'instructor'
  | 'institution'
  | 'individual'
  | 'volunteer_document'

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
  if (subjectKind === 'volunteer_document') {
    return approvalStatus === 'rejected'
      ? '서류 심사 불합격 알림을 재발송하시겠습니까?'
      : '서류 심사 합격 알림을 재발송하시겠습니까?'
  }
  if (subjectKind === 'individual') {
    return approvalStatus === 'rejected'
      ? '프로그램 승인 반려 알림을 재발송하시겠습니까?'
      : '프로그램 승인 알림을 재발송하시겠습니까?'
  }
  if (subjectKind === 'instructor') {
    return `**[${subjectName}]** 강사님의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?`
  }
  return `**[${subjectName}]**의 프로그램 승인 여부에 대한 알림을 재발송하시겠습니까?`
}

function resolveConfirmNotifyLine(
  subjectKind: ApplicantNotificationResendSubjectKind,
  approvalStatus: ApplicantNotificationResendApprovalStatus
): string {
  if (subjectKind === 'volunteer_document') {
    return approvalStatus === 'rejected'
      ? '확인 시 입력하신 사유와 함께 서류 불합격 알림이 재발송됩니다.'
      : '확인 시 봉사자에게 서류 합격 알림이 재발송됩니다.'
  }
  if (subjectKind === 'individual') {
    return approvalStatus === 'rejected'
      ? '확인 시 입력하신 반려 사유와 함께 알림이 재발송됩니다.'
      : '확인 시 신청자에게 승인 알림이 재발송됩니다.'
  }
  const kindLabel = resolveNotificationKindLabel(approvalStatus)
  if (subjectKind === 'instructor') {
    return `확인 시 강사님에게 ${kindLabel} 알림이 재발송됩니다.`
  }
  if (approvalStatus === 'rejected') {
    return '확인 시 입력하신 반려 사유와 함께 알림이 재발송됩니다.'
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

/**
 * 신청 결과 알림 재발송 버튼 노출.
 * 승인/반려만. BE `availableActions`가 있으면 `RESEND_NOTIFICATION`만 허용하고,
 * 비어 있으면 투영 누락 호환으로 승인/반려 재발송을 허용한다.
 */
export function canResendApplicationResultNotification(params: {
  approvalStatus?: string | null
  availableActions?: readonly string[] | null
}): boolean {
  if (params.approvalStatus !== 'approved' && params.approvalStatus !== 'rejected') {
    return false
  }
  const actions = params.availableActions
  if (actions != null && actions.length > 0) {
    return actions.includes('RESEND_NOTIFICATION')
  }
  return true
}

/** 반려 재발송 시 사유 입력 필드 노출 — 개인·기관 REJECTED. 저장된 사유가 있으면 생략 가능. */
export function shouldShowApplicantNotificationResendReason(
  subjectKind: ApplicantNotificationResendSubjectKind,
  approvalStatus: ApplicantNotificationResendApprovalStatus,
  storedReason?: string | null
): boolean {
  if (storedReason?.trim()) return false
  return (
    (subjectKind === 'individual' ||
      subjectKind === 'institution' ||
      subjectKind === 'volunteer_document') &&
    approvalStatus === 'rejected'
  )
}

const VOLUNTEER_INTERVIEW_FINAL_STATUSES = new Set([
  'pass',
  'fail',
  'reserve1',
  'reserve2',
  'reserve3',
  'reserve4',
])

const VOLUNTEER_INTERVIEW_FINAL_APPLICATION_STATUSES = new Set([
  'APPROVED',
  'RESERVE',
  'RESERVED',
])

/** 면접 최종(합격·예비합격·불합격)이면 서류 재발송 버튼을 숨긴다. */
export function isVolunteerInterviewFinalForDocumentResend(params: {
  secondInterviewScreeningStatus?: string | null
  applicationStatus?: string | null
}): boolean {
  const second = params.secondInterviewScreeningStatus?.trim()
  if (second && VOLUNTEER_INTERVIEW_FINAL_STATUSES.has(second)) return true
  const applicationStatus = (params.applicationStatus ?? '').trim().toUpperCase()
  return VOLUNTEER_INTERVIEW_FINAL_APPLICATION_STATUSES.has(applicationStatus)
}

/**
 * 봉사자·개인 1차 서류 합격·불합격 알림 재발송.
 * GET `availableActions`에 RESEND_NOTIFICATION이 있을 때만 허용한다.
 * 이 액션은 document-results/notifications/resend 만 가리킨다.
 */
export function canResendVolunteerDocumentResultNotification(params: {
  documentScreeningStatus?: string | null
  availableActions?: readonly string[] | null
  secondInterviewScreeningStatus?: string | null
  applicationStatus?: string | null
}): boolean {
  if (isVolunteerInterviewFinalForDocumentResend(params)) return false
  if (
    params.documentScreeningStatus !== 'pass' &&
    params.documentScreeningStatus !== 'fail'
  ) {
    return false
  }
  return params.availableActions?.includes('RESEND_NOTIFICATION') === true
}

/** 반려/불합격 재발송 reason. 저장된 사유가 있고 입력이 비면 body를 생략한다. */
export function resolveOptionalNotificationResendReason(
  needsRejectReason: boolean,
  inputReason: string,
  storedReason?: string | null
): string | null {
  if (!needsRejectReason) return null
  const trimmed = inputReason.trim()
  if (trimmed) return trimmed
  return storedReason?.trim() ? null : null
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
