import { CmsButton } from '@/shared/ui/cms-button'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import type { PermissionHeaderActionsProps } from './user-detail-fullpage-header-actions'

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

function normalizeApprovalStatus(status: string | undefined): ApprovalStatus {
  const raw = status?.trim()
  if (!raw) return 'PENDING'
  const upper = raw.toUpperCase()
  if (upper === 'APPROVED' || raw === '승인 완료') return 'APPROVED'
  if (upper === 'REJECTED' || raw === '신청 반려' || raw === '반려') return 'REJECTED'
  if (upper === 'PENDING' || raw === '승인 대기') return 'PENDING'
  return 'PENDING'
}

export function PermissionHeaderActions({
  permissionRole,
  displayUser,
  personalInfoButton,
  personalInfoRevealed,
  onPermissionApprove,
  onPermissionReject,
  onPermissionResetToPending,
}: PermissionHeaderActionsProps) {
  if (!permissionRole) {
    return null
  }

  const approvalStatus = normalizeApprovalStatus(displayUser.permissionApprovalStatus)

  return (
    <div className="info-section-buttons--wrapper">
      {approvalStatus === 'PENDING' ? (
        <>
          <CmsButton
            variant="delete"
            onClick={() => {
              onPermissionReject?.({ userId: displayUser.id, permissionRole })
            }}
          >
            신청 반려
          </CmsButton>
          <CmsButton
            variant="secondary"
            onClick={() => {
              onPermissionApprove?.({ userId: displayUser.id, permissionRole })
            }}
          >
            신청 승인
          </CmsButton>
        </>
      ) : null}
      {approvalStatus === 'REJECTED' ? (
        <CmsButton
          variant="delete"
          onClick={() => {
            onPermissionResetToPending?.({
              userId: displayUser.id,
              permissionRole,
              fromStatus: 'REJECTED',
            })
          }}
        >
          반려 취소
        </CmsButton>
      ) : null}
      {approvalStatus === 'APPROVED' ? (
        <CmsButton
          variant="delete"
          onClick={() => {
            onPermissionResetToPending?.({
              userId: displayUser.id,
              permissionRole,
              fromStatus: 'APPROVED',
            })
          }}
        >
          승인 취소
        </CmsButton>
      ) : null}
      {personalInfoButton ? (
        <PersonalInfoRevealButton
          labelMode="stickyReveal"
          revealed={personalInfoRevealed}
          cmsVariant={personalInfoButton.variant}
          cmsSize="large"
          width={180}
          onClick={personalInfoButton.onClick}
        />
      ) : null}
    </div>
  )
}
