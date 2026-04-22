import { useState } from 'react'
import { AppStatusBadge } from '@/shared/components'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { CmsInput } from '@/shared/ui'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { ManagedProgramCountDisplay } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import { formatGenderBirthLine, socialLine } from '../display'
import { PermissionApprovalStatusWithResend } from '../status'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { NameBlockField } from '../fields/name-block-field'
import { ContactInfoFieldsRow } from './shared'
import type { BasicInfoSectionContext } from './types'
import { formatDate } from '@/shared/utils'

export function AdminSection(ctx: BasicInfoSectionContext) {
  const {
    user,
    personalInfoRevealed,
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    adminPermissionVariantPatching = false,
    onPatchAdminPermissionVariantFromDetailView,
    adminMemberProfileFieldsEditableWhenEditing = true,
    viewContext,
  } = ctx
  const [adminPermissionOpen, setAdminPermissionOpen] = useState(false)
  const editing = useBasicInfoEditing({
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields: adminMemberProfileFieldsEditableWhenEditing,
  })
  const isAdminPermissionDetail = viewContext.permissionView && viewContext.permissionRole === 'admin'
  const permDropdownInView = Boolean(onPatchAdminPermissionVariantFromDetailView) && !editing.isEditing
  const permEditorActive = editing.isEditing || permDropdownInView
  const permVariant = getAdminPermissionVariant(user)
  const selectedPerm =
    memberInfoDraft?.adminPermissionVariant === 'manager' ||
    memberInfoDraft?.adminPermissionVariant === 'partner' ||
    memberInfoDraft?.adminPermissionVariant === 'viewer'
      ? memberInfoDraft.adminPermissionVariant
      : permVariant
  const statusForPermDropdown: AdminPermissionTagVariant = editing.isEditing ? selectedPerm : permVariant
  const renderAdminPermBadge = (variant: AdminPermissionTagVariant) => (
    <AppStatusBadge
      label={ADMIN_PERMISSION_TAG_LABEL[variant]}
      className={`user-list-admin-perm-badge user-list-admin-perm-badge--${variant}`}
    />
  )

  return (
    <>
      <NameBlockField
        className="user-basic-info-section__admin-name-block"
        rows={[
          {
            subLabel: '한글',
            main: editing.canEditBasic ? (
              <CmsInput
                value={memberInfoDraft?.name ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ name: e.target.value })}
                inputSize="medium"
                width="100%"
                aria-label="한글 성명"
              />
            ) : (
              <span>{user.name}</span>
            ),
            sideLabel: isAdminPermissionDetail ? '권한 승인 현황' : '권한 유형',
            side: isAdminPermissionDetail ? (
              <PermissionApprovalStatusWithResend user={user} />
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
                    status={statusForPermDropdown}
                    statusOptions={['manager', 'partner', 'viewer']}
                    renderBadge={renderAdminPermBadge}
                    isItemDisabled={(cur, option) => cur === option}
                    onChange={async next => {
                      if (editing.isEditing) {
                        onMemberInfoDraftChange?.({ adminPermissionVariant: next })
                        return
                      }
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
            ),
          },
          {
            subLabel: '영문',
            main: editing.canEditBasic ? (
              <CmsInput
                value={memberInfoDraft?.nameEn ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ nameEn: e.target.value })}
                inputSize="medium"
                width="100%"
                placeholder="영문 성명"
              />
            ) : (
              <span>{user.nameEn ?? '-'}</span>
            ),
            sideLabel: isAdminPermissionDetail ? '성별 및 생년월일' : '담당 프로그램 수',
            side: isAdminPermissionDetail ? (
              <span>{formatGenderBirthLine(user)}</span>
            ) : (
              <span className="user-basic-info-section__admin-managed-programs">
                <ManagedProgramCountDisplay user={user} />
              </span>
            ),
          },
        ]}
      />

      <ContactInfoFieldsRow
        user={user}
        personalInfoRevealed={personalInfoRevealed}
        readOnlyDisplay={editing.isReadOnlyDisplay}
        phoneValue={memberInfoDraft?.phone ?? ''}
        emailValue={memberInfoDraft?.email ?? ''}
        onPhoneChange={next => onMemberInfoDraftChange?.({ phone: next })}
        onEmailChange={next => onMemberInfoDraftChange?.({ email: next })}
        phonePlaceholder="연락처"
        emailPlaceholder="이메일"
      />

      <EditableRow type="double">
        <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
        <EditableField label="연동된 소셜 계정" readOnlyDisplay view={<span>{socialLine(user)}</span>} />
      </EditableRow>
    </>
  )
}
