import { useCallback, useEffect, useState } from 'react'
import { CmsButton } from '@/shared/ui'

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

/** 약관별 동의 상태 — true 동의 · false 동의하지 않음 · null 미선택 */
type TermsConsentChoices = Record<TermsViewType, boolean | null>

/** 처음 진입 시 아무것도 선택하지 않는다. 이전 단계에서 돌아오면 동의한 항목만 복원한다. */
function choicesFromInitialValues(
  initialValues?: Partial<AdminRegisterStep3Data>
): TermsConsentChoices {
  return {
    termsOfService: initialValues?.termsOfService ? true : null,
    privacyPolicy: initialValues?.privacyPolicy ? true : null,
    marketingConsent: initialValues?.marketingConsent ? true : null,
    mfaSetup: initialValues?.mfaSetupAgreed ? true : null,
  }
}

/** 체크박스 해제는 「동의」만 거둔다(미선택). 「동의하지 않음」은 팝업 라디오로만 고른다. */
function applyCheckedToChoice(previous: boolean | null, checked: boolean): boolean | null {
  if (checked) return true
  return previous === true ? null : previous
}

export function AdminRegisterStepTerms({
  initialValues,
  onNext,
  onBack,
}: AdminRegisterStepTermsProps) {
  const [choices, setChoices] = useState<TermsConsentChoices>(() =>
    choicesFromInitialValues(initialValues)
  )
  const { openType, isOpen, open, close } = useTermsViewModal()

  useEffect(() => {
    setChoices(choicesFromInitialValues(initialValues))
  }, [initialValues])

  // 미선택은 다음 단계 판정에서 「동의하지 않음」과 같다.
  const consent: ConsentFormData = {
    termsOfService: choices.termsOfService === true,
    privacyPolicy: choices.privacyPolicy === true,
    marketingConsent: choices.marketingConsent === true,
  }
  const mfaSetupAgreed = choices.mfaSetup === true

  const isValid = consent.termsOfService && consent.privacyPolicy && mfaSetupAgreed

  const handleConsentCheckChange = useCallback((next: ConsentFormData) => {
    setChoices(previous => ({
      ...previous,
      termsOfService: applyCheckedToChoice(previous.termsOfService, next.termsOfService),
      privacyPolicy: applyCheckedToChoice(previous.privacyPolicy, next.privacyPolicy),
      marketingConsent: applyCheckedToChoice(previous.marketingConsent, next.marketingConsent),
    }))
  }, [])

  const handleMfaSetupCheckChange = useCallback((checked: boolean) => {
    setChoices(previous => ({
      ...previous,
      mfaSetup: applyCheckedToChoice(previous.mfaSetup, checked),
    }))
  }, [])

  const handleAgreedChange = useCallback((type: TermsViewType, agreed: boolean) => {
    setChoices(previous => ({ ...previous, [type]: agreed }))
  }, [])

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
    <div>
      <RegisterStepHeader
        title={
          <>
            서비스 이용을 위한
            <br />
            약관에 동의해 주세요.
          </>
        }
        description="필수 항목 동의는 가입을 위해 꼭 필요해요."
      />

      <div style={{ marginTop: '40px' }}>
        <RegisterTermsAgreement
          value={consent}
          onChange={handleConsentCheckChange}
          mfaSetupAgreed={mfaSetupAgreed}
          onMfaSetupAgreedChange={handleMfaSetupCheckChange}
          onViewTerm={open}
        />
        <div className="auth-actions">
          <CmsButton
            variant="primary"
            size="h52"
            disabled={!isValid}
            onClick={handleContinue} >
            동의하고 계속하기
          </CmsButton>
          <CmsButton variant="default" size="h52" onClick={onBack}>
            이전으로
          </CmsButton>
        </div>
      </div>

      {openType ? (
        <TermsViewModal
          open={isOpen}
          type={openType}
          agreed={choices[openType]}
          onAgreedChange={agreed => handleAgreedChange(openType, agreed)}
          onClose={close}
        />
      ) : null}
    </div>
  )
}
