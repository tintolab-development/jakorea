import { CmsButton } from '@/shared/ui/cms-button'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import type { PermissionHeaderActionsProps } from './user-detail-fullpage-header-actions'

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

  const approvalStatus = displayUser.permissionApprovalStatus ?? 'PENDING'

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
          variant="secondary"
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
          variant="secondary"
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
          ui="cms"
          labelMode="stickyReveal"
          revealed={personalInfoRevealed}
          cmsVariant={personalInfoButton.variant}
          cmsSize="medium"
          width={180}
          onClick={personalInfoButton.onClick}
        />
      ) : null}
    </div>
  )
}
