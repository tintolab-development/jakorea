import { Form, Input } from 'antd'

import type { IdentityVerificationHookStatus } from '@/features/auth/identity-verification'
import { AuthFormLabel } from '@/features/auth/ui/auth-form-label'
import { authInputAllowClear } from '@/features/auth/ui/auth-input-clear-icon'
import { AuthLoadingButton } from '@/features/auth/ui/auth-loading-button'
import { RegisterIdentityStatusPanel } from '@/features/auth/ui/admin-register/register-identity-status-panel'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

interface FindEmailFormProps {
  form: ReturnType<typeof Form.useForm<{ name: string }>>[0]
  status: IdentityVerificationHookStatus
  isVerifying: boolean
  isLookupLoading: boolean
  errorMessage?: string | null
  verifiedName?: string
  verifiedPhone?: string
  onSubmit: () => void
}

export function FindEmailForm({
  form,
  status,
  isVerifying,
  isLookupLoading,
  errorMessage,
  verifiedName,
  verifiedPhone,
  onSubmit,
}: FindEmailFormProps) {
  const isLoading = isVerifying || isLookupLoading

  return (
    <div className="find-email-step">
      <RegisterStepHeader
        title="가입한 이메일을 찾아드릴게요"
        description="본인 확인 후 가입한 이메일을 확인할 수 있어요"
      />

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="auth-form find-email-step__form"
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label={<AuthFormLabel>이름</AuthFormLabel>}
          rules={[{ required: true, message: '이름을 입력해 주세요.' }]}
        >
          <Input placeholder="이름을 입력해 주세요" allowClear={authInputAllowClear} />
        </Form.Item>

        <RegisterIdentityStatusPanel
          status={status}
          errorMessage={errorMessage}
          verifiedName={verifiedName}
          verifiedPhone={verifiedPhone}
          idleTitle="휴대폰 본인인증"
          idleDescription={
            <>
              버튼을 누르면 인증 창이 열립니다.
              <br />
              인증이 완료되면 가입 이메일을 확인할 수 있어요.
            </>
          }
        />

        <div className="auth-actions find-email-step__actions">
          <AuthLoadingButton
            type="primary"
            htmlType="submit"
            block
            className="auth-submit-btn"
            loading={isLoading}
          >
            본인인증 후 이메일 찾기
          </AuthLoadingButton>
        </div>
      </Form>
    </div>
  )
}
