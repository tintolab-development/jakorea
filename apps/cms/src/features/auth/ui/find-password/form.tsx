import { Form, Input } from 'antd'

import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import { authInputAllowClear } from '@/features/auth/ui/auth-input-clear-icon'
import { AuthLoadingButton } from '@/features/auth/ui/auth-loading-button'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

import { VerificationExpiredNotice } from './verification-expired-notice'

export const FIND_PASSWORD_EMAIL_NOT_FOUND_MESSAGE =
  '가입한 이메일을 찾지 못했어요. 입력한 정보를 다시 확인해 주세요.'

interface FindPasswordFormProps {
  form: ReturnType<typeof Form.useForm<{ email: string }>>[0]
  emailError?: string | null
  isIdentityLoading: boolean
  isEmailSending: boolean
  showVerificationExpired: boolean
  onIdentityVerify: () => void
  onSendVerificationEmail: () => void
}

export function FindPasswordForm({
  form,
  emailError,
  isIdentityLoading,
  isEmailSending,
  showVerificationExpired,
  onIdentityVerify,
  onSendVerificationEmail,
}: FindPasswordFormProps) {
  return (
    <div className="find-password-step">
      <RegisterStepHeader
        title="비밀번호를 다시 설정할게요"
        description="가입한 이메일과 본인 인증이 필요해요."
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form find-password-step__form"
      >
        <Form.Item
          name="email"
          label={<AuthFormLabel>이메일</AuthFormLabel>}
          validateStatus={emailError ? 'error' : undefined}
          help={emailError ? <span className="find-password-email-error">{emailError}</span> : undefined}
          rules={[
            { required: true, message: '이메일을 입력해 주세요.' },
            { type: 'email', message: '올바른 이메일 형식을 입력해 주세요.' },
          ]}
        >
          <Input
            type="email"
            placeholder="이메일을 입력해 주세요"
            autoComplete="email"
            allowClear={authInputAllowClear}
          />
        </Form.Item>

        <div className="auth-actions find-password-step__actions">
          <AuthLoadingButton
            type="primary"
            block
            className="auth-submit-btn"
            loading={isIdentityLoading}
            onClick={onIdentityVerify}
          >
            본인인증 하기
          </AuthLoadingButton>
          <AuthLoadingButton
            type="default"
            block
            className="auth-secondary-btn"
            loading={isEmailSending}
            onClick={onSendVerificationEmail}
          >
            인증메일 받기
          </AuthLoadingButton>
        </div>

        {showVerificationExpired ? <VerificationExpiredNotice /> : null}
      </Form>
    </div>
  )
}
