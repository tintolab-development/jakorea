import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import checkOffLargeUrl from '@/shared/assets/icons/check-off-large.svg'
import checkOffSmallUrl from '@/shared/assets/icons/check-off-small.svg'
import checkOnLargeUrl from '@/shared/assets/icons/check-on-large.svg'
import checkOnSmallUrl from '@/shared/assets/icons/check-on-small.svg'
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
        titleClassName={styles['terms-title']}
        descriptionClassName={styles['terms-description']}
      />

      <div className={styles['terms-content']}>
        <button
          className={[
            styles['all-agreement-button'],
            agreement.isAllAgreed ? styles['all-agreement-button-checked'] : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
          type="button"
          aria-pressed={agreement.isAllAgreed}
          onClick={agreement.toggleAll}
        >
          <img
            className={styles['check-icon']}
            src={agreement.isAllAgreed ? checkOnLargeUrl : checkOffLargeUrl}
            alt=""
            aria-hidden="true"
          />
          <PFText typo="bd-lg-sb" color="inherit">
            전체 동의하기
          </PFText>
        </button>

        <div className={styles['agreement-list']}>
          {agreement.items.map(item => (
            <div className={styles['agreement-item']} key={item.key}>
              <button
                className={styles['agreement-check-button']}
                type="button"
                aria-pressed={agreement.state[item.key]}
                onClick={() => agreement.toggle(item.key)}
              >
                <img
                  className={styles['agreement-check-icon']}
                  src={agreement.state[item.key] ? checkOnSmallUrl : checkOffSmallUrl}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles['agreement-text']}>
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
              </button>
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
