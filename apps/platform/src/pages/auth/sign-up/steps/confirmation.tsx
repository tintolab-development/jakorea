import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFInfoReview, PFText } from '@/shared/ui'
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
            <PFButton
              size="xlarge"
              width="100%"
              disabled={confirmation.isSubmitting}
              onClick={confirmation.complete}
            >
              {confirmation.isSubmitting ? '가입 처리 중…' : '가입 완료하기'}
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              width="100%"
              disabled={confirmation.isSubmitting}
              onClick={step.goPrevious}
            >
              이전
            </PFButton>
          </>
        }
      >
        <PFInfoReview rows={confirmation.rows} className={styles.confirmReview} />
        {confirmation.message ? (
          <PFText as="p" typo="bd-sm-md" color="error" className={styles.confirmSubmitMessage}>
            {confirmation.message}
          </PFText>
        ) : null}
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
