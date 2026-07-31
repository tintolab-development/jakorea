/**
 * 내 정보 확인 — 관리자 비밀번호 변경 모달
 */

import { Form } from 'antd'
import { useState } from 'react'
import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'
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
  rules?: Array<{ required?: boolean; message: string }>
}

function PasswordFieldRow({
  label,
  name,
  placeholder,
  autoComplete,
  hasError = false,
  errorMessage,
  rules,
}: PasswordFieldRowProps) {
  return (
    <div className="profile-password-change-modal__row">
      <label className="profile-password-change-modal__label" htmlFor={`profile-password-${name}`}>
        {label}
      </label>
      <div className="profile-password-change-modal__control">
        <Form.Item name={name} rules={rules} className="profile-password-change-modal__form-item">
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
    Boolean(newPasswordConfirm) && newPassword !== newPasswordConfirm && !isNewPasswordConditionError

  const handleCancel = () => {
    if (submitting) return
    form.resetFields()
    onCancel()
  }

  const handleSubmit = async (values: ProfilePasswordChangeFormValues) => {
    if (!isValidRegisterPassword(values.newPassword) || values.newPassword !== values.newPasswordConfirm) {
      return
    }

    setSubmitting(true)
    try {
      // TODO(api): POST /api/admin/auth/password/change 연동
      await new Promise(resolve => setTimeout(resolve, 150))
      form.resetFields()
      onSuccess?.()
      onCancel()
      showAlert({
        title: '비밀번호 변경 완료',
        content: '비밀번호가 변경되었습니다.',
      })
    } catch (error) {
      console.error('Failed to change password:', error)
      showAlert({
        title: '비밀번호 변경 실패',
        content: '비밀번호 변경에 실패했습니다. 다시 시도해 주세요.',
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
      className="profile-password-change-modal"
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
              void form.submit()
            }}
          >
            수정완료
          </CmsButton>
        </>
      }
    >
      <Form
        form={form}
        requiredMark={false}
        layout="vertical"
        onFinish={values => {
          void handleSubmit(values)
        }}
      >
        <div className="profile-password-change-modal__fields">
          <PasswordFieldRow
            label="현재 비밀번호"
            name="currentPassword"
            placeholder="현재 비밀번호를 입력해 주세요"
            autoComplete="current-password"
            rules={[{ required: true, message: '현재 비밀번호를 입력해 주세요.' }]}
          />
          <PasswordFieldRow
            label="새 비밀번호"
            name="newPassword"
            placeholder="변경할 비밀번호를 입력해 주세요"
            autoComplete="new-password"
            hasError={isNewPasswordConditionError}
            rules={[{ required: true, message: '새 비밀번호를 입력해 주세요.' }]}
          />
          <PasswordFieldRow
            label="새 비밀번호 확인"
            name="newPasswordConfirm"
            placeholder="변경할 비밀번호를 확인해 주세요"
            autoComplete="new-password"
            hasError={isConfirmMismatch}
            errorMessage={isConfirmMismatch ? REGISTER_PASSWORD_MISMATCH_MESSAGE : undefined}
            rules={[{ required: true, message: '비밀번호를 한 번 더 입력해 주세요.' }]}
          />
        </div>
      </Form>
    </ContentModal>
  )
}
