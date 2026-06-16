import { Button } from 'antd'

import { RegisterIdentityModulePlaceholder } from './register-identity-module-placeholder'
import { RegisterStepHeader } from './register-step-header'

interface AdminRegisterStepIdentityProps {
  onVerify: () => void
  verifying?: boolean
}

export function AdminRegisterStepIdentity({
  onVerify,
  verifying = false,
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
        <RegisterIdentityModulePlaceholder />
        <div className="admin-register-step__actions admin-register-step__actions--single">
          <Button
            type="primary"
            block
            className="auth-submit-btn"
            loading={verifying}
            onClick={onVerify}
          >
            휴대폰 본인인증하기
          </Button>
        </div>
        <div className="admin-register-step__trailing" aria-hidden />
      </div>
    </div>
  )
}
