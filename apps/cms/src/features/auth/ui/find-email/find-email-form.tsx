import type { IdentityVerificationHookStatus } from '@/features/auth/identity-verification'
import { CmsButton } from '@/shared/ui/cms-button'
import { RegisterIdentityStatusPanel } from '@/features/auth/ui/admin-register/register-identity-status-panel'
import { RegisterStepHeader } from '@/features/auth/ui/admin-register/register-step-header'

interface FindEmailFormProps {
  status: IdentityVerificationHookStatus
  isVerifying: boolean
  isLookupLoading: boolean
  errorMessage?: string | null
  onSubmit: () => void
}

export function FindEmailForm({
  status,
  isVerifying,
  isLookupLoading,
  errorMessage,
  onSubmit,
}: FindEmailFormProps) {
  const isLoading = isVerifying || isLookupLoading

  return (
    <div className="find-email-step">
      <RegisterStepHeader
        title="가입한 이메일 찾기"
        description="본인인증 후 가입한 이메일을 확인할 수 있습니다."
      />

      <div className="auth-form find-email-step__form">
        <RegisterIdentityStatusPanel status={status} errorMessage={errorMessage} />

        <div className="auth-actions find-email-step__actions">
          <CmsButton
            variant="primary"
            size="h52"
            loading={isLoading}
            onClick={onSubmit} >
            본인인증 후 이메일 찾기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
