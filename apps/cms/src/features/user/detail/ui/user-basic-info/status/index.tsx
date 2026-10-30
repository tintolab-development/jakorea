import dayjs from 'dayjs'
import type { User } from '@/types/user'
import type { MemberPermissionApplicationStatus } from '@/types/member-permission-application'
import { CmsButton } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { isInstructorPermissionRevoked } from '@/features/user/shared/lib/member-list-display'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  getInstructorSettlementStatusTextClassName,
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
    const canonical = INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status]
    if (canonical === label) {
      return (
        <span className="user-basic-info-section__settlement-status">
          <InstructorSettlementStatusText status={status} />
        </span>
      )
    }
    return (
      <span
        className={[
          'user-basic-info-section__settlement-status',
          getInstructorSettlementStatusTextClassName(status),
        ].join(' ')}
        role="status"
      >
        {label}
      </span>
    )
  }

  return <span className="user-basic-info-section__settlement-status">{label}</span>
}

export function activityChangeCountView(user: Omit<User, 'password'>) {
  const count = user.scheduleChangeCancelCount
  return <span>{count != null && count >= 0 ? `${count}회` : '-'}</span>
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

function approvalStatusClass(status: User['permissionApprovalStatus']) {
  const normalized = normalizePermissionApprovalStatus(status)
  if (normalized === 'APPROVED') {
    return 'user-basic-info-section__approval-status user-basic-info-section__approval-status--approved'
  }
  if (normalized === 'REJECTED') {
    return 'user-basic-info-section__approval-status user-basic-info-section__approval-status--rejected'
  }
  return 'user-basic-info-section__approval-status user-basic-info-section__approval-status--pending'
}

export function permissionApprovalStatusTextView(user: Omit<User, 'password'>) {
  if (isInstructorPermissionRevoked(user)) {
    return (
      <span className="user-basic-info-section__approval-status user-basic-info-section__approval-status--rejected">
        권한 종료
      </span>
    )
  }
  const status = normalizePermissionApprovalStatus(user.permissionApprovalStatus)
  if (status === 'APPROVED') {
    return <span className={approvalStatusClass(status)}>승인 완료</span>
  }
  if (status === 'REJECTED') {
    return <span className={approvalStatusClass(status)}>신청 반려</span>
  }
  return <span className={approvalStatusClass(status)}>승인 대기</span>
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

  if (status === 'PENDING' || status === 'REJECTED' || isInstructorPermissionRevoked(user)) {
    return tone
  }

  const resend = (
    <CmsButton
      variant="secondary"
      size="small"
      onClick={() => {
        if (onPermissionResendNotification && notifyPermissionRole) {
          onPermissionResendNotification({ userId: user.id, permissionRole: notifyPermissionRole })
        } else {
          window.alert('준비중 입니다.')
        }
      }}
    >
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
