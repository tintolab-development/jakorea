import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type GuardianFinalConsentStepProps = {
  signUp: UseSignUpReturn
}

/** NICE 완료 후 서버 동의 재확인 (CONSENTED) */
export function GuardianFinalConsentStep({ signUp }: GuardianFinalConsentStepProps) {
  const { step, guardian } = signUp
  const { finalConsent } = guardian

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="보호자님, 동의 내용을 다시 확인해 주세요."
        description={
          <>
            본인인증이 완료되었어요.
            <br />
            아래 내용에 동의하시면 아동 회원가입을 계속할 수 있어요.
          </>
        }
        actionsVariant="terms"
        actions={
          <>
            <PFButton
              size="xlarge"
              width="100%"
              disabled={finalConsent.isSubmitting}
              onClick={() => {
                void finalConsent.submit()
              }}
            >
              {finalConsent.isSubmitting ? '처리 중…' : '동의하고 가입 계속하기'}
            </PFButton>
            <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
              이전
            </PFButton>
          </>
        }
      >
        <div className={styles.stepContent}>
          <PFText as="p" typo="bd-md-rg" color="neutral-warm-600">
            법정대리인 동의 및 개인정보 처리에 관한 안내를 확인하셨다면, 동의 버튼을 눌러 주세요.
            동의는 본인인증을 완료한 보호자님의 최종 확인으로 기록됩니다.
          </PFText>
          {finalConsent.submitError ? (
            <PFText as="p" typo="bd-sm-md" color="error" className={styles.stepMessage}>
              {finalConsent.submitError}
            </PFText>
          ) : null}
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
