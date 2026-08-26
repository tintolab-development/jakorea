import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminRegisteredProfileFields,
  isAdminRegisteredEditValid,
  mapAdminRegisteredEditToPortalProfileUpdate,
  requireAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
  useAdminRegisteredProfileHydration,
} from '@/features/auth/admin-registered'
import { getLoginApiErrorMessage, usePortalProfileUpdateMutation } from '@/features/auth/sign-in'
import {
  AddressSearchModal,
  SchoolSearchModal,
  schoolGradeOptions,
  type SchoolStatus,
  type SelectedSchool,
} from '@/features/auth/sign-up'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import chevronRightGrayUrl from '@/shared/assets/icons/chevron-right-gray.svg'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import sharedStyles from './shared.module.css'

export function AdminRegisteredEditPage() {
  const navigate = useNavigate()
  const initialWizardState = requireAdminRegisteredWizardState()
  const { wizardState, isHydrating } = useAdminRegisteredProfileHydration(initialWizardState)

  const profile = wizardState ? getAdminRegisteredProfileFields(wizardState) : null
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>(profile?.schoolStatus ?? 'none')
  const [schoolName, setSchoolName] = useState(profile?.schoolName ?? '')
  const [schoolAddress, setSchoolAddress] = useState(wizardState?.schoolAddress ?? '')
  const [schoolOrganizationId, setSchoolOrganizationId] = useState<number | null>(
    wizardState?.schoolOrganizationId ?? wizardState?.portalProfile?.schoolOrganizationId ?? null,
  )
  const [schoolNeisCode, setSchoolNeisCode] = useState<string | null>(
    wizardState?.schoolNeisCode ?? null,
  )
  const [grade, setGrade] = useState(profile?.grade ?? '')
  const [address, setAddress] = useState(profile?.address ?? '')
  const [addressDetail, setAddressDetail] = useState(profile?.addressDetail ?? '')
  const [postalCode, setPostalCode] = useState(profile?.postalCode ?? '')
  const [regionSido, setRegionSido] = useState(profile?.regionSido ?? '')
  const [regionSigungu, setRegionSigungu] = useState(profile?.regionSigungu ?? '')
  const [volunteerId, setVolunteerId] = useState(profile?.volunteerId ?? '')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isSchoolSearchModalOpen, setIsSchoolSearchModalOpen] = useState(false)
  const [fieldsSynced, setFieldsSynced] = useState(Boolean(wizardState?.profileHydrated))
  const [submitError, setSubmitError] = useState<string>()
  const profileUpdateMutation = usePortalProfileUpdateMutation()

  useEffect(() => {
    if (isHydrating) return
    if (!wizardState?.birthDate || !wizardState.gender) {
      navigate('/auth/admin-registered/birth', { replace: true })
    }
  }, [navigate, wizardState?.birthDate, wizardState?.gender, isHydrating])

  useEffect(() => {
    if (!wizardState?.profileHydrated || fieldsSynced) return
    const next = getAdminRegisteredProfileFields(wizardState)
    setSchoolStatus(next.schoolStatus)
    setSchoolName(next.schoolName)
    setSchoolAddress(wizardState.schoolAddress ?? '')
    setSchoolOrganizationId(
      wizardState.schoolOrganizationId ?? wizardState.portalProfile?.schoolOrganizationId ?? null,
    )
    setSchoolNeisCode(wizardState.schoolNeisCode ?? null)
    setGrade(next.grade)
    setAddress(next.address)
    setAddressDetail(next.addressDetail)
    setPostalCode(next.postalCode)
    setRegionSido(next.regionSido)
    setRegionSigungu(next.regionSigungu)
    setVolunteerId(next.volunteerId)
    setFieldsSynced(true)
  }, [wizardState, fieldsSynced])

  if (!initialWizardState) {
    return null
  }

  if (isHydrating) {
    return (
      <section>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={sharedStyles.statusMessage}>
          가입 정보를 불러오는 중…
        </PFText>
      </section>
    )
  }

  if (!wizardState?.birthDate || !wizardState.gender) {
    return null
  }

  const displayName = wizardState.verifiedName?.trim() || '-'
  const displayPhone = wizardState.verifiedPhone?.trim() || '-'

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
      setSchoolAddress('')
      setSchoolOrganizationId(null)
      setSchoolNeisCode(null)
      setGrade('')
    }
  }

  const handleSchoolSelect = (school: SelectedSchool) => {
    setSchoolName(school.name)
    setSchoolAddress(school.address?.trim() ?? '')
    setSchoolOrganizationId(school.organizationId ?? null)
    setSchoolNeisCode(school.neisCode ?? null)
    setIsSchoolSearchModalOpen(false)
  }

  const persistWizard = () => {
    updateAdminRegisteredWizardState({
      schoolStatus,
      schoolName,
      schoolAddress,
      schoolOrganizationId,
      schoolNeisCode,
      grade,
      address,
      addressDetail,
      postalCode,
      regionSido,
      regionSigungu,
      volunteerId,
    })
  }

  const handleSubmit = async () => {
    if (!isValid || profileUpdateMutation.isPending) {
      return
    }

    setSubmitError(undefined)

    const payload = mapAdminRegisteredEditToPortalProfileUpdate({
      schoolStatus,
      schoolName,
      grade,
      address,
      addressDetail,
      postalCode,
      regionSido,
      regionSigungu,
      volunteerId,
      schoolOrganizationId,
      schoolAddress,
      schoolNeisCode,
      employmentStatus: wizardState.employmentStatus,
      portalProfile: wizardState.portalProfile,
    })

    if (isRemoteApiConfigured()) {
      try {
        const updated = await profileUpdateMutation.mutateAsync(payload)
        updateAdminRegisteredWizardState({
          schoolStatus,
          schoolName,
          schoolAddress,
          schoolOrganizationId,
          schoolNeisCode,
          grade,
          address,
          addressDetail,
          postalCode,
          regionSido,
          regionSigungu,
          volunteerId,
          portalProfile: updated,
          profileHydrated: true,
        })
      } catch (error) {
        setSubmitError(getLoginApiErrorMessage(error, '회원 정보를 수정하지 못했습니다.'))
        return
      }
    } else {
      persistWizard()
    }

    navigate('/auth/admin-registered/confirm')
  }

  const handlePrevious = () => {
    navigate('/auth/admin-registered/confirm')
  }

  return (
    <section>
      <div className={sharedStyles.header}>
        <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
          회원 정보를 수정해 주세요
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          변경된 내용이 있다면 정보를 수정해 주세요. 휴대폰 번호는 마이페이지에서 본인인증 후
          변경할 수 있어요.
        </PFText>
      </div>

      <div className={sharedStyles.content}>
        <PFTextInput size="xlarge" label="이름" value={displayName} required disabled />
        <PFTextInput size="xlarge" label="휴대폰 번호" value={displayPhone} required disabled />
        {isHydrating ? (
          <PFText as="p" typo="bd-sm-rg" color="neutral-cool-500">
            가입 정보를 불러오는 중…
          </PFText>
        ) : null}

        <div className={sharedStyles.schoolStatusField}>
          <PFText as="span" typo="label-md" color="inherit" className={sharedStyles.fieldLabel}>
            현재 학교에 재학 중이신가요? <span className={sharedStyles.inlineRequiredMark}>*</span>
          </PFText>
          <div className={sharedStyles.schoolStatusOptions}>
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
            <div className={sharedStyles.addressField}>
              <PFText as="span" typo="label-md" color="inherit" className={sharedStyles.fieldLabel}>
                소속/학교명 <span className={sharedStyles.inlineRequiredMark}>*</span>
              </PFText>
              <div className={sharedStyles.addressSearchRow}>
                <PFTextInput
                  size="xlarge"
                  placeholder="검색으로 학교를 선택해 주세요"
                  required
                  value={schoolName}
                  readOnly
                  onClick={() => setIsSchoolSearchModalOpen(true)}
                />
                <PFButton
                  size="xlarge"
                  variant="secondary"
                  onClick={() => setIsSchoolSearchModalOpen(true)}
                >
                  검색
                </PFButton>
              </div>
            </div>

            <div className={sharedStyles.gradeField}>
              <PFText as="span" typo="label-md" color="inherit" className={sharedStyles.fieldLabel}>
                학년 <span className={sharedStyles.inlineRequiredMark}>*</span>
              </PFText>
              <div className={sharedStyles.gradeSelectWrap}>
                <select
                  className={sharedStyles.gradeSelect}
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
                  className={sharedStyles.gradeSelectArrow}
                  src={chevronRightGrayUrl}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>
          </>
        ) : null}

        <div className={sharedStyles.addressField}>
          <PFText as="span" typo="label-md" color="inherit" className={sharedStyles.fieldLabel}>
            자택 주소 <span className={sharedStyles.inlineRequiredMark}>*</span>
          </PFText>
          <div className={sharedStyles.addressSearchRow}>
            <PFTextInput
              size="xlarge"
              placeholder="주소를 검색해 주세요"
              value={address}
              readOnly
              onClick={() => setIsAddressModalOpen(true)}
            />
            <PFButton size="xlarge" variant="secondary" onClick={() => setIsAddressModalOpen(true)}>
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

      <div className={sharedStyles.actionsTerms}>
        {submitError ? (
          <PFText as="p" typo="bd-sm-md" color="error" className={sharedStyles.submitError}>
            {submitError}
          </PFText>
        ) : null}
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!isValid || isHydrating || profileUpdateMutation.isPending}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {profileUpdateMutation.isPending ? '수정 중…' : '가입 정보 수정하기'}
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handlePrevious}>
          이전
        </PFButton>
      </div>

      <AddressSearchModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={selection => {
          setAddress(selection.address)
          setPostalCode(selection.postalCode ?? '')
          setRegionSido(selection.regionSido ?? '')
          setRegionSigungu(selection.regionSigungu ?? '')
          setIsAddressModalOpen(false)
        }}
      />
      <SchoolSearchModal
        open={isSchoolSearchModalOpen}
        onClose={() => setIsSchoolSearchModalOpen(false)}
        onSelect={handleSchoolSelect}
      />
    </section>
  )
}
