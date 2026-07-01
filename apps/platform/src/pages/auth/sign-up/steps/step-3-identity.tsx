import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { SignUpActions } from '../layout/sign-up-actions'
import { SignUpLayout } from '../layout/sign-up-layout'
import { StepHeader } from '../layout/step-header'
import styles from '../sign-up-page.module.css'

type Step3IdentityProps = {
  signUp: UseSignUpReturn
}

export function Step3Identity({ signUp }: Step3IdentityProps) {
  const { step, identity } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="본인인증을 진행해 주세요"
        description="안전하게 가입하기 위해 휴대폰 본인인증이 필요해요. 인증 결과는 생년월일과 함께 확인하며, 회원가입 절차에만 사용돼요."
        titleClassName={styles.title}
        descriptionClassName={styles.description}
      />

      <div className={styles['step-content']}>
        <div className={styles['identity-module']}>
          <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
            통신사 본인인증 모듈 영역
            <br />
            수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시
          </PFText>
        </div>
      </div>

      <SignUpActions variant="default">
        <PFButton size="xlarge" width="100%" onClick={identity.verify}>
          휴대폰 본인인증하기
        </PFButton>
      </SignUpActions>
    </SignUpLayout>
  )
}
