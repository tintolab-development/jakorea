import { Button } from 'antd'
import { useEffect, useState } from 'react'

import type { ConsentFormData } from '@/types/consent'
import type { AdminRegisterStep3Data } from '@/types/admin-register'

import { RegisterStepHeader } from './register-step-header'
import { RegisterTermsAgreement } from './register-terms-agreement'

interface AdminRegisterStepTermsProps {
  initialValues?: Partial<AdminRegisterStep3Data>
  onNext: (values: AdminRegisterStep3Data) => void
  onBack: () => void
}

const DEFAULT_CONSENT: ConsentFormData = {
  termsOfService: false,
  privacyPolicy: false,
  marketingConsent: false,
}

export function AdminRegisterStepTerms({
  initialValues,
  onNext,
  onBack,
}: AdminRegisterStepTermsProps) {
  const [consent, setConsent] = useState<ConsentFormData>({
    ...DEFAULT_CONSENT,
    ...initialValues,
  })
  const [mfaSetupAgreed, setMfaSetupAgreed] = useState(initialValues?.mfaSetupAgreed ?? false)

  useEffect(() => {
    setConsent({
      ...DEFAULT_CONSENT,
      ...initialValues,
    })
    setMfaSetupAgreed(initialValues?.mfaSetupAgreed ?? false)
  }, [initialValues])

  const isValid = consent.termsOfService && consent.privacyPolicy && mfaSetupAgreed

  const handleContinue = () => {
    if (!isValid) {
      return
    }
    onNext({
      ...consent,
      mfaSetupAgreed,
    })
  }

  return (
    <div className="admin-register-step admin-register-step--terms">
      <RegisterStepHeader
        title={
          <>
            서비스 이용을 위한
            <br />
            약관에 동의해 주세요
          </>
        }
        description="필수 항목 동의는 가입을 위해 꼭 필요해요."
      />

      <div className="admin-register-step__content">
        <RegisterTermsAgreement
          value={consent}
          onChange={setConsent}
          mfaSetupAgreed={mfaSetupAgreed}
          onMfaSetupAgreedChange={setMfaSetupAgreed}
        />
        <div className="auth-actions admin-register-step__actions">
          <Button
            type="primary"
            block
            className="auth-submit-btn"
            disabled={!isValid}
            onClick={handleContinue}
          >
            동의하고 계속하기
          </Button>
          <Button type="default" block className="auth-secondary-btn" onClick={onBack}>
            이전으로
          </Button>
        </div>
        <div className="admin-register-step__trailing" aria-hidden />
      </div>
    </div>
  )
}
