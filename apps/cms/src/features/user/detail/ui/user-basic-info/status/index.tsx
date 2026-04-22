import dayjs from 'dayjs'
import type { User } from '@/types/user'
import { CmsButton } from '@/shared/ui'

export function schoolTeacherEmploymentBadgeModifier(label: string): 'active' | 'muted' {
  const t = label.trim()
  if (!t || t === '-') return 'muted'
  if (/휴직|전근|탈퇴/.test(t)) return 'muted'
  if (/재직/.test(t)) return 'active'
  return 'muted'
}

function settlementStatusTextClass(statusLabel?: string) {
  const normalized = statusLabel?.trim()
  switch (normalized) {
    case '확인 대기 중':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--awaiting-confirmation'
    case '일부 확인 완료':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--partially-confirmed'
    case '지급조서 확인 완료':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--payment-statement-verified'
    case '계좌 지급 완료':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--account-paid'
    case '해당 없음':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--none'
    case '신청 반려':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--application-rejected'
    case '지급 정정 요청':
      return 'user-basic-info-section__settlement-status user-basic-info-section__settlement-status--payment-correction-requested'
    default:
      return 'user-basic-info-section__settlement-status'
  }
}

export function settlementStatusView(user: Omit<User, 'password'>) {
  const s = user.listMetrics?.settlementStatusLabel?.trim()
  return <span className={settlementStatusTextClass(s)}>{s && s.length > 0 ? s : '-'}</span>
}

function normalizePermissionApprovalStatus(status: User['permissionApprovalStatus']) {
  const raw = String(status ?? '').trim()
  const upper = raw.toUpperCase()
  if (upper === 'APPROVED' || raw === '승인 완료') return 'APPROVED'
  if (upper === 'REJECTED' || raw === '신청 반려' || raw === '반려') return 'REJECTED'
  if (upper === 'PENDING' || raw === '승인 대기') return 'PENDING'
  return 'PENDING'
}

function permissionApprovalStatusTextClass(status: User['permissionApprovalStatus']) {
  const normalized = normalizePermissionApprovalStatus(status)
  if (normalized === 'APPROVED') {
    return 'user-basic-info-section__permission-approval-status user-basic-info-section__permission-approval-status--approved'
  }
  if (normalized === 'REJECTED') {
    return 'user-basic-info-section__permission-approval-status user-basic-info-section__permission-approval-status--rejected'
  }
  return 'user-basic-info-section__permission-approval-status user-basic-info-section__permission-approval-status--pending'
}

export function permissionApprovalStatusTextView(user: Omit<User, 'password'>) {
  const status = normalizePermissionApprovalStatus(user.permissionApprovalStatus)
  if (status === 'APPROVED') {
    return <span className={permissionApprovalStatusTextClass(status)}>승인 완료</span>
  }
  if (status === 'REJECTED') {
    return <span className={permissionApprovalStatusTextClass(status)}>신청 반려</span>
  }
  return <span className={permissionApprovalStatusTextClass(status)}>승인 대기</span>
}

function permissionApprovalStatusListToneClass(status: User['permissionApprovalStatus']) {
  const normalized = normalizePermissionApprovalStatus(status)
  if (normalized === 'APPROVED') {
    return 'user-basic-info-section__permission-approval-status-list-tone user-basic-info-section__permission-approval-status-list-tone--approved'
  }
  if (normalized === 'REJECTED') {
    return 'user-basic-info-section__permission-approval-status-list-tone user-basic-info-section__permission-approval-status-list-tone--rejected'
  }
  return 'user-basic-info-section__permission-approval-status-list-tone user-basic-info-section__permission-approval-status-list-tone--pending'
}

export function permissionApprovalStatusListToneView(user: Omit<User, 'password'>) {
  const status = normalizePermissionApprovalStatus(user.permissionApprovalStatus)
  if (status === 'APPROVED') {
    return <span className={permissionApprovalStatusListToneClass(status)}>승인 완료</span>
  }
  if (status === 'REJECTED') {
    return <span className={permissionApprovalStatusListToneClass(status)}>신청 반려</span>
  }
  return <span className={permissionApprovalStatusListToneClass(status)}>승인 대기</span>
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
}: {
  user: Omit<User, 'password'>
}) {
  const status = normalizePermissionApprovalStatus(user.permissionApprovalStatus)
  const statusNode = permissionApprovalStatusListToneView(user)

  if (status === 'PENDING') return statusNode

  return (
    <span className="user-basic-info-section__permission-approval-meta">
      {statusNode}
      <span className="user-basic-info-section__permission-approval-divider">|</span>
      <CmsButton
        variant="secondary"
        size="small"
        onClick={() => {
          window.alert('준비중 입니다.')
        }}
      >
        알림 재발송
      </CmsButton>
      <span className="user-basic-info-section__permission-approval-timestamp">
        {permissionApprovalHistoryTimestampLabel(user)}
      </span>
    </span>
  )
}
