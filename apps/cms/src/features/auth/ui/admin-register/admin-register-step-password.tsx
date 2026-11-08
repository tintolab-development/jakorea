import { Form } from 'antd'
import { useEffect } from 'react'
import { CmsButton, CmsInput } from '@/shared/ui'

import {
  isValidRegisterPassword,
  REGISTER_PASSWORD_CONDITION_MESSAGE,
  REGISTER_PASSWORD_CONFIRM_CONDITION_MESSAGE,
  REGISTER_PASSWORD_HELP_TEXT,
  REGISTER_PASSWORD_MIN_LENGTH,
  REGISTER_PASSWORD_MISMATCH_MESSAGE,
} from '@/features/auth/lib/validate-register-password'
import type { AdminRegisterStep5Data, AdminRegisterWizardData } from '@/types/admin-register'

import { RegisterStepHeader } from './register-step-header'

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
    <div>
      <RegisterStepHeader
        title="비밀번호를 입력해 주세요."
        description={
          <>
            안전한 계정 이용을 위해
            <br />
            다른 곳에서 쓰지 않는 비밀번호를 추천합니다.
          </>
        }
      />

      <Form
        style={{ marginTop: '40px', gap: '20px !important' }}
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form"
        onFinish={handleFinish}
      >
        <Form.Item
          name="password"
          rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}
        >
          <CmsInput
            label="비밀번호"
            required
            type="password"
            inputSize="xlarge"
            width="100%"
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="new-password"
            error={isPasswordConditionError}
            message={
              isPasswordConditionError
                ? REGISTER_PASSWORD_CONDITION_MESSAGE
                : REGISTER_PASSWORD_HELP_TEXT
            }
          />
        </Form.Item>

        <Form.Item
          name="passwordConfirm"
          rules={[{ required: true, message: '비밀번호를 한 번 더 입력해 주세요.' }]}
        >
          <CmsInput
            label="비밀번호 재입력"
            required
            type="password"
            inputSize="xlarge"
            width="100%"
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            autoComplete="new-password"
            error={isConfirmMismatch || isPasswordConditionError}
            message={
              isConfirmMismatch
                ? REGISTER_PASSWORD_MISMATCH_MESSAGE
                : isPasswordConditionError && passwordConfirm
                  ? REGISTER_PASSWORD_CONFIRM_CONDITION_MESSAGE
                  : undefined
            }
          />
        </Form.Item>

        <div className="auth-actions" style={{ marginTop: '40px' }}>
          <CmsButton variant="primary" size="h52" type="submit" disabled={!canProceed}>
            가입 정보 확인하기
          </CmsButton>
          <CmsButton variant="default" size="h52" onClick={onBack}>
            이전으로
          </CmsButton>
        </div>
      </Form>
    </div>
  )
}
