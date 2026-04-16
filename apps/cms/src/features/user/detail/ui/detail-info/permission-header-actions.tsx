import { CmsButton } from '@/shared/ui/cms-button'
import type { PermissionHeaderActionsProps } from './user-detail-fullpage-header-actions'

export function PermissionHeaderActions({
  permissionRole,
  displayUser,
  personalInfoButton,
  onPermissionApprove,
  onPermissionReject,
}: PermissionHeaderActionsProps) {
  if (!permissionRole) {
    return null
  }

  return (
    <div className="info-section-buttons--wrapper">
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
      {personalInfoButton ? (
        <CmsButton width={180} variant={personalInfoButton.variant} onClick={personalInfoButton.onClick}>
          {personalInfoButton.label}
        </CmsButton>
      ) : null}
    </div>
  )
}
