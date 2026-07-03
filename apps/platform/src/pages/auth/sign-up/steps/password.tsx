import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFTextInput } from '@/shared/ui'
import { SignUpActions } from '../layout/actions'
import { SignUpLayout } from '../layout/shell'
import { StepHeader } from '../layout/step-header'
import styles from '../wizard.module.css'

type PasswordStepProps = {
  signUp: UseSignUpReturn
}

export function PasswordStep({ signUp }: PasswordStepProps) {
  const { step, password } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="비밀번호를 입력해 주세요"
        description={
          <>
            안전한 계정 이용을 위해
            <br />
            다른 곳에서 쓰지 않는 비밀번호를 추천해요.
          </>
        }
        titleClassName={styles['password-title']}
        descriptionClassName={styles['password-description']}
      />

      <div className={styles['password-content']}>
        <PFTextInput
          size="xlarge"
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해 주세요."
          required
          value={password.password}
          onValueChange={password.setPassword}
          message="영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요."
        />
        <PFTextInput
          size="xlarge"
          label="비밀번호 재입력"
          type="password"
          placeholder="비밀번호를 한 번 더 입력해 주세요"
          required
          value={password.confirm}
          onValueChange={password.setConfirm}
          message={
            password.isMismatch ? '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.' : undefined
          }
          messageStatus="error"
          error={password.isMismatch}
        />
      </div>

      <SignUpActions variant="terms">
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!password.isValid}
          onClick={password.continue}
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
