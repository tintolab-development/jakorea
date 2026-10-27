import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import type {
  InstructorPermissionApproveNotifyTiming,
  PermissionApproveModalKind,
} from '@/features/user/permission-management/instructor-permission-approve-modal'
import { toInstructorRoleReviewScheduledAt } from '@/features/user/permission-management/lib/instructor-role-review-notify'

export interface InstructorPermissionRejectPayload {
  rejectionReason: string
  notifyTiming: InstructorPermissionApproveNotifyTiming
  /** 직접 설정일 때만 ISO. 즉시 발송이면 생략 */
  scheduledAt?: string
}

type InstructorPermissionRejectModalBaseProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: InstructorPermissionRejectPayload) => void
  zIndex?: number
  permissionKind?: PermissionApproveModalKind
}

export type InstructorPermissionRejectModalProps =
  | (InstructorPermissionRejectModalBaseProps & {
      variant: 'single'
      userDisplayName: string
    })
  | (InstructorPermissionRejectModalBaseProps & {
      variant: 'bulk'
      /** 일괄 시 대표(첫) 회원명 — `[이름] 님 외 N명` */
      userDisplayName: string
      memberCount: number
    })

const REJECT_NOTICE = '반려 시 입력하신 사유가 회원에게 반려 사유로 안내되며, 알림이 발송됩니다.'

export function InstructorPermissionRejectModal(props: InstructorPermissionRejectModalProps) {
  const { open, onCancel, onConfirm, zIndex, variant, permissionKind = 'instructor' } = props
  const isAdmin = permissionKind === 'admin'
  const roleLabel = isAdmin ? '관리자' : '강사'

  const displayName = (props.userDisplayName ?? '').trim() || '회원'
  const memberCount = variant === 'bulk' ? props.memberCount : 1
  const othersCount = Math.max(memberCount - 1, 0)

  const title =
    variant === 'bulk'
      ? isAdmin
        ? '관리자 권한 일괄 승인 반려 안내'
        : '강사 권한 일괄 승인 반려 안내'
      : isAdmin
        ? '관리자 권한 승인 반려'
        : '강사 권한 승인 반려 안내'

  const lead =
    variant === 'single'
      ? `**[${displayName}]** 님의 ${roleLabel} 권한 요청을 반려하시겠습니까?`
      : `**[${displayName}] 님 외 ${othersCount}명**의 ${roleLabel} 권한 요청을 반려하시겠습니까?`

  const handleConfirm = (payload: PermissionModalPayload) => {
    const notifyTiming: InstructorPermissionApproveNotifyTiming =
      payload.notifyTiming === 'on_announcement' ? 'immediate' : payload.notifyTiming
    onConfirm({
      rejectionReason: payload.reason,
      notifyTiming,
      scheduledAt: toInstructorRoleReviewScheduledAt(notifyTiming, payload.manualNotifyAt),
    })
  }

  return (
    <PermissionModal
      open={open}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      variant="reject"
      title={title}
      zIndex={zIndex}
      notifyTimingOptions="two"
      message={`${lead}\n${REJECT_NOTICE}`}
    />
  )
}
