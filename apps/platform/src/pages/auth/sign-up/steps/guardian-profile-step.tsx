import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type GuardianProfileStepProps = {
  signUp: UseSignUpReturn
}

/**
 * 보호자 본인인증 뒤 정보 확인 (Figma 2750-73961).
 * 이름·휴대폰은 NICE 결과(signup-status)를 자동 입력하고 비활성화한다. 관계만 입력한다.
 */
export function GuardianProfileStep({ signUp }: GuardianProfileStepProps) {
  const { step, guardian } = signUp
  const { profile } = guardian

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="보호자 동의에 필요한 정보만 확인해요."
        description="입력한 정보는 보호자 본인인증과 동의 확인에만 사용돼요."
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
              {profile.isSubmitting ? '확인 중…' : '확인하고 계속하기'}
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
            value={profile.name}
            disabled
          />
          <PFTextInput
            size="xlarge"
            label="보호자님 휴대폰 번호"
            value={formatKoreanPhoneNumber(profile.phone)}
            type="tel"
            disabled
          />
          <PFTextInput
            size="xlarge"
            label="가입자와의 관계"
            placeholder="가입자와의 관계를 입력해 주세요"
            required
            value={profile.relationship}
            onValueChange={profile.setRelationship}
            error={Boolean(profile.relationshipError)}
            message={profile.relationshipError || undefined}
            messageStatus={profile.relationshipError ? 'error' : undefined}
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
