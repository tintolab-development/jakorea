import { Form, Input } from 'antd'

import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import { authInputAllowClear } from '@/features/auth/ui/auth-input-clear-icon'
import { AuthLoadingButton } from '@/features/auth/ui/auth-loading-button'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

import { VerificationExpiredNotice } from './verification-expired-notice'

export const FIND_PASSWORD_EMAIL_NOT_FOUND_MESSAGE =
  '가입된 이메일을 찾지 못했어요. 입력한 정보를 다시 확인해 주세요.'

export const FIND_PASSWORD_INVALID_EMAIL_DOMAIN_MESSAGE =
  'JA Korea 이메일(@jakorea.org)만 사용할 수 있어요.'

function getFindPasswordEmailFieldClassName({ hasError = false }: { hasError?: boolean } = {}) {
  return [
    'find-password-email-field',
    'find-password-email-field--clearable',
    hasError ? 'find-password-email-field--error' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

interface FindPasswordFormProps {
  form: ReturnType<typeof Form.useForm<{ email: string }>>[0]
  emailError?: string | null
  isIdentityLoading: boolean
  showVerificationExpired: boolean
  onEmailChange?: () => void
  onIdentityVerify: () => void
}

export function FindPasswordForm({
  form,
  emailError,
  isIdentityLoading,
  showVerificationExpired,
  onEmailChange,
  onIdentityVerify,
}: FindPasswordFormProps) {
  const hasEmailError = Boolean(emailError)

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
        onValuesChange={changedValues => {
          if ('email' in changedValues) {
            onEmailChange?.()
          }
        }}
      >
        <Form.Item
          name="email"
          label={<AuthFormLabel>이메일</AuthFormLabel>}
          validateStatus={hasEmailError ? 'error' : undefined}
          help={
            emailError ? (
              <span className="find-password-email-error" role="alert">
                {emailError}
              </span>
            ) : undefined
          }
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
            className={getFindPasswordEmailFieldClassName({ hasError: hasEmailError })}
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
        </div>

        {showVerificationExpired ? <VerificationExpiredNotice /> : null}
      </Form>
    </div>
  )
}
