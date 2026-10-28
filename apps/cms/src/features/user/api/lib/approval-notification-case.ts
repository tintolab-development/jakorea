export const APPROVAL_NOTIFICATION_CASES = ['CASE_1', 'CASE_2', 'NONE'] as const
export const APPROVAL_NOTIFICATION_STATES = [
  'NONE',
  'SCHEDULED',
  'PENDING',
  'PROCESSING',
  'SENT',
  'UNKNOWN',
] as const

export type ApprovalNotificationCase = (typeof APPROVAL_NOTIFICATION_CASES)[number]
export type ApprovalNotificationState = (typeof APPROVAL_NOTIFICATION_STATES)[number]
export type InstructorApprovalCancelModalCase = 'CASE_1' | 'CASE_2'

function isApprovalNotificationCase(value: string): value is ApprovalNotificationCase {
  return (APPROVAL_NOTIFICATION_CASES as readonly string[]).includes(value)
}

function isApprovalNotificationState(value: string): value is ApprovalNotificationState {
  return (APPROVAL_NOTIFICATION_STATES as readonly string[]).includes(value)
}

/** GET `approvalNotificationCase` 리터럴만 인정. 그 외·누락은 null. */
export function parseApprovalNotificationCase(
  value: string | null | undefined
): ApprovalNotificationCase | null {
  if (value == null) return null
  const trimmed = value.trim()
  return isApprovalNotificationCase(trimmed) ? trimmed : null
}

export function parseApprovalNotificationState(
  value: string | null | undefined
): ApprovalNotificationState | null {
  if (value == null) return null
  const trimmed = value.trim()
  return isApprovalNotificationState(trimmed) ? trimmed : null
}

/**
 * 모달 문구 CASE는 서버 `approvalNotificationCase`만 사용한다.
 * state·scheduledAt으로 다시 계산하지 않는다.
 */
export function resolveApprovalCancelModalCase(
  value: ApprovalNotificationCase | string | null | undefined
): InstructorApprovalCancelModalCase | null {
  const parsed = parseApprovalNotificationCase(
    typeof value === 'string' || value == null ? value : null
  )
  if (parsed === 'CASE_1' || parsed === 'NONE') return 'CASE_1'
  if (parsed === 'CASE_2') return 'CASE_2'
  return null
}
