/**
 * 관리자 상세 — 정보 수정 모드
 * 신규 등록(`AdminRegisterModal`)과 동일 구성 + 상세 전용 메타(가입일·소셜·권한·담당 프로그램)
 */

import { useEffect, useMemo, useState } from 'react'
import { Form } from 'antd'
import type { User } from '@/types/user'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  mapAdminProfileFormToBasicInfoDraftPartial,
  mapUserToAdminProfileFormValues,
} from '@/features/user/detail/lib/map-user-to-admin-profile-form'
import { ManagedProgramCountDisplay } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import { genderBirthView, socialView } from '@/features/user/detail/ui/user-basic-info/display'
import { PermissionApprovalStatusWithResend } from '@/features/user/detail/ui/user-basic-info/status'
import type { AdminRegisterModalFormValues } from '@/features/user/shared/ui/admin-register-modal'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import { AppStatusBadge } from '@/shared/components'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, CmsRadioGroup } from '@/shared/ui'
import {
  CmsDateTextInput,
} from '@/shared/ui/date-text-input'
import {
  UserConsentAgreementSection,
  type ConsentRowSchema,
} from '@/features/user/detail/ui/user-consent-agreement-section'
import { formatDate } from '@/shared/utils'
import '@/features/user/shared/ui/admin-register-modal.css'
import './admin-detail-edit-form.css'

const FORM_ITEM_STYLE = { marginBottom: 0, width: '100%' } as const

const GENDER_OPTIONS = [
  { label: '남', value: 'male' as const },
  { label: '여', value: 'female' as const },
]

const ADMIN_CONSENT_CAPTION =
  '* 미동의 시 서비스 가입 및 관리자 활동에 제한이 있을 수 있습니다.'

export interface AdminDetailEditFormProps {
  user: Omit<User, 'password'>
  memberInfoDraft: AdminProvisionedMemberBasicInfoDraft
  onMemberInfoDraftChange: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  profileFieldsEditable: boolean
  isAdminPermissionDetail?: boolean
  remoteConsentRows?: ConsentRowSchema[]
  remoteConsentLoading?: boolean
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
}

export function AdminDetailEditForm({
  user,
  memberInfoDraft,
  onMemberInfoDraftChange,
  profileFieldsEditable,
  isAdminPermissionDetail = false,
  remoteConsentRows,
  remoteConsentLoading = false,
  onPermissionResendNotification,
}: AdminDetailEditFormProps) {
  const [form] = Form.useForm<AdminRegisterModalFormValues>()
  const [adminPermissionOpen, setAdminPermissionOpen] = useState(false)

  const initialValues = useMemo(() => mapUserToAdminProfileFormValues(user), [user])

  useEffect(() => {
    form.setFieldsValue(initialValues)
    onMemberInfoDraftChange(mapAdminProfileFormToBasicInfoDraftPartial(initialValues))
  }, [form, initialValues, onMemberInfoDraftChange])

  const syncDraftFromForm = (values: AdminRegisterModalFormValues) => {
    if (profileFieldsEditable) {
      onMemberInfoDraftChange(mapAdminProfileFormToBasicInfoDraftPartial(values))
    }
  }

  const permVariant = getAdminPermissionVariant(user)
  const selectedPerm =
    memberInfoDraft.adminPermissionVariant === 'manager' ||
    memberInfoDraft.adminPermissionVariant === 'partner' ||
    memberInfoDraft.adminPermissionVariant === 'viewer'
      ? memberInfoDraft.adminPermissionVariant
      : permVariant

  const renderAdminPermBadge = (variant: AdminPermissionTagVariant) => (
    <AppStatusBadge
      label={ADMIN_PERMISSION_TAG_LABEL[variant]}
      className={`user-list-admin-perm-badge user-list-admin-perm-badge--${variant}`}
    />
  )

  const permissionField = isAdminPermissionDetail ? (
    <PermissionApprovalStatusWithResend
      user={user}
      onPermissionResendNotification={onPermissionResendNotification}
      notifyPermissionRole="admin"
    />
  ) : (
    <span
      className={`${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME}`}
    >
      <StatusDropdownCell<AdminPermissionTagVariant>
        status={selectedPerm}
        statusOptions={['manager', 'partner', 'viewer']}
        renderBadge={renderAdminPermBadge}
        isItemDisabled={(cur, option) => cur === option}
        onChange={next => onMemberInfoDraftChange({ adminPermissionVariant: next })}
        isUpdating={false}
        isOpen={adminPermissionOpen}
        onOpenChange={setAdminPermissionOpen}
        tagLayout="tag160"
        emptyPlaceholder="-"
      />
    </span>
  )

  const profileReadOnly = !profileFieldsEditable

  return (
    <div className="admin-detail-edit-form admin-register-modal__sections">
      <Form<AdminRegisterModalFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        className="admin-detail-edit-form__form"
        onValuesChange={(_, all) => syncDraftFromForm(all)}
      >
        <div className="user-basic-info-section__split-cards">
          <DetailInfoForm
            title="기본 정보"
            mode="edit"
            className="admin-register-modal__section admin-register-modal__section--basic"
          >
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="가입일"
                view={formatDate(user.createdAt)}
                edit={<span>{formatDate(user.createdAt)}</span>}
              />
              <DetailInfoForm.Field
                label="연동된 소셜 계정"
                view={socialView(user)}
                edit={<span>{socialView(user)}</span>}
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>

          <DetailInfoForm
            title="기본 정보 — 성명·연락처 등"
            hideHeader
            mode="edit"
            className="admin-register-modal__section admin-register-modal__section--basic user-basic-info-section"
          >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="성명"
              required={profileFieldsEditable}
              labelWidth={200}
              view={user.name ?? '-'}
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
              labelWidth={200}
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
              labelWidth={200}
              view={user.phone ?? '-'}
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
              labelWidth={200}
              view={user.email ?? '-'}
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
            />
            {isAdminPermissionDetail ? (
              <DetailInfoForm.Field
                label="성별 및 생년월일"
                view={genderBirthView(user)}
                edit={<span>{genderBirthView(user)}</span>}
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
              />
            )}
          </DetailInfoForm.Row>
          </DetailInfoForm>
        </div>
      </Form>

      <UserConsentAgreementSection
        preset="admin"
        caption={ADMIN_CONSENT_CAPTION}
        remoteConsentRows={remoteConsentRows}
        remoteConsentLoading={remoteConsentLoading}
      />
    </div>
  )
}
