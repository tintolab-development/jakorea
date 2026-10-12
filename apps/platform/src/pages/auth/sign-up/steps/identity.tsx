import {
  IDENTITY_MODULE_IDLE_DESCRIPTION,
  IDENTITY_MODULE_IDLE_TITLE,
} from '@jakorea/domain/shared/identity-module-copy'
import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type IdentityStepProps = {
  signUp: UseSignUpReturn
}

export function IdentityStep({ signUp }: IdentityStepProps) {
  const { step, identity } = signUp

  const handleVerify = () => {
    if (identity.tryAdminRegisteredRedirect()) {
      return
    }
    void identity.verify()
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
            disabled={identity.isVerifying}
            onClick={handleVerify}
          >
            {identity.isVerifying ? '본인인증 진행 중…' : '휴대폰 본인인증하기'}
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
            {identity.errorMessage ? (
              <PFText as="p" typo="bd-sm-md" color="error" className={styles.stepMessage}>
                {identity.errorMessage}
              </PFText>
            ) : null}
          </div>
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
