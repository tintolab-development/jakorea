import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFTextInput } from '@/shared/ui'
import { SignUpActions } from '../layout/sign-up-actions'
import { SignUpLayout } from '../layout/sign-up-layout'
import { StepHeader } from '../layout/step-header'
import styles from '../sign-up-page.module.css'

type Step4EmailProps = {
  signUp: UseSignUpReturn
}

export function Step4Email({ signUp }: Step4EmailProps) {
  const { step, email } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title={
          <>
            로그인에 사용할
            <br />
            이메일을 입력해 주세요
          </>
        }
        description="로그인에 사용할 이메일 주소를 입력해 주세요. 자주 사용하는 이메일을 권장해요. 소셜 계정은 가입을 마친 뒤 연결할 수 있어요."
        titleClassName={styles['email-title']}
        descriptionClassName={styles['email-description']}
      />

      <div className={styles['email-content']}>
        <PFTextInput
          size="xlarge"
          label="이메일"
          placeholder="이메일을 입력해 주세요."
          type="email"
          required
          value={email.value}
          onValueChange={email.onChange}
          message={email.message}
          messageStatus={email.checkStatus === 'success' ? 'success' : 'error'}
          error={email.checkStatus === 'error'}
        />
        <PFButton
          size="xlarge"
          variant="secondary"
          width="100%"
          className={styles['duplicate-check-button']}
          onClick={email.duplicateCheck}
        >
          중복확인
        </PFButton>
      </div>

      <SignUpActions variant="terms">
        <PFButton
          size="xlarge"
          width="100%"
          disabled={email.checkStatus !== 'success'}
          onClick={email.continue}
        >
          다음
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
          이전
        </PFButton>
      </SignUpActions>
    </SignUpLayout>
  )
}
