import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type ConfirmationStepProps = {
  signUp: UseSignUpReturn
}

export function ConfirmationStep({ signUp }: ConfirmationStepProps) {
  const { step, confirmation } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="입력한 정보를 확인해 주세요"
        description="내용이 맞다면 가입을 완료할게요."
        actionsVariant="terms"
        actions={
          <>
            <PFButton size="xlarge" width="100%" onClick={confirmation.complete}>
              가입 완료하기
            </PFButton>
            <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
              이전
            </PFButton>
          </>
        }
      >
        <div className={styles.confirmReview}>
          {confirmation.rows.map((row, index) => (
            <div
              className={[
                styles.confirmReviewRow,
                index === 0 ? styles.confirmReviewRowFirst : undefined,
              ]
                .filter(Boolean)
                .join(' ')}
              key={row.label}
            >
              <PFText
                typo="bd-md-md"
                color="neutral-cool-500"
                className={styles.confirmReviewLabel}
              >
                {row.label}
              </PFText>
              <PFText typo="bd-md-sb" color="black" className={styles.confirmReviewValue}>
                {row.value}
              </PFText>
            </div>
          ))}
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
