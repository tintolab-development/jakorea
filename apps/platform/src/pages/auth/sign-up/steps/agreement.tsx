import { useState } from 'react'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
} from '@jakorea/domain/shared/required-consent-alert'
import type { ConsentChoice, UseSignUpReturn } from '@/features/auth/sign-up'
import { PFAlertModal, PFButton, PFText, PFToggle } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type AgreementStepProps = {
  signUp: UseSignUpReturn
}

const CONSENT_CHOICES: { value: Exclude<ConsentChoice, null>; label: string }[] = [
  { value: 'agree', label: '동의' },
  { value: 'disagree', label: '미동의' },
]

export function AgreementStep({ signUp }: AgreementStepProps) {
  const { step, agreement } = signUp
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const handleContinue = () => {
    if (!agreement.isRequiredAgreed) {
      setAlertMessage(
        buildRequiredConsentDisagreeAlertMessage(agreement.disagreedRequiredLabels),
      )
      setAlertOpen(true)
      return
    }
    agreement.continue()
  }

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title={
          <>
            서비스 이용을 위한
            <br />
            약관에 동의해 주세요
          </>
        }
        description="필수 항목 동의는 가입을 위해 꼭 필요해요."
        actionsVariant="terms"
        actions={
          <>
            <PFButton size="xlarge" width="100%" onClick={handleContinue}>
              동의하고 계속하기
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
            checked={agreement.isAllAgreed}
            onChange={() => agreement.toggleAll()}
            className={[
              styles.allAgreementButton,
              agreement.isAllAgreed ? styles.allAgreementButtonChecked : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <PFText typo="bd-lg-sb" color="inherit">
              전체 동의하기
            </PFText>
          </PFToggle>

          <div className={styles.agreementList}>
            {agreement.items.map(item => (
              <div className={styles.agreementItem} key={item.key}>
                <div className={styles.agreementChoiceBlock}>
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
                  <div
                    className={styles.agreementChoiceGroup}
                    role="radiogroup"
                    aria-label={item.label}
                  >
                    {CONSENT_CHOICES.map(choice => (
                      <label key={choice.value} className={styles.agreementChoiceOption}>
                        <input
                          type="radio"
                          name={`agreement-${item.key}`}
                          value={choice.value}
                          checked={agreement.state[item.key] === choice.value}
                          onChange={() => agreement.setChoice(item.key, choice.value)}
                        />
                        <PFText as="span" typo="bd-md-rg" color="black">
                          {choice.label}
                        </PFText>
                      </label>
                    ))}
                  </div>
                </div>
                <button className={styles.termsViewButton} type="button">
                  <PFText typo="bd-sm-md" color="inherit">
                    보기
                  </PFText>
                </button>
                {item.guide ? (
                  <PFText
                    as="p"
                    typo="caption-rg"
                    color="error"
                    className={styles.agreementGuide}
                  >
                    {item.guide}
                  </PFText>
                ) : null}
              </div>
            ))}
          </div>

          <PFText
            as="p"
            typo="bd-sm-rg"
            color="neutral-warm-500"
            className={styles.optionalGuide}
          >
            선택 항목에 동의하지 않아도 회원가입은 가능해요.
          </PFText>
        </div>
      </SignUpStepLayout>

      <PFAlertModal
        open={alertOpen}
        title={REQUIRED_CONSENT_DISAGREE_ALERT_TITLE}
        description={alertMessage}
        onConfirm={() => setAlertOpen(false)}
      />
    </SignUpLayout>
  )
}
