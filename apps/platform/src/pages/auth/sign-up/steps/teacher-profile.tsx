import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { MOCK_VERIFIED_NAME, MOCK_VERIFIED_PHONE } from '@/features/auth/sign-up'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import { SchoolSearchModal } from '@/features/auth/sign-up/ui/school-search-modal'
import { SignUpActions } from '../layout/actions'
import { SignUpLayout } from '../layout/shell'
import { StepHeader } from '../layout/step-header'
import styles from '../wizard.module.css'

type TeacherProfileStepProps = {
  signUp: UseSignUpReturn
}

export function TeacherProfileStep({ signUp }: TeacherProfileStepProps) {
  const { step, profile } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="교사회원 정보를 입력해 주세요"
        description="교육 활동에 필요한 선생님 정보를 확인할게요."
        titleClassName={styles['profile-title']}
        descriptionClassName={styles['profile-description']}
      />

      <div className={styles['profile-content']}>
        <PFTextInput size="xlarge" label="이름" value={MOCK_VERIFIED_NAME} required disabled />
        <PFTextInput size="xlarge" label="휴대폰 번호" value={MOCK_VERIFIED_PHONE} disabled />

        <div className={styles['address-field']}>
          <PFText as="span" typo="label-md" color="inherit" className={styles['field-label']}>
            소속/학교 <span className={styles['inline-required-mark']}>*</span>
          </PFText>
          <div className={styles['address-search-row']}>
            <PFTextInput
              size="xlarge"
              placeholder="소속 또는 학교를 입력해 주세요"
              value={profile.schoolName}
              onValueChange={profile.setSchoolName}
            />
            <PFButton
              size="xlarge"
              variant="secondary"
              width="100%"
              onClick={profile.openSchoolSearchModal}
            >
              검색
            </PFButton>
          </div>
        </div>

        <div className={styles['school-status-field']}>
          <PFText as="span" typo="label-md" color="inherit" className={styles['field-label']}>
            재직 현황 <span className={styles['inline-required-mark']}>*</span>
          </PFText>
          <div className={styles['school-status-options']}>
            <PFButton
              size="xlarge"
              variant="tertiary"
              selected={profile.employmentStatus === 'employed'}
              width="100%"
              onClick={() => profile.setEmploymentStatus('employed')}
            >
              재직 중
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              selected={profile.employmentStatus === 'on-leave'}
              width="100%"
              onClick={() => profile.setEmploymentStatus('on-leave')}
            >
              휴직 중
            </PFButton>
          </div>
        </div>
      </div>

      <SignUpActions variant="terms">
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!profile.isValid}
          onClick={profile.continue}
        >
          가입 정보 확인하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={step.goPrevious}>
          이전
        </PFButton>
      </SignUpActions>

      <SchoolSearchModal
        open={profile.isSchoolSearchModalOpen}
        onClose={profile.closeSchoolSearchModal}
        onSelect={profile.setSchoolName}
      />
    </SignUpLayout>
  )
}
