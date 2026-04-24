import type { User } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'

export interface UserBasicInfoExternalId1365 {
  maskedLabel: string
  fullLabel?: string
  onOpen?: () => void
}

export interface BasicInfoViewContext {
  mode: 'view' | 'edit'
  role: 'all_users' | 'institution' | 'instructor' | 'admin'
  permissionView: boolean
  permissionRole?: 'instructor' | 'admin'
}

export interface BasicInfoSectionContext {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed: boolean
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  cmsMayEditBasicProfileFields: boolean
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  adminMemberProfileFieldsEditableWhenEditing?: boolean
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
  viewContext: BasicInfoViewContext
}
