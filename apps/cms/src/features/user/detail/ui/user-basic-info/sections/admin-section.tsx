import { useState } from 'react'
import { AppStatusBadge } from '@/shared/components'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { ManagedProgramCountDisplay } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import { genderBirthView, socialView } from '../display'
import { PermissionApprovalStatusWithResend } from '../status'
import { detailEmailDisplay, detailPhoneDisplay } from '../display'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import type { BasicInfoSectionContext } from './types'
import { formatDate } from '@/shared/utils'

export function AdminMetaSection(ctx: BasicInfoSectionContext) {
  const { user } = ctx
  return (
    <EditableRow type="double">
      <EditableField
        label="가입일"
        readOnlyDisplay
        view={<span>{formatDate(user.createdAt)}</span>}
      />
      <EditableField label="연동된 소셜 계정" readOnlyDisplay view={socialView(user)} />
    </EditableRow>
  )
}

export function AdminProfileSection(ctx: BasicInfoSectionContext) {
  const {
    user,
    personalInfoRevealed,
    adminPermissionVariantPatching = false,
    onPatchAdminPermissionVariantFromDetailView,
    onPermissionResendNotification,
    viewContext,
  } = ctx
  const [adminPermissionOpen, setAdminPermissionOpen] = useState(false)
  const isAdminPermissionDetail = viewContext.permissionView && viewContext.permissionRole === 'admin'
  const permDropdownInView = Boolean(onPatchAdminPermissionVariantFromDetailView)
  const permEditorActive = permDropdownInView
  const permVariant = getAdminPermissionVariant(user)
  const renderAdminPermBadge = (variant: AdminPermissionTagVariant) => (
    <AppStatusBadge
      label={ADMIN_PERMISSION_TAG_LABEL[variant]}
      className={`user-list-admin-perm-badge user-list-admin-perm-badge--${variant}`}
    />
  )

  const permissionOrTypeSide = isAdminPermissionDetail ? (
    <PermissionApprovalStatusWithResend
      user={user}
      onPermissionResendNotification={onPermissionResendNotification}
      notifyPermissionRole="admin"
    />
  ) : (
    <span
      className={
        permEditorActive
          ? `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME}`
          : undefined
      }
    >
      {permEditorActive ? (
        <StatusDropdownCell<AdminPermissionTagVariant>
          status={permVariant}
          statusOptions={['manager', 'partner', 'viewer']}
          renderBadge={renderAdminPermBadge}
          isItemDisabled={(cur, option) => cur === option}
          onChange={async next => {
            await onPatchAdminPermissionVariantFromDetailView?.(next)
          }}
          isUpdating={permDropdownInView && adminPermissionVariantPatching}
          isOpen={adminPermissionOpen}
          onOpenChange={setAdminPermissionOpen}
          tagLayout="tag160"
          emptyPlaceholder="-"
        />
      ) : (
        <span className={`user-list-admin-perm-tag user-list-admin-perm-tag--${permVariant}`}>
          {ADMIN_PERMISSION_TAG_LABEL[permVariant]}
        </span>
      )}
    </span>
  )

  return (
    <>
      <EditableRow type="double">
        <EditableField label="성명" readOnlyDisplay view={<span>{user.name}</span>} />
        <EditableField
          label="성별 및 생년월일"
          readOnlyDisplay
          view={genderBirthView(user)}
        />
      </EditableRow>

      <EditableRow type="double">
        <EditableField
          label="연락처"
          readOnlyDisplay
          view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
        />
        <EditableField
          label="이메일"
          readOnlyDisplay
          view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
        />
      </EditableRow>

      <EditableRow type="double">
        <EditableField
          label={isAdminPermissionDetail ? '권한 승인 현황' : '권한 유형'}
          readOnlyDisplay
          view={permissionOrTypeSide}
        />
        {isAdminPermissionDetail ? (
          <EditableField
            label="성별 및 생년월일"
            readOnlyDisplay
            view={genderBirthView(user)}
          />
        ) : (
          <EditableField
            label="담당 프로그램 수"
            readOnlyDisplay
            view={
              <span className="user-basic-info-section__admin-managed-programs">
                <ManagedProgramCountDisplay user={user} />
              </span>
            }
          />
        )}
      </EditableRow>
    </>
  )
}
