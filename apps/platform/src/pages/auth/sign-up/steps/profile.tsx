import {
  AddressSearchModal,
  SchoolSearchModal,
  type UseSignUpReturn,
} from '@/features/auth/sign-up'
import { PFButton, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type ProfileStepProps = {
  signUp: UseSignUpReturn
}

function AdultIdentityFields({
  verifiedName,
  verifiedPhone,
}: {
  verifiedName: string
  verifiedPhone: string
}) {
  return (
    <>
      <PFTextInput size="xlarge" label="이름" value={verifiedName} required disabled />
      <PFTextInput size="xlarge" label="휴대폰 번호" value={verifiedPhone} required disabled />
    </>
  )
}

function SchoolEnrollmentToggle({
  schoolStatus,
  setSchoolStatus,
}: {
  schoolStatus: 'enrolled' | 'none' | null
  setSchoolStatus: (status: 'enrolled' | 'none') => void
}) {
  return (
    <div className={styles.schoolStatusField}>
      <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
        현재 학교에 재학 중이신가요? <span className={styles.inlineRequiredMark}>*</span>
      </PFText>
      <div className={styles.schoolStatusOptions}>
        <PFButton
          size="xlarge"
          variant="tertiary"
          selected={schoolStatus === 'enrolled'}
          width="100%"
          onClick={() => setSchoolStatus('enrolled')}
        >
          재학 중
        </PFButton>
        <PFButton
          size="xlarge"
          variant="tertiary"
          selected={schoolStatus === 'none'}
          width="100%"
          onClick={() => setSchoolStatus('none')}
        >
          해당 없음
        </PFButton>
      </div>
    </div>
  )
}

function MinorEnrolledSchoolFields({
  profile,
}: {
  profile: UseSignUpReturn['profile']
}) {
  return (
    <>
      <PFTextInput
        size="xlarge"
        label="소속/학교명"
        placeholder="소속 또는 학교명을 입력해 주세요"
        required
        value={profile.schoolName}
        onValueChange={profile.setSchoolName}
      />
      <PFSelect
        size="xlarge"
        label="학년"
        required
        placeholder="학년을 선택해 주세요"
        value={profile.grade}
        onValueChange={profile.setGrade}
        options={profile.gradeOptions.map(option => ({
          value: option,
          label: option,
        }))}
      />
    </>
  )
}

function AdultEnrolledSchoolFields({
  profile,
}: {
  profile: UseSignUpReturn['profile']
}) {
  return (
    <>
      <div className={styles.addressField}>
        <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
          소속/학교명 <span className={styles.inlineRequiredMark}>*</span>
        </PFText>
        <div className={styles.addressSearchRow}>
          <PFTextInput
            size="xlarge"
            placeholder={
              profile.requiresSchoolSearch
                ? '검색으로 학교를 선택해 주세요'
                : '소속 또는 학교명을 입력해 주세요'
            }
            required
            value={profile.schoolName}
            readOnly={profile.requiresSchoolSearch}
            onValueChange={profile.setSchoolName}
            onClick={profile.requiresSchoolSearch ? profile.openSchoolSearchModal : undefined}
          />
          <PFButton size="xlarge" variant="secondary" onClick={profile.openSchoolSearchModal}>
            검색
          </PFButton>
        </div>
      </div>

      <PFSelect
        size="xlarge"
        label="학년"
        required
        placeholder="학년을 선택해 주세요"
        value={profile.grade}
        onValueChange={profile.setGrade}
        options={profile.gradeOptions.map(option => ({
          value: option,
          label: option,
        }))}
      />
    </>
  )
}

function HomeAddressFields({ profile }: { profile: UseSignUpReturn['profile'] }) {
  return (
    <div className={styles.addressField}>
      <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
        자택 주소 <span className={styles.inlineRequiredMark}>*</span>
      </PFText>
      <div className={styles.addressSearchRow}>
        <PFTextInput
          size="xlarge"
          placeholder="주소를 검색해 주세요"
          value={profile.address}
          readOnly
          onClick={profile.openAddressModal}
        />
        <PFButton size="xlarge" variant="secondary" onClick={profile.openAddressModal}>
          주소 검색
        </PFButton>
      </div>
      <PFTextInput
        size="xlarge"
        placeholder="상세주소를 입력해 주세요"
        value={profile.addressDetail}
        onValueChange={profile.setAddressDetail}
      />
    </div>
  )
}

export function ProfileStep({ signUp }: ProfileStepProps) {
  const { step, profile, identity, guardian } = signUp
  const isMinorSignup = guardian.isUnderAgeSignup

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="회원 정보를 입력해 주세요."
        description={
          <>
            JA Korea 서비스를 더 편하게 이용할 수 있도록
            <br />
            필요한 정보를 확인해요.
          </>
        }
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
          {isMinorSignup ? (
            <PFTextInput
              size="xlarge"
              label="이름"
              placeholder="이름을 입력해 주세요"
              value={profile.memberName}
              onValueChange={profile.setMemberName}
              required
            />
          ) : (
            <AdultIdentityFields
              verifiedName={identity.verifiedName}
              verifiedPhone={identity.verifiedPhone}
            />
          )}

          <SchoolEnrollmentToggle
            schoolStatus={profile.schoolStatus}
            setSchoolStatus={profile.setSchoolStatus}
          />

          {profile.schoolStatus === 'enrolled' ? (
            isMinorSignup ? (
              <MinorEnrolledSchoolFields profile={profile} />
            ) : (
              <AdultEnrolledSchoolFields profile={profile} />
            )
          ) : profile.schoolStatus === 'none' ? (
            <PFTextInput
              size="xlarge"
              label="소속 기관명"
              placeholder="소속 기관명을 입력해 주세요"
              value={profile.affiliationName}
              onValueChange={profile.setAffiliationName}
              message="소속된 기관이 없으신 경우 비워두셔도 괜찮아요"
            />
          ) : null}

          <HomeAddressFields profile={profile} />

          <PFTextInput
            size="xlarge"
            label="1365 ID"
            placeholder="1365 ID를 입력해 주세요"
            value={profile.volunteerId}
            onValueChange={profile.setVolunteerId}
          />
        </div>
      </SignUpStepLayout>

      <AddressSearchModal
        open={profile.isAddressModalOpen}
        onClose={profile.closeAddressModal}
        onSelect={profile.selectAddress}
      />
      {!isMinorSignup ? (
        <SchoolSearchModal
          open={profile.isSchoolSearchModalOpen}
          onClose={profile.closeSchoolSearchModal}
          onSelect={profile.selectSchool}
        />
      ) : null}
    </SignUpLayout>
  )
}
