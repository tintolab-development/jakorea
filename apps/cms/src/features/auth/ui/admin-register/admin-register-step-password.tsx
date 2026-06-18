import { Button, Form, Input } from 'antd'
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
import type { AdminRegisterStep5Data, AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterStepHeader } from './register-step-header'

function getRegisterPasswordFieldClassName({ hasError = false }: { hasError?: boolean } = {}) {
  return [
    'register-password-field',
    'register-password-field--clearable',
    hasError ? 'register-password-field--error' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

interface AdminRegisterStepPasswordProps {
  initialValues?: Pick<AdminRegisterWizardData, 'password'>
  onNext: (values: AdminRegisterStep5Data) => void
  onBack: () => void
}

export function AdminRegisterStepPassword({
  initialValues,
  onNext,
  onBack,
}: AdminRegisterStepPasswordProps) {
  const [form] = Form.useForm<AdminRegisterStep5Data & { passwordConfirm: string }>()
  const password = Form.useWatch('password', form) ?? ''
  const passwordConfirm = Form.useWatch('passwordConfirm', form) ?? ''

  useEffect(() => {
    form.setFieldsValue({
      password: initialValues?.password ?? '',
      passwordConfirm: initialValues?.password ?? '',
    })
  }, [form, initialValues?.password])

  const isPasswordValid = isValidRegisterPassword(password)
  const isPasswordConditionError =
    Boolean(password) &&
    !isPasswordValid &&
    (password.length >= REGISTER_PASSWORD_MIN_LENGTH || Boolean(passwordConfirm))
  const isConfirmMismatch =
    Boolean(passwordConfirm) && password !== passwordConfirm && !isPasswordConditionError
  const canProceed = isPasswordValid && Boolean(passwordConfirm) && !isConfirmMismatch

  const handleFinish = (values: AdminRegisterStep5Data & { passwordConfirm: string }) => {
    if (!isValidRegisterPassword(values.password) || values.password !== values.passwordConfirm) {
      return
    }
    onNext({ password: values.password })
  }

  return (
    <div className="admin-register-step admin-register-step--password">
      <RegisterStepHeader
        title="비밀번호를 입력해 주세요"
        description={
          <>
            안전한 계정 이용을 위해
            <br />
            다른 곳에서 쓰지 않는 비밀번호를 추천해요.
          </>
        }
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form admin-register-step__form"
        onFinish={handleFinish}
      >
        <Form.Item
          name="password"
          label={<AuthFormLabel>비밀번호</AuthFormLabel>}
          validateStatus={isPasswordConditionError ? 'error' : undefined}
          rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}
          extra={
            isPasswordConditionError ? (
              <p className="register-password-field__message register-password-field__message--error">
                {REGISTER_PASSWORD_CONDITION_MESSAGE}
              </p>
            ) : (
              <p className="register-password-field__help">{REGISTER_PASSWORD_HELP_TEXT}</p>
            )
          }
        >
          <Input.Password
            className={getRegisterPasswordFieldClassName({ hasError: isPasswordConditionError })}
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="new-password"
            visibilityToggle={false}
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <Form.Item
          name="passwordConfirm"
          label={<AuthFormLabel>비밀번호 재입력</AuthFormLabel>}
          validateStatus={isConfirmMismatch || isPasswordConditionError ? 'error' : undefined}
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
            className={getRegisterPasswordFieldClassName({
              hasError: isPasswordConditionError || isConfirmMismatch,
            })}
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            visibilityToggle={false}
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <div className="auth-actions admin-register-step__actions">
          <Button
            type="primary"
            htmlType="submit"
            block
            className="auth-submit-btn"
            disabled={!canProceed}
          >
            가입 정보 확인하기
          </Button>
          <Button type="default" block className="auth-secondary-btn" onClick={onBack}>
            이전으로
          </Button>
        </div>
        <div className="admin-register-step__trailing" aria-hidden />
      </Form>
    </div>
  )
}
