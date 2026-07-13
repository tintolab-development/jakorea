import { useState } from 'react'
import {
  getAdminRegisteredProfileFields,
  isAdminRegisteredEditValid,
  requireAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
} from '@/features/auth/admin-registered'
import { AddressSearchModal } from '@/features/auth/sign-up/ui/address-search-modal'
import { MOCK_VERIFIED_NAME, MOCK_VERIFIED_PHONE, schoolGradeOptions } from '@/features/auth/sign-up'
import type { SchoolStatus } from '@/features/auth/sign-up'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import chevronRightGrayUrl from '@/shared/assets/icons/chevron-right-gray.svg'
import sharedStyles from './shared.module.css'

export function AdminRegisteredEditPage() {
  const wizardState = requireAdminRegisteredWizardState()

  if (!wizardState?.birthDate || !wizardState.gender) {
    window.location.assign('/auth/admin-registered/birth')
    return null
  }

  const profile = getAdminRegisteredProfileFields(wizardState)

  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>(profile.schoolStatus)
  const [schoolName, setSchoolName] = useState(profile.schoolName)
  const [grade, setGrade] = useState(profile.grade)
  const [address, setAddress] = useState(profile.address)
  const [addressDetail, setAddressDetail] = useState(profile.addressDetail)
  const [volunteerId, setVolunteerId] = useState(profile.volunteerId)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const isValid = isAdminRegisteredEditValid({
    schoolStatus,
    schoolName,
    grade,
    address,
    addressDetail,
  })

  const handleSchoolStatusChange = (status: SchoolStatus) => {
    setSchoolStatus(status)

    if (status === 'none') {
      setSchoolName('')
      setGrade('')
    }
  }

  const handleSubmit = () => {
    if (!isValid) {
      return
    }

    updateAdminRegisteredWizardState({
      schoolStatus,
      schoolName,
      grade,
      address,
      addressDetail,
      volunteerId,
    })

    window.location.assign('/auth/admin-registered/confirm')
  }

  const handlePrevious = () => {
    window.location.assign('/auth/admin-registered/confirm')
  }

  return (
    <section className={sharedStyles.page}>
      <div className={sharedStyles.container}>
        <div className={sharedStyles.header}>
          <PFText as="h1" typo="hd-sm" color="black" className={sharedStyles.title}>
            회원 정보를 수정해 주세요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={sharedStyles.description}>
            변경된 내용이 있다면 정보를 수정해 주세요. 휴대폰 번호는 마이페이지에서 본인인증 후
            변경할 수 있어요.
          </PFText>
        </div>

        <div className={sharedStyles.content}>
          <PFTextInput size="xlarge" label="이름" value={MOCK_VERIFIED_NAME} required disabled />
          <PFTextInput
            size="xlarge"
            label="휴대폰 번호"
            value={MOCK_VERIFIED_PHONE}
            required
            disabled
          />

          <div className={sharedStyles['school-status-field']}>
            <PFText as="span" typo="label-md" color="inherit" className={sharedStyles['field-label']}>
              현재 학교에 재학 중이신가요?{' '}
              <span className={sharedStyles['inline-required-mark']}>*</span>
            </PFText>
            <div className={sharedStyles['school-status-options']}>
              <PFButton
                size="xlarge"
                variant="tertiary"
                selected={schoolStatus === 'enrolled'}
                width="100%"
                onClick={() => handleSchoolStatusChange('enrolled')}
              >
                재학 중
              </PFButton>
              <PFButton
                size="xlarge"
                variant="tertiary"
                selected={schoolStatus === 'none'}
                width="100%"
                onClick={() => handleSchoolStatusChange('none')}
              >
                해당 없음
              </PFButton>
            </div>
          </div>

          {schoolStatus === 'enrolled' ? (
            <>
              <PFTextInput
                size="xlarge"
                label="소속/학교명"
                placeholder="소속 또는 학교명을 입력해 주세요"
                required
                value={schoolName}
                onValueChange={setSchoolName}
              />

              <div className={sharedStyles['grade-field']}>
                <PFText as="span" typo="label-md" color="inherit" className={sharedStyles['field-label']}>
                  학년 <span className={sharedStyles['inline-required-mark']}>*</span>
                </PFText>
                <div className={sharedStyles['grade-select-wrap']}>
                  <select
                    className={sharedStyles['grade-select']}
                    required
                    value={grade}
                    onChange={event => setGrade(event.target.value)}
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
                    className={sharedStyles['grade-select-arrow']}
                    src={chevronRightGrayUrl}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
              </div>
            </>
          ) : null}

          <div className={sharedStyles['address-field']}>
            <PFText as="span" typo="label-md" color="inherit" className={sharedStyles['field-label']}>
              자택 주소 <span className={sharedStyles['inline-required-mark']}>*</span>
            </PFText>
            <div className={sharedStyles['address-search-row']}>
              <PFTextInput
                size="xlarge"
                placeholder="주소를 검색해 주세요"
                value={address}
                readOnly
                onClick={() => setIsAddressModalOpen(true)}
              />
              <PFButton
                size="xlarge"
                variant="secondary"
                width="100%"
                onClick={() => setIsAddressModalOpen(true)}
              >
                주소 검색
              </PFButton>
            </div>
            <PFTextInput
              size="xlarge"
              placeholder="상세주소를 입력해 주세요"
              value={addressDetail}
              onValueChange={setAddressDetail}
            />
          </div>

          <PFTextInput
            size="xlarge"
            label="1365 ID"
            placeholder="1365 ID를 입력해 주세요"
            value={volunteerId}
            onValueChange={setVolunteerId}
          />
        </div>

        <div className={sharedStyles['actions-terms']}>
          <PFButton size="xlarge" width="100%" disabled={!isValid} onClick={handleSubmit}>
            가입 정보 수정하기
          </PFButton>
          <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handlePrevious}>
            이전
          </PFButton>
        </div>
      </div>

      <AddressSearchModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={selectedAddress => {
          setAddress(selectedAddress)
          setIsAddressModalOpen(false)
        }}
      />
    </section>
  )
}
