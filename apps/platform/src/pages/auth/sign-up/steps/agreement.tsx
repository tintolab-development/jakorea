import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFToggle, PFText } from '@/shared/ui'
import { SignUpActions } from '../layout/actions'
import { SignUpLayout } from '../layout/shell'
import { StepHeader } from '../layout/step-header'
import styles from '../wizard.module.css'

type AgreementStepProps = {
  signUp: UseSignUpReturn
}

export function AgreementStep({ signUp }: AgreementStepProps) {
  const { step, agreement } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title={
          <>
            서비스 이용을 위한
            <br />
            약관에 동의해 주세요
          </>
        }
        description="필수 항목 동의는 가입을 위해 꼭 필요해요."
        titleClassName={styles.termsTitle}
        descriptionClassName={styles.termsDescription}
      />

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

      <SignUpActions variant="terms">
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!agreement.isRequiredAgreed}
          onClick={agreement.continue}
        >
          동의하고 계속하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
          이전
        </PFButton>
      </SignUpActions>
    </SignUpLayout>
  )
}
