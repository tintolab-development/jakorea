import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type GuardianProfileStepProps = {
  signUp: UseSignUpReturn
}

/** Challenge 생성 전 보호자 이름·연락처·관계 (BE 안 A) */
export function GuardianProfileStep({ signUp }: GuardianProfileStepProps) {
  const { step, guardian } = signUp
  const { profile } = guardian

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="보호자 정보를 입력해 주세요."
        description="법정대리인 확인과 동의 기록에 사용돼요. 본인인증 전에 입력해 주세요."
        actionsVariant="terms"
        actions={
          <>
            <PFButton
              size="xlarge"
              width="100%"
              disabled={!profile.isValid || profile.isSubmitting}
              onClick={() => {
                void profile.submit()
              }}
            >
              {profile.isSubmitting ? '확인 중…' : '입력 완료하고 본인인증하기'}
            </PFButton>
            <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
              이전
            </PFButton>
          </>
        }
      >
        <div className={styles.guardianConfirmContent}>
          <PFTextInput
            size="xlarge"
            label="보호자님 이름"
            placeholder="보호자님 이름을 입력해 주세요"
            value={profile.name}
            required
            onValueChange={profile.setName}
          />
          <PFTextInput
            size="xlarge"
            label="보호자님 휴대폰 번호"
            placeholder="숫자만 입력해 주세요"
            value={profile.phone}
            required
            inputMode="tel"
            onValueChange={profile.setPhone}
          />
          <PFTextInput
            size="xlarge"
            label="가입자와의 관계"
            placeholder="예: 부, 모, 법정대리인"
            required
            value={profile.relationship}
            onValueChange={profile.setRelationship}
          />
          {profile.submitError ? (
            <PFText as="p" typo="bd-sm-md" color="error" className={styles.stepMessage}>
              {profile.submitError}
            </PFText>
          ) : null}
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
