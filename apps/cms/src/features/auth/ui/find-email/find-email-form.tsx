import type { IdentityVerificationHookStatus } from '@/features/auth/identity-verification'
import { LoadingButton } from '@/shared/ui/loading-button'
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
        title="가입한 이메일을 찾아드릴게요"
        description="본인 확인 후 가입한 이메일을 확인할 수 있어요"
      />

      <div className="auth-form find-email-step__form">
        <RegisterIdentityStatusPanel
          status={status}
          errorMessage={errorMessage}
          idleTitle="통신사 본인인증 모듈 영역"
          idleDescription="수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시"
        />

        <div className="auth-actions find-email-step__actions">
          <LoadingButton
            type="primary"
            block
            className="auth-submit-btn"
            loading={isLoading}
            onClick={onSubmit}
          >
            본인인증 후 이메일 찾기
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}
