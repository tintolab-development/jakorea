import { useState } from 'react'
import type { User } from '@/types/user'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  ADMIN_PERMISSION_SELECT_OPTIONS,
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
  isAdminPermissionTagVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { AppStatusBadge } from '@/shared/components'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { AdminMfaResetButton } from '@/features/user/detail/ui/admin-mfa-reset-button'

export type AdminPermissionTypeFieldProps = {
  mode: 'view' | 'edit'
  user: Omit<User, 'password'>
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
}

function renderAdminPermBadge(variant: AdminPermissionTagVariant) {
  return (
    <AppStatusBadge
      label={ADMIN_PERMISSION_TAG_LABEL[variant]}
      className={`user-list-admin-perm-badge user-list-admin-perm-badge--${variant}`}
    />
  )
}

export function AdminPermissionTypeField({
  mode,
  user,
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
  memberInfoDraft,
  onMemberInfoDraftChange,
}: AdminPermissionTypeFieldProps) {
  const [adminPermissionOpen, setAdminPermissionOpen] = useState(false)
  const permVariant = getAdminPermissionVariant(user)

  const selectedPerm =
    mode === 'edit' && isAdminPermissionTagVariant(memberInfoDraft?.adminPermissionVariant)
      ? memberInfoDraft.adminPermissionVariant
      : permVariant

  const permDropdownInView =
    mode === 'view' && Boolean(onPatchAdminPermissionVariantFromDetailView)
  const permDropdownInEdit = mode === 'edit' && Boolean(onMemberInfoDraftChange)

  const mfaReset = mode === 'view' ? <AdminMfaResetButton target={user} /> : null

  if (permDropdownInView || permDropdownInEdit) {
    return (
      <span
        className={`user-basic-info-section__admin-permission-inline ${STATUS_DROPDOWN_CELL_CLASSNAME}`}
      >
        <StatusDropdownCell<AdminPermissionTagVariant>
          status={selectedPerm}
          statusOptions={ADMIN_PERMISSION_SELECT_OPTIONS.map(option => option.value)}
          renderBadge={renderAdminPermBadge}
          isItemDisabled={(cur, option) => cur === option}
          onChange={async next => {
            if (permDropdownInView) {
              await onPatchAdminPermissionVariantFromDetailView?.(next)
              return
            }
            onMemberInfoDraftChange?.({ adminPermissionVariant: next })
          }}
          isUpdating={permDropdownInView && adminPermissionVariantPatching}
          isOpen={adminPermissionOpen}
          onOpenChange={setAdminPermissionOpen}
          tagLayout="default"
          emptyPlaceholder="-"
        />
        {mfaReset}
      </span>
    )
  }

  return (
    <span className="user-basic-info-section__admin-permission-inline">
      <span className={`user-list-admin-perm-tag user-list-admin-perm-tag--${permVariant}`}>
        {ADMIN_PERMISSION_TAG_LABEL[permVariant]}
      </span>
      {mfaReset}
    </span>
  )
}
