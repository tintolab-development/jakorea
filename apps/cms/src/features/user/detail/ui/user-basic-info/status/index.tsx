import { MemberPermissionStatusText } from '@/features/user/shared/ui/member-permission-status-text'
import dayjs from 'dayjs'
import type { User } from '@/types/user'
import type { MemberPermissionApplicationStatus } from '@/types/member-permission-application'
import { CmsButton } from '@/shared/ui'
import { blockViewerWriteAction } from '@/shared/lib/guard-viewer-write-action'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { isInstructorPermissionRevoked } from '@/features/user/shared/lib/member-list-display'
import {
  resolveInstructorSettlementUiStatusFromListLabel,
} from '@/shared/constants/instructor-settlement-status'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'

export function schoolTeacherEmploymentBadgeModifier(label: string): 'active' | 'muted' {
  const t = label.trim()
  if (!t || t === '-') return 'muted'
  if (/휴직|전근|탈퇴/.test(t)) return 'muted'
  if (/재직/.test(t)) return 'active'
  return 'muted'
}

export function settlementStatusView(user: Omit<User, 'password'>) {
  const label = user.listMetrics?.settlementStatusLabel?.trim()
  if (!label || label === '-') {
    return <span className="user-basic-info-section__settlement-status">-</span>
  }

  const status = resolveInstructorSettlementUiStatusFromListLabel(label)
  if (status) {
    return (
      <span className="user-basic-info-section__settlement-status">
        <InstructorSettlementStatusText status={status} label={label} />
      </span>
    )
  }

  return <span className="user-basic-info-section__settlement-status">{label}</span>
}

export function normalizePermissionApprovalStatus(
  status: User['permissionApprovalStatus']
): MemberPermissionApplicationStatus {
  const raw = String(status ?? '').trim()
  const upper = raw.toUpperCase()
  if (upper === 'APPROVED' || raw === '승인 완료') return 'APPROVED'
  if (upper === 'REJECTED' || raw === '신청 반려' || raw === '반려') return 'REJECTED'
  if (upper === 'PENDING' || raw === '승인 대기') return 'PENDING'
  return 'PENDING'
}

export function permissionApprovalStatusTextView(user: Omit<User, 'password'>) {
  const revoked = isInstructorPermissionRevoked(user)
  const status = revoked ? 'REJECTED' : normalizePermissionApprovalStatus(user.permissionApprovalStatus)
  const base = 'user-basic-info-section__approval-status'
  return (
    <MemberPermissionStatusText
      status={status}
      revoked={revoked}
      className={`${base} ${base}--${status.toLowerCase()}`}
    />
  )
}

export function permissionApprovalStatusListToneView(user: Omit<User, 'password'>) {
  return permissionApprovalStatusTextView(user)
}

function permissionApprovalHistoryTimestamp(user: Omit<User, 'password'>) {
  const resentAt = user.permissionNotificationResentAt
  if (resentAt) return resentAt
  return user.permissionApprovalHandledAt
}

function permissionApprovalHistoryTimestampLabel(user: Omit<User, 'password'>) {
  const target = permissionApprovalHistoryTimestamp(user)
  if (!target) return '-'
  return dayjs(target).format('YYYY.MM.DD HH:mm:ss')
}

export function PermissionApprovalStatusWithResend({
  user,
  onPermissionResendNotification,
  notifyPermissionRole,
}: {
  user: Omit<User, 'password'>
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
  notifyPermissionRole?: 'instructor' | 'admin'
}) {
  const status = normalizePermissionApprovalStatus(user.permissionApprovalStatus)
  const tone = permissionApprovalStatusListToneView(user)
  const hideResendForAdminReject =
    status === 'REJECTED' && notifyPermissionRole !== 'instructor'

  if (
    status === 'PENDING' ||
    hideResendForAdminReject ||
    isInstructorPermissionRevoked(user)
  ) {
    return tone
  }

  const resend = (
    <CmsButton
      variant="secondary"
      size="small"
      onClick={() => {
        // 뷰어 권한 — 알림 재발송 불가, 접근 불가 안내
        if (blockViewerWriteAction()) return
        if (onPermissionResendNotification && notifyPermissionRole) {
          onPermissionResendNotification({ userId: user.id, permissionRole: notifyPermissionRole })
        } else {
          window.alert('준비중 입니다.')
        }
      }} >
      알림 재발송
    </CmsButton>
  )

  return (
    <span className="user-basic-info-section__permission-approval-meta">
      <span className="user-basic-info-section__permission-approval-dropdown-wrap">
        {tone}
        <DetailInfoForm.InputsSeparator />
        {resend}
      </span>
      <span className="user-basic-info-section__permission-approval-timestamp">
        {permissionApprovalHistoryTimestampLabel(user)}
      </span>
    </span>
  )
}
