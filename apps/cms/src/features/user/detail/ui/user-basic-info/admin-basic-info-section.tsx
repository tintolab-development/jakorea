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
import { CmsInput, CmsRadioGroup } from '@/shared/ui'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { formatDate } from '@/shared/utils'
import { detailEmailDisplay, detailPhoneDisplay, genderBirthView, socialView } from './display'
import { AdminPermissionTypeField } from './admin-permission-type-field'
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

  const { form, initialValues, syncDraftFromForm } = useAdminProfileForm({
    user,
    mode,
    profileFieldsEditable,
    onMemberInfoDraftChange,
  })

  const permissionField = (
    <AdminPermissionTypeField
      mode={mode}
      user={user}
      isAdminPermissionDetail={isAdminPermissionDetail}
      onPermissionResendNotification={onPermissionResendNotification}
      adminPermissionVariantPatching={adminPermissionVariantPatching}
      onPatchAdminPermissionVariantFromDetailView={onPatchAdminPermissionVariantFromDetailView}
      memberInfoDraft={memberInfoDraft}
      onMemberInfoDraftChange={onMemberInfoDraftChange}
    />
  )

  const splitCards = (
    <div className="user-basic-info-section__split-cards">
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
                  <CmsInput placeholder="한글 성명" inputSize="medium" width="100%" />
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
                      inputSize="medium"
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
                  <CmsInput placeholder="연락처" inputSize="medium" width="100%" />
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
                  <CmsInput placeholder="이메일" inputSize="medium" width="100%" />
                </Form.Item>
              )
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label={isAdminPermissionDetail ? '권한 승인 현황' : '권한 유형'}
            view={permissionField}
            edit={permissionField}
            readOnlyDisplay
          />
          {isAdminPermissionDetail ? (
            <DetailInfoForm.Field
              label="성별 및 생년월일"
              view={genderBirthView(user)}
              edit={<span>{genderBirthView(user)}</span>}
              readOnlyDisplay
            />
          ) : (
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
          )}
        </DetailInfoForm.Row>
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
