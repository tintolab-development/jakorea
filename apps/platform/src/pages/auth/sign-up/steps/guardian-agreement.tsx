import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFToggle, PFText } from '@/shared/ui'
import { SignUpActions } from '../layout/actions'
import { SignUpLayout } from '../layout/shell'
import { StepHeader } from '../layout/step-header'
import styles from '../wizard.module.css'

type GuardianAgreementStepProps = {
  signUp: UseSignUpReturn
}

export function GuardianAgreementStep({ signUp }: GuardianAgreementStepProps) {
  const { step, guardian } = signUp
  const { agreement } = guardian

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="보호자님의 동의가 완료되면 가입을 계속할 수 있어요"
        description="필수 항목인 서비스 이용과 개인정보 동의 내용을 확인해 주세요."
        titleClassName={styles['terms-title']}
        descriptionClassName={styles['terms-description']}
      />

      <div className={styles['terms-content']}>
        <PFToggle
          variant="check-large"
          checked={agreement.isAllAgreed}
          onChange={() => agreement.toggleAll()}
          className={[
            styles['all-agreement-button'],
            agreement.isAllAgreed ? styles['all-agreement-button-checked'] : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <PFText typo="bd-lg-sb" color="inherit">
            전체 동의하기
          </PFText>
        </PFToggle>

        <div className={styles['agreement-list']}>
          {agreement.items.map(item => (
            <div className={styles['agreement-item']} key={item.key}>
              <PFToggle
                variant="check-small"
                checked={agreement.state[item.key]}
                onChange={() => agreement.toggle(item.key)}
                className={styles['agreement-check-button']}
              >
                <div className={styles['agreement-text']}>
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
                </div>
              </PFToggle>
              <button className={styles['terms-view-button']} type="button">
                <PFText typo="bd-sm-md" color="inherit">
                  보기
                </PFText>
              </button>
              {item.guide ? (
                <PFText
                  as="p"
                  typo="caption-rg"
                  color="error"
                  className={styles['agreement-guide']}
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
          className={styles['optional-guide']}
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
