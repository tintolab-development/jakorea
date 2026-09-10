import type {
  PermissionModalNotifyTiming,
  PermissionModalPayload,
} from '@/shared/components/permission-modal'

export type PermissionNotificationResendRole = 'instructor' | 'admin'

export type PermissionNotificationResendApprovalStatus = 'approved' | 'rejected'

export type PermissionNotificationResendNotifyOptions = {
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: import('dayjs').Dayjs | null
}

function resolveNotificationKindLabel(
  approvalStatus: PermissionNotificationResendApprovalStatus
): '승인' | '반려' {
  return approvalStatus === 'rejected' ? '반려' : '승인'
}

function resolveRoleLabel(permissionRole: PermissionNotificationResendRole): '강사' | '관리자' {
  return permissionRole === 'admin' ? '관리자' : '강사'
}

/** `\n` 개행. `**[이름]**`은 PermissionModalMessage에서 굵게 표시 */
export function buildPermissionNotificationResendMessage(
  permissionRole: PermissionNotificationResendRole,
  userDisplayName: string,
  approvalStatus: PermissionNotificationResendApprovalStatus
): string {
  const name = userDisplayName.trim() || '회원'
  const roleLabel = resolveRoleLabel(permissionRole)
  const kindLabel = resolveNotificationKindLabel(approvalStatus)
  return (
    `**[${name}]** 님의 ${roleLabel} 권한 승인 여부에 대한 알림을 재발송하시겠습니까?\n` +
    `확인 시 ${kindLabel} 알림이 재발송됩니다.`
  )
}

export function resolvePermissionNotificationResendSentAt(
  options: PermissionNotificationResendNotifyOptions
): Date {
  if (options.notifyTiming === 'manual' && options.manualNotifyAt) {
    return options.manualNotifyAt.toDate()
  }
  return new Date()
}

export function toPermissionNotificationResendNotifyOptions(
  payload: PermissionModalPayload
): PermissionNotificationResendNotifyOptions {
  return {
    notifyTiming: payload.notifyTiming,
    manualNotifyAt: payload.manualNotifyAt ?? undefined,
  }
}

export function mapPermissionApprovalStatusForResend(
  status: string | undefined
): PermissionNotificationResendApprovalStatus | null {
  const raw = String(status ?? '').trim()
  const upper = raw.toUpperCase()
  if (upper === 'APPROVED' || raw === '승인 완료') return 'approved'
  if (upper === 'REJECTED' || raw === '신청 반려' || raw === '반려') return 'rejected'
  return null
}
