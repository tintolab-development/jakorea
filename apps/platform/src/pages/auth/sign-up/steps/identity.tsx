import { useCallback, useRef } from 'react'
import type { UseSignUpReturn } from '@/features/auth/sign-up'
import {
  useSignupIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type IdentityStepProps = {
  signUp: UseSignUpReturn
}

export function IdentityStep({ signUp }: IdentityStepProps) {
  const { step, birth, identity } = signUp
  const completeRef = useRef(identity.complete)
  completeRef.current = identity.complete

  const handleSuccess = useCallback((result: IdentityChallengeCompleteResult) => {
    completeRef.current({
      sessionId: result.sessionId,
      verifiedName: result.verifiedName,
      verifiedPhone: result.verifiedPhone,
    })
  }, [])

  const { verify, isVerifying, errorMessage } = useSignupIdentityVerification({
    birthDate: birth.birthDate,
    gender: birth.gender,
    onSuccess: handleSuccess,
  })

  const handleVerify = () => {
    if (identity.tryAdminRegisteredRedirect()) {
      return
    }
    void verify()
  }

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="본인인증을 진행해 주세요"
        description="안전하게 가입하기 위해 휴대폰 본인인증이 필요해요. 인증 결과는 생년월일과 함께 확인하며, 회원가입 절차에만 사용돼요."
        actions={
          <PFButton
            size="xlarge"
            width="100%"
            disabled={isVerifying}
            onClick={handleVerify}
          >
            {isVerifying ? '본인인증 진행 중…' : '휴대폰 본인인증하기'}
          </PFButton>
        }
      >
        <div className={styles.stepContent}>
          <div className={styles.identityModule}>
            <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
              휴대폰 본인인증 창이 열리면 안내에 따라 인증을 완료해 주세요.
              <br />
              인증이 끝나면 이 화면으로 돌아와 다음 단계로 진행돼요.
            </PFText>
            {errorMessage ? (
              <PFText as="p" typo="bd-sm-md" color="error" className={styles.stepMessage}>
                {errorMessage}
              </PFText>
            ) : null}
          </div>
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
