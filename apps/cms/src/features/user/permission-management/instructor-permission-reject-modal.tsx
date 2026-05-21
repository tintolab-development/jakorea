import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import type {
  InstructorPermissionApproveNotifyTiming,
  PermissionApproveModalKind,
} from '@/features/user/permission-management/instructor-permission-approve-modal'

export interface InstructorPermissionRejectPayload {
  rejectionReason: string
  notifyTiming: InstructorPermissionApproveNotifyTiming
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
      memberCount: number
    })

export function InstructorPermissionRejectModal(props: InstructorPermissionRejectModalProps) {
  const { open, onCancel, onConfirm, zIndex, variant, permissionKind = 'instructor' } = props
  const isAdmin = permissionKind === 'admin'

  const displayName = variant === 'single' ? (props.userDisplayName ?? '').trim() || '회원' : null
  const memberCount = variant === 'bulk' ? props.memberCount : 0

  const title =
    variant === 'bulk'
      ? isAdmin
        ? '관리자 권한 일괄 반려'
        : '강사 권한 일괄 반려'
      : isAdmin
        ? '관리자 신청 반려'
        : '강사 승인 반려'

  const handleConfirm = (payload: PermissionModalPayload) => {
    const notifyTiming: InstructorPermissionApproveNotifyTiming =
      payload.notifyTiming === 'on_announcement' ? 'immediate' : payload.notifyTiming
    onConfirm({ rejectionReason: payload.reason, notifyTiming })
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
      message={
        variant === 'single'
          ? `**[${displayName}]** 님의 ${isAdmin ? '관리자' : '강사'} 권한 요청을 반려하시겠습니까? 반려 시 아래에 반려 사유를 입력하여 주세요.`
          : `선택한 **${memberCount}명의 회원**의 ${isAdmin ? '관리자' : '강사'} 권한 요청을 반려하시겠습니까?\n반려 시 해당 사용자는 ${isAdmin ? '관리자' : '강사'} 권한을 부여받지 못합니다. 반려 사유는 아래에 입력해 주세요.`
      }
    />
  )
}
