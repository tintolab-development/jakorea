import { TermsViewModal, useTermsViewModal } from '@/features/auth'
import type { UseSignUpReturn } from '@/features/auth/sign-up'
import {
  agreementKeyToTermsView,
  termsViewToGuardianAgreementKey,
} from '@/features/auth/sign-up/lib/agreement/terms-view-map'
import { PFButton, PFText, PFToggle } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type GuardianAgreementStepProps = {
  signUp: UseSignUpReturn
}

export function GuardianAgreementStep({ signUp }: GuardianAgreementStepProps) {
  const { step, guardian } = signUp
  const agreement = guardian.agreement
  const terms = useTermsViewModal()
  const openAgreementKey = terms.openType ? termsViewToGuardianAgreementKey(terms.openType) : null

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title={'보호자님의 동의가 완료되면\n가입을 계속할 수 있어요.'}
        description="필수 항목인 서비스 이용과 개인정보 동의 내용을 확인해 주세요."
        actionsVariant="terms"
        actions={
          <>
            <PFButton
              size="xlarge"
              width="100%"
              disabled={!agreement.isRequiredAgreed || agreement.isSubmitting}
              onClick={agreement.continue}
            >
              {agreement.isSubmitting ? '확인 중…' : '동의하고 계속하기'}
            </PFButton>
            <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
              이전
            </PFButton>
          </>
        }
      >
        <div className={styles.termsContent}>
          <PFToggle
            variant="check-large"
            checked={agreement.isRequiredAgreed}
            onChange={() => agreement.toggleAll()}
            className={[
              styles.allAgreementButton,
              agreement.isRequiredAgreed ? styles.allAgreementButtonChecked : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <PFText typo="bd-lg-sb" color="inherit">
              필수 항목 전체 동의하기
            </PFText>
          </PFToggle>

          <div className={styles.agreementList}>
            {agreement.items.map(item => (
              <div className={styles.agreementItem} key={item.key}>
                <PFToggle
                  variant="check-small"
                  checked={agreement.state[item.key]}
                  onChange={() => agreement.toggle(item.key)}
                  className={styles.agreementCheckButton}
                >
                  <span className={styles.agreementText}>
                    <PFText
                      typo="bd-sm-md"
                      color="inherit"
                      className={item.required ? styles.required : styles.optional}
                    >
                      {item.required ? '필수' : '선택'}
                    </PFText>
                    <PFText typo="bd-md-md" color="black">
                      {item.label}
                    </PFText>
                  </span>
                </PFToggle>
                <button
                  className={styles.termsViewButton}
                  type="button"
                  onClick={() => {
                    if (item.key === 'portrait') {
                      agreement.openPortraitConsent()
                      return
                    }
                    terms.open(agreementKeyToTermsView(item.key))
                  }}
                >
                  <PFText typo="bd-sm-md" color="inherit">
                    보기
                  </PFText>
                </button>
                {item.guide ? (
                  <PFText as="p" typo="caption-rg" color="error" className={styles.agreementGuide}>
                    {item.guide}
                  </PFText>
                ) : null}
              </div>
            ))}
          </div>

          <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500" className={styles.optionalGuide}>
            선택 항목에 동의하지 않아도 회원가입은 가능해요.
          </PFText>
          {agreement.submitError ? (
            <PFText as="p" typo="bd-sm-md" color="error" className={styles.stepMessage}>
              {agreement.submitError}
            </PFText>
          ) : null}
        </div>
        {openAgreementKey && terms.openType ? (
          <TermsViewModal
            open={terms.isOpen}
            type={terms.openType}
            agreed={agreement.state[openAgreementKey]}
            onAgreedChange={agreed => agreement.set(openAgreementKey, agreed)}
            onClose={terms.close}
          />
        ) : null}
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
