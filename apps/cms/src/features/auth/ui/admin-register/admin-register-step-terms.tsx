import { Button } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { useTermsViewModal } from '@/features/auth/hooks/use-terms-view-modal'
import type { TermsViewType } from '@/features/auth/lib/terms-view-config'
import { TermsViewModal } from '@/features/auth/ui/terms-view-modal'
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
  const { openType, isOpen, open, close } = useTermsViewModal()

  useEffect(() => {
    setConsent({
      ...DEFAULT_CONSENT,
      ...initialValues,
    })
    setMfaSetupAgreed(initialValues?.mfaSetupAgreed ?? false)
  }, [initialValues])

  const isValid = consent.termsOfService && consent.privacyPolicy && mfaSetupAgreed

  const getAgreedForType = useCallback(
    (type: TermsViewType) => {
      if (type === 'mfaSetup') {
        return mfaSetupAgreed
      }
      return consent[type]
    },
    [consent, mfaSetupAgreed],
  )

  const handleAgreedChange = useCallback(
    (type: TermsViewType, agreed: boolean) => {
      if (type === 'mfaSetup') {
        setMfaSetupAgreed(agreed)
        return
      }
      setConsent(previous => ({ ...previous, [type]: agreed }))
    },
    [],
  )

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
          onViewTerm={open}
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

      {openType ? (
        <TermsViewModal
          open={isOpen}
          type={openType}
          agreed={getAgreedForType(openType)}
          onAgreedChange={agreed => handleAgreedChange(openType, agreed)}
          onClose={close}
        />
      ) : null}
    </div>
  )
}
