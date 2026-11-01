import type { ReactNode } from 'react'
import { CmsButton } from '@/shared/ui'

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
  idleTitle?: string
  idleDescription?: ReactNode | null
}

export function AdminRegisterStepIdentity({
  onStartVerify,
  status,
  isVerifying = false,
  errorMessage,
  verifiedName,
  verifiedPhone,
  idleTitle,
  idleDescription,
}: AdminRegisterStepIdentityProps) {
  return (
    <div style={{ width: '100%' }}>
      <RegisterStepHeader
        title="본인인증을 진행해 주세요"
        description={
          <>
            안전하게 가입하기 위해 휴대폰 본인인증이 필요합니다.
            <br />
            인증 결과는 회원가입 절차에만 사용됩니다.
          </>
        }
      />

      <div style={{ marginTop: '30px' }}>
        <RegisterIdentityStatusPanel
          status={status}
          errorMessage={errorMessage}
          verifiedName={verifiedName}
          verifiedPhone={verifiedPhone}
          idleTitle={idleTitle}
          idleDescription={idleDescription}
        />
        <div style={{ marginTop: '40px' }}>
          <CmsButton
            variant="primary"
            size="h52"
            loading={isVerifying}
            onClick={onStartVerify} >
            휴대폰 본인인증하기
          </CmsButton>
        </div>
      </div>
    </div>
  )
}
