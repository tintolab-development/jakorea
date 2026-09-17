/**
 * 내 정보 확인 — 관리자 비밀번호 변경 모달
 */

import { Form } from 'antd'
import { useState } from 'react'
import { fetchAdminPasswordChange } from '@/features/auth/api/admin-password-change-fetcher'
import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { CmsButton, CmsInput, ContentModal, useCmsAlert } from '@/shared/ui'
import './profile-password-change-modal.css'

export interface ProfilePasswordChangeModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

type ProfilePasswordChangeFormValues = {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

const MODAL_DESCRIPTION =
  '개인정보를 안전하게 보호하기 위해 비밀번호를 주기적(90일)으로 변경해 주세요.\n비밀번호는 8자 이상의 영문, 숫자, 특수문자를 조합하여 사용 가능합니다.'

type PasswordFieldRowProps = {
  label: string
  name: keyof ProfilePasswordChangeFormValues
  placeholder: string
  autoComplete: string
  hasError?: boolean
  errorMessage?: string
}

function PasswordFieldRow({
  label,
  name,
  placeholder,
  autoComplete,
  hasError = false,
  errorMessage,
}: PasswordFieldRowProps) {
  return (
    <div className="profile-password-change-modal__row">
      <label className="profile-password-change-modal__label" htmlFor={`profile-password-${name}`}>
        <span className="profile-password-change-modal__label-text">{label}</span>
        <span className="profile-password-change-modal__required" aria-hidden>
          *
        </span>
      </label>
      <div className="profile-password-change-modal__control">
        <Form.Item name={name} className="profile-password-change-modal__form-item">
          <CmsInput
            id={`profile-password-${name}`}
            type="password"
            inputSize="large"
            width="100%"
            className={hasError ? 'profile-password-change-modal__input--error' : undefined}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        </Form.Item>
        {errorMessage ? (
          <p className="profile-password-change-modal__error-message">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  )
}

export function ProfilePasswordChangeModal({
  open,
  onCancel,
  onSuccess,
}: ProfilePasswordChangeModalProps) {
  const [form] = Form.useForm<ProfilePasswordChangeFormValues>()
  const { showAlert } = useCmsAlert()
  const [submitting, setSubmitting] = useState(false)

  const newPassword = Form.useWatch('newPassword', form) ?? ''
  const newPasswordConfirm = Form.useWatch('newPasswordConfirm', form) ?? ''

  const isNewPasswordValid = isValidRegisterPassword(newPassword)
  const isNewPasswordConditionError =
    Boolean(newPassword) &&
    !isNewPasswordValid &&
    (newPassword.length >= 8 || Boolean(newPasswordConfirm))
  const isConfirmMismatch =
    Boolean(newPasswordConfirm) &&
    newPassword !== newPasswordConfirm &&
    !isNewPasswordConditionError

  const handleCancel = () => {
    if (submitting) return
    form.resetFields()
    onCancel()
  }

  const handleChangeComplete = async () => {
    if (submitting) return

    const values = form.getFieldsValue()
    const currentPassword = (values.currentPassword ?? '').trim()
    const nextPassword = (values.newPassword ?? '').trim()
    const nextPasswordConfirm = (values.newPasswordConfirm ?? '').trim()

    if (!currentPassword || !nextPassword || !nextPasswordConfirm) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }

    if (!isValidRegisterPassword(nextPassword) || nextPassword !== nextPasswordConfirm) {
      return
    }

    setSubmitting(true)
    try {
      await fetchAdminPasswordChange({
        currentPassword,
        newPassword: nextPassword,
      })
      form.resetFields()
      onSuccess?.()
      onCancel()
      showAlert({
        title: '비밀번호 변경 완료',
        content: '비밀번호가 변경되었습니다.',
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.'
      showAlert({
        title: '비밀번호 변경 실패',
        content: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="비밀번호 변경"
      description={MODAL_DESCRIPTION}
      width={600}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={handleCancel} disabled={submitting}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            loading={submitting}
            onClick={() => {
              void handleChangeComplete()
            }}
          >
            변경 완료
          </CmsButton>
        </>
      }
    >
      <Form form={form} requiredMark={false} layout="vertical">
        <div className="profile-password-change-modal__fields">
          <PasswordFieldRow
            label="현재 비밀번호"
            name="currentPassword"
            placeholder="현재 비밀번호를 입력해 주세요"
            autoComplete="current-password"
          />
          <PasswordFieldRow
            label="새 비밀번호"
            name="newPassword"
            placeholder="변경할 비밀번호를 입력해 주세요"
            autoComplete="new-password"
            hasError={isNewPasswordConditionError}
          />
          <PasswordFieldRow
            label="새 비밀번호 확인"
            name="newPasswordConfirm"
            placeholder="변경할 비밀번호를 확인해 주세요"
            autoComplete="new-password"
            hasError={isConfirmMismatch}
            errorMessage={isConfirmMismatch ? REGISTER_PASSWORD_MISMATCH_MESSAGE : undefined}
          />
        </div>
      </Form>
    </ContentModal>
  )
}
