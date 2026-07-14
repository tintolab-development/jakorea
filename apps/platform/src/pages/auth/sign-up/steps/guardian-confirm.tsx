import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFTextInput } from '@/shared/ui'
import { SignUpActions } from '../layout/actions'
import { SignUpLayout } from '../layout/shell'
import { StepHeader } from '../layout/step-header'
import styles from '../wizard.module.css'

type GuardianConfirmStepProps = {
  signUp: UseSignUpReturn
}

export function GuardianConfirmStep({ signUp }: GuardianConfirmStepProps) {
  const { step, guardian } = signUp
  const { profile } = guardian

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="보호자 동의에 필요한 정보만 확인해요"
        description="입력한 정보는 보호자 본인인증과 동의 확인에만 사용돼요."
        titleClassName={styles.guardianConfirmTitle}
        descriptionClassName={styles.guardianConfirmDescription}
      />

      <div className={styles.guardianConfirmContent}>
        <PFTextInput
          size="xlarge"
          label="보호자님 이름"
          value={profile.name}
          required
          disabled
          message="보호자 이름을 입력해 주세요."
        />
        <PFTextInput
          size="xlarge"
          label="보호자님 휴대폰 번호"
          value={profile.phone}
          required
          disabled
        />
        <PFTextInput
          size="xlarge"
          label="가입자와의 관계"
          placeholder="가입자와의 관계를 입력해 주세요"
          required
          value={profile.relationship}
          onValueChange={profile.setRelationship}
        />
      </div>

      <SignUpActions variant="terms">
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!profile.isValid}
          onClick={profile.continue}
        >
          보호자 정보 확인
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
          이전
        </PFButton>
      </SignUpActions>
    </SignUpLayout>
  )
}
