import { CmsButton } from '@/shared/ui/cms-button'
import type { PermissionHeaderActionsProps } from './user-detail-fullpage-header-actions'

export function PermissionHeaderActions({
  permissionRole,
  displayUser,
  personalInfoButton,
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
        <CmsButton width={180} variant={personalInfoButton.variant} onClick={personalInfoButton.onClick}>
          {personalInfoButton.label}
        </CmsButton>
      ) : null}
    </div>
  )
}
