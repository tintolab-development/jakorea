import { Form } from 'antd'

import { CmsButton, CmsInput } from '@/shared/ui'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

import { VerificationExpiredNotice } from './verification-expired-notice'

export const FIND_PASSWORD_EMAIL_NOT_FOUND_MESSAGE =
  '가입된 이메일을 찾지 못했어요. 입력한 정보를 다시 확인해 주세요.'

export const FIND_PASSWORD_INVALID_EMAIL_DOMAIN_MESSAGE =
  'JA Korea 이메일(@jakorea.org)만 사용할 수 있어요.'

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
        title="비밀번호를 찾아드릴게요"
        description="가입한 이메일과 본인인증이 필요합니다."
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
          rules={[
            { required: true, message: '이메일을 입력해 주세요.' },
            { type: 'email', message: '올바른 이메일 형식을 입력해 주세요.' },
          ]}
        >
          <CmsInput
            label="이메일"
            required
            type="email"
            inputSize="xlarge"
            width="100%"
            placeholder="이메일을 입력해 주세요"
            autoComplete="email"
            error={hasEmailError}
            message={emailError ?? undefined}
          />
        </Form.Item>

        <div className="auth-actions find-password-step__actions">
          <CmsButton
            variant="primary"
            size="h52"
            loading={isIdentityLoading}
            onClick={onIdentityVerify} >
            본인인증 후 비밀번호 찾기
          </CmsButton>
        </div>

        {showVerificationExpired ? <VerificationExpiredNotice /> : null}
      </Form>
    </div>
  )
}
