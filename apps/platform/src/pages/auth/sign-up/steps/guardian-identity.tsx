import { useCallback, useRef } from 'react'
import {
  IDENTITY_MODULE_IDLE_DESCRIPTION,
  IDENTITY_MODULE_IDLE_TITLE,
} from '@jakorea/domain/shared/identity-module-copy'
import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { useGuardianBridgeVerification } from '@/features/auth/identity-verification'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type GuardianIdentityStepProps = {
  signUp: UseSignUpReturn
}

export function GuardianIdentityStep({ signUp }: GuardianIdentityStepProps) {
  const { step, guardian } = signUp
  const completeRef = useRef(guardian.identity.complete)
  completeRef.current = guardian.identity.complete

  const handleSuccess = useCallback((result: { identitySessionId: number }) => {
    void completeRef.current(result)
  }, [])

  const { verify, isVerifying, errorMessage } = useGuardianBridgeVerification({
    onSuccess: handleSuccess,
  })

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="보호자 본인인증을 진행해 주세요."
        description={
          <>
            안전하게 가입하기 위해 휴대폰 본인인증이 필요해요.
            <br />
            인증 결과는 동의 확인과 법정대리인 확인을 위해 사용돼요.
          </>
        }
        actions={
          <PFButton
            size="xlarge"
            width="100%"
            disabled={isVerifying}
            onClick={() => {
              void verify()
            }}
          >
            {isVerifying ? '본인인증 진행 중…' : '보호자 본인인증하기'}
          </PFButton>
        }
      >
        <div className={styles.stepContent}>
          <div className={styles.identityModule}>
            <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
              {IDENTITY_MODULE_IDLE_TITLE}
              <br />
              {IDENTITY_MODULE_IDLE_DESCRIPTION}
            </PFText>
            {(errorMessage || guardian.identity.errorMessage) ? (
              <PFText as="p" typo="bd-sm-md" color="error" className={styles.stepMessage}>
                {errorMessage ?? guardian.identity.errorMessage}
              </PFText>
            ) : null}
          </div>
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
