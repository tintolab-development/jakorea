/**
 * 관리자 상세 — 기본 정보 (조회·수정 단일 JSX)
 */

import type { ReactNode } from 'react'
import { Form } from 'antd'
import type { User } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import { ManagedProgramCountDisplay } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, CmsPhoneInput, CmsRadioGroup } from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { formatDate } from '@/shared/utils'
import { detailEmailDisplay, detailPhoneDisplay, genderBirthView, socialView } from './display'
import { AdminPermissionTypeField } from './admin-permission-type-field'
import {
  normalizePermissionApprovalStatus,
  PermissionApprovalStatusWithResend,
} from './status'
import { useAdminProfileForm } from './use-admin-profile-form'

const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

const GENDER_OPTIONS = [
  { label: '남', value: 'male' as const },
  { label: '여', value: 'female' as const },
]

export type AdminBasicInfoSectionProps = {
  user: Omit<User, 'password'>
  mode: 'view' | 'edit'
  caption?: ReactNode
  personalInfoRevealed?: boolean
  isAdminPermissionDetail?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  adminMemberProfileFieldsEditableWhenEditing?: boolean
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
}

export function AdminBasicInfoSection({
  user,
  mode,
  caption,
  personalInfoRevealed = false,
  isAdminPermissionDetail = false,
  memberInfoDraft,
  onMemberInfoDraftChange,
  adminMemberProfileFieldsEditableWhenEditing = true,
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
  onPermissionResendNotification,
}: AdminBasicInfoSectionProps) {
  const profileFieldsEditable =
    mode === 'edit' && adminMemberProfileFieldsEditableWhenEditing
  const profileReadOnly = mode === 'edit' && !profileFieldsEditable

  const isApproved =
    normalizePermissionApprovalStatus(user.permissionApprovalStatus) === 'APPROVED'

  const { form, initialValues, syncDraftFromForm } = useAdminProfileForm({
    user,
    mode,
    profileFieldsEditable,
    onMemberInfoDraftChange,
  })

  const permissionTypeField = (
    <AdminPermissionTypeField
      mode={mode}
      user={user}
      adminPermissionVariantPatching={adminPermissionVariantPatching}
      onPatchAdminPermissionVariantFromDetailView={onPatchAdminPermissionVariantFromDetailView}
      memberInfoDraft={memberInfoDraft}
      onMemberInfoDraftChange={onMemberInfoDraftChange}
    />
  )

  const managedProgramCountField = (
    <DetailInfoForm.Field
      label="담당 프로그램 수"
      view={
        <span className="user-basic-info-section__admin-managed-programs">
          <ManagedProgramCountDisplay user={user} />
        </span>
      }
      edit={
        <span className="user-basic-info-section__admin-managed-programs">
          <ManagedProgramCountDisplay user={user} />
        </span>
      }
      readOnlyDisplay
    />
  )

  const metaCard = isAdminPermissionDetail ? (
    <DetailInfoForm title="기본 정보" description={caption} mode={mode}>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          fullRow
          label="권한 승인 현황"
          view={
            <PermissionApprovalStatusWithResend
              user={user}
              onPermissionResendNotification={onPermissionResendNotification}
              notifyPermissionRole="admin"
            />
          }
          edit={
            <PermissionApprovalStatusWithResend
              user={user}
              onPermissionResendNotification={onPermissionResendNotification}
              notifyPermissionRole="admin"
            />
          }
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="가입일"
          view={<span>{formatDate(user.createdAt)}</span>}
          edit={<span>{formatDate(user.createdAt)}</span>}
          readOnlyDisplay
        />
        <DetailInfoForm.Field
          label="연동된 소셜 계정"
          view={socialView(user)}
          edit={<span>{socialView(user)}</span>}
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  ) : (
    <DetailInfoForm title="기본 정보" description={caption} mode={mode}>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="가입일"
          view={<span>{formatDate(user.createdAt)}</span>}
          edit={<span>{formatDate(user.createdAt)}</span>}
          readOnlyDisplay
        />
        <DetailInfoForm.Field
          label="연동된 소셜 계정"
          view={socialView(user)}
          edit={<span>{socialView(user)}</span>}
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )

  const permissionAndProgramRow = isAdminPermissionDetail ? (
    isApproved ? (
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="권한 유형"
          view={permissionTypeField}
          edit={permissionTypeField}
          readOnlyDisplay
        />
        {managedProgramCountField}
      </DetailInfoForm.Row>
    ) : null
  ) : (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label="권한 유형"
        view={permissionTypeField}
        edit={permissionTypeField}
        readOnlyDisplay
      />
      {managedProgramCountField}
    </DetailInfoForm.Row>
  )

  const splitCards = (
    <div className="user-basic-info-section__split-cards">
      {metaCard}

      <DetailInfoForm
        title="기본 정보 — 성명·연락처 등"
        hideHeader
        className="user-basic-info-section"
        mode={mode}
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="성명"
            required={profileFieldsEditable}
            labelWidth={mode === 'edit' ? 200 : undefined}
            view={<span>{user.name}</span>}
            edit={
              profileReadOnly ? (
                <span>{user.name ?? '-'}</span>
              ) : (
                <Form.Item name="name" style={FORM_ITEM_STYLE}>
                  <CmsInput placeholder="한글 성명" inputSize="small" width="100%" />
                </Form.Item>
              )
            }
          />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            required={profileFieldsEditable}
            labelWidth={mode === 'edit' ? 200 : undefined}
            view={genderBirthView(user)}
            edit={
              profileReadOnly ? (
                <span>{genderBirthView(user)}</span>
              ) : (
                <span className="detail-info-form-inputs-wrapper-no-gap">
                  <Form.Item name="gender" noStyle>
                    <CmsRadioGroup options={GENDER_OPTIONS} size="medium" />
                  </Form.Item>
                  <DetailInfoForm.InputsSeparator />
                  <Form.Item
                    name="birthDate"
                    style={{ ...FORM_ITEM_STYLE, flex: '1 1 0', minWidth: 0 }}
                    trigger="onValueChange"
                    getValueFromEvent={(value: string) => value}
                  >
                    <CmsDateTextInput
                      placeholder="YYYY.MM.DD"
                      maxLength={10}
                      inputSize="small"
                      width="100%"
                    />
                  </Form.Item>
                </span>
              )
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="연락처"
            required={profileFieldsEditable}
            labelWidth={mode === 'edit' ? 200 : undefined}
            view={<span>{detailPhoneDisplay(user, personalInfoRevealed)}</span>}
            edit={
              profileReadOnly ? (
                <span>{user.phone ?? '-'}</span>
              ) : (
                <Form.Item name="contact" style={FORM_ITEM_STYLE}>
                  <CmsPhoneInput placeholder="연락처" inputSize="small" width="100%" />
                </Form.Item>
              )
            }
          />
          <DetailInfoForm.Field
            label="이메일"
            required={profileFieldsEditable}
            labelWidth={mode === 'edit' ? 200 : undefined}
            view={<span>{detailEmailDisplay(user, personalInfoRevealed)}</span>}
            edit={
              profileReadOnly ? (
                <span>{user.email ?? '-'}</span>
              ) : (
                <Form.Item name="email" style={FORM_ITEM_STYLE}>
                  <CmsInput placeholder="이메일" inputSize="small" width="100%" />
                </Form.Item>
              )
            }
          />
        </DetailInfoForm.Row>

        {permissionAndProgramRow}
      </DetailInfoForm>
    </div>
  )

  if (mode === 'edit') {
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        onValuesChange={(_, all) => syncDraftFromForm(all)}
      >
        {splitCards}
      </Form>
    )
  }

  return splitCards
}
