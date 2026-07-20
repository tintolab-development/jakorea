import { LoadingButton } from '@/shared/ui/loading-button'

import type { IdentityVerificationHookStatus } from '@/features/auth/identity-verification'

import { RegisterIdentityStatusPanel } from './register-identity-status-panel'
import { RegisterStepHeader } from './register-step-header'

interface AdminRegisterStepIdentityProps {
  onStartVerify: () => void
  status: IdentityVerificationHookStatus
  isVerifying?: boolean
  errorMessage?: string | null
  verifiedName?: string
  verifiedPhone?: string
}

export function AdminRegisterStepIdentity({
  onStartVerify,
  status,
  isVerifying = false,
  errorMessage,
  verifiedName,
  verifiedPhone,
}: AdminRegisterStepIdentityProps) {
  return (
    <div className="admin-register-step admin-register-step--identity">
      <RegisterStepHeader
        title="본인인증을 진행해 주세요"
        description={
          <>
            안전하게 가입하기 위해 휴대폰 본인인증이 필요해요.
            <br />
            인증 결과는 생년월일과 함께 확인하며, 회원가입 절차에만 사용돼요.
          </>
        }
      />

      <div className="admin-register-step__content">
        <RegisterIdentityStatusPanel
          status={status}
          errorMessage={errorMessage}
          verifiedName={verifiedName}
          verifiedPhone={verifiedPhone}
        />
        <div className="admin-register-step__actions admin-register-step__actions--single">
          <LoadingButton
            type="primary"
            block
            className="auth-submit-btn"
            loading={isVerifying}
            onClick={onStartVerify}
          >
            휴대폰 본인인증하기
          </LoadingButton>
        </div>
        <div className="admin-register-step__trailing" aria-hidden />
      </div>
    </div>
  )
}
