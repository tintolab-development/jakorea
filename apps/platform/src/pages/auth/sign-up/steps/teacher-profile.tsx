import { SchoolSearchModal, type UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type TeacherProfileStepProps = {
  signUp: UseSignUpReturn
}

export function TeacherProfileStep({ signUp }: TeacherProfileStepProps) {
  const { step, profile, identity } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="교사회원 정보를 입력해 주세요"
        description="교육 활동에 필요한 선생님 정보를 확인할게요."
        actionsVariant="terms"
        actions={
          <>
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
          </>
        }
      >
        <div className={styles.profileContent}>
        <PFTextInput size="xlarge" label="이름" value={identity.verifiedName} required disabled />
        <PFTextInput size="xlarge" label="휴대폰 번호" value={identity.verifiedPhone} disabled />

        <div className={styles.addressField}>
          <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
            소속/학교 <span className={styles.inlineRequiredMark}>*</span>
          </PFText>
          <div className={styles.addressSearchRow}>
            <PFTextInput
              size="xlarge"
              placeholder={
                profile.requiresSchoolSearch
                  ? '검색으로 학교를 선택해 주세요'
                  : '소속 또는 학교를 입력해 주세요'
              }
              value={profile.schoolName}
              readOnly={profile.requiresSchoolSearch}
              onValueChange={profile.setSchoolName}
              onClick={
                profile.requiresSchoolSearch ? profile.openSchoolSearchModal : undefined
              }
            />
            <PFButton size="xlarge" variant="secondary" onClick={profile.openSchoolSearchModal}>
              검색
            </PFButton>
          </div>
        </div>

        <div className={styles.schoolStatusField}>
          <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
            재직 현황 <span className={styles.inlineRequiredMark}>*</span>
          </PFText>
          <div className={styles.schoolStatusOptions}>
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
      </SignUpStepLayout>

      <SchoolSearchModal
        open={profile.isSchoolSearchModalOpen}
        onClose={profile.closeSchoolSearchModal}
        onSelect={profile.selectSchool}
      />
    </SignUpLayout>
  )
}
