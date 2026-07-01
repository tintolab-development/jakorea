import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpActions } from '../layout/sign-up-actions'
import { SignUpLayout } from '../layout/sign-up-layout'
import { StepHeader } from '../layout/step-header'
import styles from '../sign-up-page.module.css'

type Step7ConfirmationProps = {
  signUp: UseSignUpReturn
}

export function Step7Confirmation({ signUp }: Step7ConfirmationProps) {
  const { step, confirmation } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="입력한 정보를 확인해 주세요"
        description="내용이 맞다면 가입을 완료할게요."
        titleClassName={styles['confirm-title']}
        descriptionClassName={styles['confirm-description']}
      />

      <div className={styles['confirm-review']}>
        {confirmation.rows.map((row, index) => (
          <div
            className={[
              styles['confirm-review-row'],
              index === 0 ? styles['confirm-review-row-first'] : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
            key={row.label}
          >
            <PFText
              typo="bd-md-md"
              color="neutral-cool-500"
              className={styles['confirm-review-label']}
            >
              {row.label}
            </PFText>
            <PFText typo="bd-md-sb" color="black" className={styles['confirm-review-value']}>
              {row.value}
            </PFText>
          </div>
        ))}
      </div>

      <SignUpActions variant="terms">
        <PFButton size="xlarge" width="100%" onClick={confirmation.complete}>
          가입 완료하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
          이전
        </PFButton>
      </SignUpActions>
    </SignUpLayout>
  )
}
