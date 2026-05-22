import { ContentModal, CmsButton } from '@/shared/ui'
import type { PermissionApproveModalKind } from '@/features/user/permission-management/instructor-permission-approve-modal'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'

function resolveAdminPermissionPhrase(variant: AdminPermissionTagVariant | undefined): string {
  if (variant === 'partner') return `${ADMIN_PERMISSION_TAG_LABEL.partner} 권한`
  if (variant === 'viewer') return `${ADMIN_PERMISSION_TAG_LABEL.viewer} 권한`
  return `${ADMIN_PERMISSION_TAG_LABEL.manager} 권한`
}

function buildSingleApprovedDescription(
  userDisplayName: string,
  permissionKind: PermissionApproveModalKind,
  approvedPermissionVariant?: AdminPermissionTagVariant
): string {
  const name = userDisplayName.trim() || '회원'
  const isAdmin = permissionKind === 'admin'

  if (isAdmin) {
    const adminPermissionPhrase = resolveAdminPermissionPhrase(approvedPermissionVariant)
    return `**[${name}]** 님의 관리자 권한을 승인하였습니다.\n${name} 님은 지금부터 **${adminPermissionPhrase}**으로 JA 관리자 활동이 가능합니다.`
  }

  return `**[${name}]** 님의 강사 권한을 승인하였습니다.\n${name} 님은 지금부터 JA 강사단 소속으로 강사 활동이 가능합니다.\n(JA 강사단 및 제미나이 강사단은 프로그램에 따라 특강 강사로도 활동이 가능합니다.)`
}

function buildBulkApprovedDescription(
  memberCount: number,
  permissionKind: PermissionApproveModalKind,
  approvedPermissionVariant?: AdminPermissionTagVariant
): string {
  const isAdmin = permissionKind === 'admin'

  if (isAdmin) {
    const adminPermissionPhrase = resolveAdminPermissionPhrase(approvedPermissionVariant)
    return `선택한 **${memberCount}명의 회원**의 관리자 권한을 승인하였습니다.\n해당 회원은 지금부터 **${adminPermissionPhrase}**으로 JA 관리자 활동이 가능합니다.`
  }

  return `선택한 **${memberCount}명의 회원**의 강사 권한을 승인하였습니다.\n해당 회원은 지금부터 JA 강사단 소속으로 강사 활동이 가능합니다.\n(JA 강사단 및 제미나이 강사단은 프로그램에 따라 특강 강사로도 활동이 가능합니다.)`
}

type InstructorPermissionApprovedCompleteModalBaseProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
  permissionKind?: PermissionApproveModalKind
  approvedPermissionVariant?: AdminPermissionTagVariant
}

export type InstructorPermissionApprovedCompleteModalProps =
  | (InstructorPermissionApprovedCompleteModalBaseProps & {
      variant: 'single'
      userDisplayName: string
    })
  | (InstructorPermissionApprovedCompleteModalBaseProps & {
      variant: 'bulk'
      memberCount: number
    })

export function InstructorPermissionApprovedCompleteModal(
  props: InstructorPermissionApprovedCompleteModalProps
) {
  const {
    open,
    onClose,
    zIndex,
    variant,
    permissionKind = 'instructor',
    approvedPermissionVariant,
  } = props
  const isAdmin = permissionKind === 'admin'

  const description =
    variant === 'single'
      ? buildSingleApprovedDescription(
          props.userDisplayName,
          permissionKind,
          approvedPermissionVariant
        )
      : buildBulkApprovedDescription(
          props.memberCount,
          permissionKind,
          approvedPermissionVariant
        )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={isAdmin ? '관리자 권한 승인 완료' : '강사 권한 승인 완료'}
      width={600}
      description={description}
      zIndex={zIndex}
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
