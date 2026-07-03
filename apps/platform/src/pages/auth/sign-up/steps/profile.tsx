import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { MOCK_VERIFIED_NAME, MOCK_VERIFIED_PHONE, schoolGradeOptions } from '@/features/auth/sign-up'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import chevronRightGrayUrl from '@/shared/assets/icons/chevron-right-gray.svg'
import { AddressSearchModal } from '@/features/auth/sign-up/ui/address-search-modal'
import { SignUpActions } from '../layout/actions'
import { SignUpLayout } from '../layout/shell'
import { StepHeader } from '../layout/step-header'
import styles from '../wizard.module.css'

type ProfileStepProps = {
  signUp: UseSignUpReturn
}

export function ProfileStep({ signUp }: ProfileStepProps) {
  const { step, profile } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="회원 정보를 입력해 주세요"
        description={
          <>
            JA Korea 서비스를 더 편하게 이용할 수 있도록
            <br />
            필요한 정보를 확인해요.
          </>
        }
        titleClassName={styles['profile-title']}
        descriptionClassName={styles['profile-description']}
      />

      <div className={styles['profile-content']}>
        <PFTextInput size="xlarge" label="이름" value={MOCK_VERIFIED_NAME} required disabled />
        <PFTextInput
          size="xlarge"
          label="휴대폰 번호"
          value={MOCK_VERIFIED_PHONE}
          required
          disabled
        />

        <div className={styles['school-status-field']}>
          <PFText as="span" typo="label-md" color="inherit" className={styles['field-label']}>
            현재 학교에 재학 중이신가요?{' '}
            <span className={styles['inline-required-mark']}>*</span>
          </PFText>
          <div className={styles['school-status-options']}>
            <PFButton
              size="xlarge"
              variant="tertiary"
              selected={profile.schoolStatus === 'enrolled'}
              width="100%"
              onClick={() => profile.setSchoolStatus('enrolled')}
            >
              재학 중
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              selected={profile.schoolStatus === 'none'}
              width="100%"
              onClick={() => profile.setSchoolStatus('none')}
            >
              해당 없음
            </PFButton>
          </div>
        </div>

        {profile.schoolStatus === 'enrolled' ? (
          <>
            <PFTextInput
              size="xlarge"
              label="소속/학교명"
              placeholder="소속 또는 학교명을 입력해 주세요"
              required
              value={profile.schoolName}
              onValueChange={profile.setSchoolName}
            />

            <div className={styles['grade-field']}>
              <PFText as="span" typo="label-md" color="inherit" className={styles['field-label']}>
                학년 <span className={styles['inline-required-mark']}>*</span>
              </PFText>
              <div className={styles['grade-select-wrap']}>
                <select
                  className={styles['grade-select']}
                  required
                  value={profile.grade}
                  onChange={event => profile.setGrade(event.target.value)}
                >
                  <option value="" disabled hidden>
                    학년을 선택해 주세요
                  </option>
                  {schoolGradeOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <img
                  className={styles['grade-select-arrow']}
                  src={chevronRightGrayUrl}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>
          </>
        ) : null}

        <div className={styles['address-field']}>
          <PFText as="span" typo="label-md" color="inherit" className={styles['field-label']}>
            자택 주소 <span className={styles['inline-required-mark']}>*</span>
          </PFText>
          <div className={styles['address-search-row']}>
            <PFTextInput
              size="xlarge"
              placeholder="주소를 검색해 주세요"
              value={profile.address}
              readOnly
              onClick={profile.openAddressModal}
            />
            <PFButton
              size="xlarge"
              variant="secondary"
              width="100%"
              onClick={profile.openAddressModal}
            >
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

        <PFTextInput
          size="xlarge"
          label="1365 ID"
          placeholder="1365 ID를 입력해 주세요"
          value={profile.volunteerId}
          onValueChange={profile.setVolunteerId}
        />
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

      <AddressSearchModal
        open={profile.isAddressModalOpen}
        onClose={profile.closeAddressModal}
        onSelect={profile.setAddress}
      />
    </SignUpLayout>
  )
}
