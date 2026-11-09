import { useState } from 'react'
import type { User } from '@/types/user'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  ADMIN_PERMISSION_SELECT_OPTIONS,
  getAdminPermissionVariant,
  isAdminPermissionTagVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { StatusTag } from '@/shared/components/status-tag'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { AdminMfaResetButton } from '@/features/user/detail/ui/admin-mfa-reset-button'
import { getAdminPermissionTag } from '@/shared/lib/status-tag-specs'
import { guardAdminAction } from '@/shared/lib/admin-role-policy'
import { getSessionAdminRoleCode } from '@/shared/lib/session-admin-role'

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
          getTag={getAdminPermissionTag}
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
          onOpenChange={open => {
            // 권한 설정 V1.2: 관리자 권한 유형 변경은 Master 전용. Master가 아니면 열지 않고 안내.
            if (open && !guardAdminAction({ roleCode: getSessionAdminRoleCode(), action: 'adminAccountManage' })) return
            setAdminPermissionOpen(open)
          }}
          emptyPlaceholder="-"
        />
        {mfaReset}
      </span>
    )
  }

  return (
    <span className="user-basic-info-section__admin-permission-inline">
      <StatusTag {...getAdminPermissionTag(permVariant)} />
      {mfaReset}
    </span>
  )
}
