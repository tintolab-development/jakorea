import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type GuardianIdentityStepProps = {
  signUp: UseSignUpReturn
}

export function GuardianIdentityStep({ signUp }: GuardianIdentityStepProps) {
  const { step, guardian } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="보호자 본인인증을 진행해 주세요"
        description="안전하게 가입하기 위해 휴대폰 본인인증이 필요해요. 동의 확인과 법정대리인 확인을 위해 사용돼요."
        actions={
          <PFButton size="xlarge" width="100%" onClick={guardian.identity.verify}>
            보호자 본인인증하기
          </PFButton>
        }
      >
        <div className={styles.stepContent}>
          <div className={styles.identityModule}>
            <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
              통신사 본인인증 모듈 영역
              <br />
              수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시
            </PFText>
          </div>
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
