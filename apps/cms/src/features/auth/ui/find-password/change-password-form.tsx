import { Form, Input } from 'antd'
import { useEffect } from 'react'

import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_CONDITION_MESSAGE,
  REGISTER_PASSWORD_HELP_TEXT,
  REGISTER_PASSWORD_MIN_LENGTH,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'
import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import { authInputAllowClear } from '@/features/auth/ui/auth-input-clear-icon'
import { AuthLoadingButton } from '@/features/auth/ui/auth-loading-button'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

export const FIND_PASSWORD_WRONG_CURRENT_MESSAGE =
  '현재 비밀번호가 맞지 않아요. 다시 확인해 주세요.'

export const FIND_PASSWORD_SAME_AS_OLD_MESSAGE =
  '새 비밀번호가 기존 비밀번호와 같아요. 다른 비밀번호를 입력해 주세요'

function getRegisterPasswordFieldClassName({ hasError = false }: { hasError?: boolean } = {}) {
  return [
    'register-password-field',
    'register-password-field--clearable',
    hasError ? 'register-password-field--error' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export interface FindPasswordChangeFormValues {
  currentPassword: string
  newPassword: string
  newPasswordConfirm: string
}

interface FindPasswordChangeFormProps {
  form: ReturnType<typeof Form.useForm<FindPasswordChangeFormValues>>[0]
  isSubmitting: boolean
  wrongCurrentMessage?: string | null
  onSubmit: () => void
}

export function FindPasswordChangeForm({
  form,
  isSubmitting,
  wrongCurrentMessage,
  onSubmit,
}: FindPasswordChangeFormProps) {
  const currentPassword = Form.useWatch('currentPassword', form) ?? ''
  const newPassword = Form.useWatch('newPassword', form) ?? ''
  const newPasswordConfirm = Form.useWatch('newPasswordConfirm', form) ?? ''

  useEffect(() => {
    if (!wrongCurrentMessage) {
      return
    }
    form.setFields([
      {
        name: 'currentPassword',
        errors: [wrongCurrentMessage],
      },
    ])
  }, [form, wrongCurrentMessage])

  const isNewPasswordValid = isValidRegisterPassword(newPassword)
  const isNewPasswordConditionError =
    Boolean(newPassword) &&
    !isNewPasswordValid &&
    (newPassword.length >= REGISTER_PASSWORD_MIN_LENGTH || Boolean(newPasswordConfirm))
  const isSameAsCurrent =
    Boolean(newPassword) &&
    Boolean(currentPassword) &&
    newPassword === currentPassword &&
    !isNewPasswordConditionError
  const isConfirmMismatch =
    Boolean(newPasswordConfirm) &&
    newPassword !== newPasswordConfirm &&
    !isNewPasswordConditionError &&
    !isSameAsCurrent

  const canSubmit =
    Boolean(currentPassword) &&
    isNewPasswordValid &&
    Boolean(newPasswordConfirm) &&
    !isConfirmMismatch &&
    !isSameAsCurrent

  return (
    <div className="find-password-change-step">
      <RegisterStepHeader
        title="비밀번호를 변경해 주세요."
        description="안전한 계정 이용을 위해 주기적으로 변경해 주세요."
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form find-password-change-step__form"
        onFinish={onSubmit}
      >
        <Form.Item
          name="currentPassword"
          label={<AuthFormLabel>현재 비밀번호</AuthFormLabel>}
          validateStatus={wrongCurrentMessage ? 'error' : undefined}
          rules={[{ required: true, message: '현재 비밀번호를 입력해 주세요.' }]}
        >
          <Input.Password
            className={getRegisterPasswordFieldClassName({ hasError: Boolean(wrongCurrentMessage) })}
            placeholder="현재 비밀번호를 입력해 주세요"
            autoComplete="current-password"
            visibilityToggle={false}
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label={<AuthFormLabel>새 비밀번호</AuthFormLabel>}
          validateStatus={isNewPasswordConditionError || isSameAsCurrent ? 'error' : undefined}
          rules={[{ required: true, message: '새 비밀번호를 입력해 주세요.' }]}
          extra={
            isSameAsCurrent ? (
              <p className="register-password-field__message register-password-field__message--error">
                {FIND_PASSWORD_SAME_AS_OLD_MESSAGE}
              </p>
            ) : isNewPasswordConditionError ? (
              <p className="register-password-field__message register-password-field__message--error">
                {REGISTER_PASSWORD_CONDITION_MESSAGE}
              </p>
            ) : (
              <p className="register-password-field__help">{REGISTER_PASSWORD_HELP_TEXT}</p>
            )
          }
        >
          <Input.Password
            className={getRegisterPasswordFieldClassName({
              hasError: isNewPasswordConditionError || isSameAsCurrent,
            })}
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            visibilityToggle={false}
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <Form.Item
          name="newPasswordConfirm"
          label={<AuthFormLabel>새 비밀번호 확인</AuthFormLabel>}
          validateStatus={isConfirmMismatch ? 'error' : undefined}
          rules={[{ required: true, message: '새 비밀번호를 한 번 더 입력해 주세요.' }]}
          extra={
            isConfirmMismatch ? (
              <p className="register-password-field__message register-password-field__message--error">
                {REGISTER_PASSWORD_MISMATCH_MESSAGE}
              </p>
            ) : null
          }
        >
          <Input.Password
            className={getRegisterPasswordFieldClassName({ hasError: isConfirmMismatch })}
            placeholder="새 비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            visibilityToggle={false}
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <div className="auth-actions find-password-change-step__actions">
          <AuthLoadingButton
            type="primary"
            htmlType="submit"
            block
            className="auth-submit-btn"
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            비밀번호 변경하기
          </AuthLoadingButton>
        </div>
      </Form>
    </div>
  )
}
