import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFTextInput } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type EmailStepProps = {
  signUp: UseSignUpReturn
}

export function EmailStep({ signUp }: EmailStepProps) {
  const { step, email } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title={
          <>
            로그인에 사용할
            <br />
            이메일을 입력해 주세요
          </>
        }
        description="로그인에 사용할 이메일 주소를 입력해 주세요. 자주 사용하는 이메일을 권장해요. 소셜 계정은 가입을 마친 뒤 연결할 수 있어요."
        actionsVariant="terms"
        actions={
          <>
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
          </>
        }
      >
        <div className={styles.emailContent}>
          <PFTextInput
            size="xlarge"
            label="이메일"
            placeholder="이메일을 입력해 주세요."
            type="email"
            required
            value={email.value}
            onValueChange={email.onChange}
            error={email.checkStatus === 'error'}
          />
          <PFButton
            size="xlarge"
            variant="secondary"
            width="100%"
            className={styles.duplicateCheckButton}
            disabled={email.isChecking}
            onClick={email.duplicateCheck}
          >
            {email.isChecking ? '확인 중…' : '중복확인'}
          </PFButton>
          {email.message ? (
            <p
              className={[
                styles.emailMessage,
                email.checkStatus === 'success'
                  ? styles.emailMessageSuccess
                  : styles.emailMessageError,
              ].join(' ')}
            >
              {email.message}
            </p>
          ) : null}
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
