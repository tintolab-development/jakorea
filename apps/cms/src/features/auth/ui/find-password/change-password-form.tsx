import { Form, Input } from 'antd'

import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_HELP_TEXT,
  REGISTER_PASSWORD_MIN_LENGTH,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'
import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import { authInputAllowClear } from '@/features/auth/ui/auth-input-clear-icon'
import { LoadingButton } from '@/shared/ui/loading-button'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

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
  newPassword: string
  newPasswordConfirm: string
}

interface FindPasswordChangeFormProps {
  form: ReturnType<typeof Form.useForm<FindPasswordChangeFormValues>>[0]
  isSubmitting: boolean
  submitError?: string | null
  onPasswordChange?: () => void
  onSubmit: () => void
}

export function FindPasswordChangeForm({
  form,
  isSubmitting,
  submitError,
  onPasswordChange,
  onSubmit,
}: FindPasswordChangeFormProps) {
  const newPassword = Form.useWatch('newPassword', form) ?? ''
  const newPasswordConfirm = Form.useWatch('newPasswordConfirm', form) ?? ''

  const isNewPasswordValid = isValidRegisterPassword(newPassword)
  const isNewPasswordConditionError =
    Boolean(newPassword) &&
    !isNewPasswordValid &&
    (newPassword.length >= REGISTER_PASSWORD_MIN_LENGTH || Boolean(newPasswordConfirm))
  const isConfirmMismatch =
    Boolean(newPasswordConfirm) &&
    newPassword !== newPasswordConfirm &&
    !isNewPasswordConditionError

  const canSubmit = isNewPasswordValid && Boolean(newPasswordConfirm) && !isConfirmMismatch

  return (
    <div className="find-password-change-step">
      <RegisterStepHeader
        title="새 비밀번호를 입력해 주세요"
        description="이제 새 비밀번호로 로그인할 수 있어요."
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form find-password-change-step__form"
        onFinish={onSubmit}
        onValuesChange={() => {
          onPasswordChange?.()
        }}
      >
        <Form.Item
          name="newPassword"
          label={<AuthFormLabel>새 비밀번호</AuthFormLabel>}
          validateStatus={isNewPasswordConditionError || submitError ? 'error' : undefined}
          rules={[{ required: true, message: '새 비밀번호를 입력해 주세요.' }]}
          extra={
            submitError ? (
              <p className="register-password-field__message register-password-field__message--error">
                {submitError}
              </p>
            ) : isNewPasswordConditionError ? null : (
              <p className="register-password-field__help">{REGISTER_PASSWORD_HELP_TEXT}</p>
            )
          }
        >
          <Input.Password
            className={getRegisterPasswordFieldClassName({
              hasError: isNewPasswordConditionError || Boolean(submitError),
            })}
            placeholder="새 비밀번호를 입력해 주세요"
            autoComplete="new-password"
            visibilityToggle={false}
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <Form.Item
          name="newPasswordConfirm"
          label={<AuthFormLabel>새 비밀번호 확인</AuthFormLabel>}
          validateStatus={isConfirmMismatch ? 'error' : undefined}
          rules={[{ required: true, message: '비밀번호를 한 번 더 입력해 주세요.' }]}
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
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            visibilityToggle={false}
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <div className="auth-actions find-password-change-step__actions">
          <LoadingButton
            type="primary"
            htmlType="submit"
            block
            className="auth-submit-btn"
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            비밀번호 변경하기
          </LoadingButton>
        </div>
      </Form>
    </div>
  )
}
