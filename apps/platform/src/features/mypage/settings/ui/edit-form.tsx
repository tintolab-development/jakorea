import { useCallback, useEffect, useState } from 'react'
import { mapAdminRegisteredEditToPortalProfileUpdate } from '@/features/auth/admin-registered'
import {
  clearMypagePhoneIdentityConfirmPending,
  markMypagePhoneIdentityConfirmPending,
  useSettingsPhoneIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import {
  getLoginApiErrorMessage,
  usePortalPhoneIdentityConfirmMutation,
  usePortalProfileUpdateMutation,
} from '@/features/auth/sign-in'
import {
  AddressSearchModal,
  schoolGradeOptions,
  type SchoolStatus,
} from '@/features/auth/sign-up'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFSelect, PFText, PFTextInput } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE } from '../lib/constants'
import {
  applySettingsEditToSnapshot,
  isSettingsEditValid,
  mapProfileToSettingsEditForm,
  nullifyEmptyProfileUpdateFields,
  toSettingsGender,
} from '../lib/map-edit'
import {
  formatSettingsDateDot,
  formatSettingsPhone,
  formatSettingsText,
  type SettingsProfileInput,
} from '../lib/map-view'
import styles from './edit-form.module.css'

export type SettingsEditFormProps = {
  profile: SettingsProfileInput
  onCancel: () => void
  onSaved: (next: SettingsProfileInput) => void
}

export function SettingsEditForm({ profile, onCancel, onSaved }: SettingsEditFormProps) {
  const initial = mapProfileToSettingsEditForm(profile)
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>(initial.schoolStatus)
  const [schoolName, setSchoolName] = useState(initial.schoolName)
  const [schoolOrganizationId, setSchoolOrganizationId] = useState<number | null>(
    initial.schoolOrganizationId,
  )
  const [grade, setGrade] = useState(initial.grade)
  const [address, setAddress] = useState(initial.address)
  const [addressDetail, setAddressDetail] = useState(initial.addressDetail)
  const [postalCode, setPostalCode] = useState(initial.postalCode)
  const [regionSido, setRegionSido] = useState(initial.regionSido)
  const [regionSigungu, setRegionSigungu] = useState(initial.regionSigungu)
  const [volunteerId, setVolunteerId] = useState(initial.volunteerId)
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [phoneError, setPhoneError] = useState<string>()
  const profileUpdateMutation = usePortalProfileUpdateMutation()
  const phoneConfirmMutation = usePortalPhoneIdentityConfirmMutation()
  const confirmPhone = phoneConfirmMutation.mutateAsync
  const isConfirmingPhone = phoneConfirmMutation.isPending

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      void (async () => {
        setPhoneError(undefined)
        const verifiedPhone = result.verifiedPhone?.trim()

        if (isRemoteApiConfigured()) {
          const profileToken = result.profileToken?.trim()
          if (!profileToken) {
            clearMypagePhoneIdentityConfirmPending()
            setPhoneError('본인인증 정보가 부족합니다. 다시 시도해 주세요.')
            return
          }

          try {
            const changed = await confirmPhone({
              identityVerificationSessionId: Number(result.sessionId),
              profileToken,
            })
            setPhone(changed.phone?.trim() || verifiedPhone || '')
          } catch (error) {
            setPhoneError(
              getLoginApiErrorMessage(
                error,
                '휴대폰 번호를 변경하지 못했습니다. 다시 인증해 주세요.',
              ),
            )
            return
          } finally {
            clearMypagePhoneIdentityConfirmPending()
          }
          return
        }

        clearMypagePhoneIdentityConfirmPending()
        if (verifiedPhone) {
          setPhone(verifiedPhone)
        }
      })()
    },
    [confirmPhone],
  )

  const { verify, isVerifying, errorMessage, resetError } = useSettingsPhoneIdentityVerification({
    name: profile.name,
    birthDate: profile.birthDate,
    gender: toSettingsGender(profile.gender) || null,
    onSuccess: handleIdentitySuccess,
  })

  useEffect(() => {
    if (errorMessage) {
      clearMypagePhoneIdentityConfirmPending()
    }
  }, [errorMessage])

  useEffect(() => {
    return () => {
      clearMypagePhoneIdentityConfirmPending()
    }
  }, [])

  const displayName = formatSettingsText(profile.name)
  const displayPhone = formatSettingsPhone(phone)
  const displayBirth = formatSettingsDateDot(profile.birthDate)
  const displayEmail = formatSettingsText(profile.email)
  const identityError = phoneError ?? errorMessage ?? undefined
  const isReverifying = isVerifying || isConfirmingPhone

  const form = {
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
  }
  const isValid = isSettingsEditValid(form)

  const handleSchoolStatusChange = (status: SchoolStatus) => {
    setSchoolStatus(status)

    if (status === 'none') {
      setSchoolName('')
      setSchoolOrganizationId(null)
      setGrade('')
    }
  }

  const handleSchoolNameChange = (value: string) => {
    setSchoolName(value)
    setSchoolOrganizationId(
      value.trim() === initial.schoolName.trim() ? initial.schoolOrganizationId : null,
    )
  }

  const handleSubmit = async () => {
    if (!isValid || profileUpdateMutation.isPending || isReverifying) {
      return
    }

    setSubmitError(undefined)
    const next = applySettingsEditToSnapshot(profile, form)

    if (isRemoteApiConfigured()) {
      try {
        await profileUpdateMutation.mutateAsync(
          nullifyEmptyProfileUpdateFields(
            mapAdminRegisteredEditToPortalProfileUpdate({
              ...form,
              schoolAddress: profile.schoolAddress,
              portalProfile: {
                ...profile,
                schoolOrganizationId: profile.schoolOrganizationId ?? undefined,
              },
            }),
          ),
        )
      } catch (error) {
        setSubmitError(getLoginApiErrorMessage(error, '회원 정보를 수정하지 못했습니다.'))
        return
      }
    }

    onSaved({ ...next, phone })
  }

  const handleReverify = () => {
    if (isReverifying) {
      return
    }

    setPhoneError(undefined)
    resetError()
    if (isRemoteApiConfigured()) {
      markMypagePhoneIdentityConfirmPending()
    }
    void verify()
  }

  const handleCancel = () => {
    clearMypagePhoneIdentityConfirmPending()
    onCancel()
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
          기본 정보
        </PFText>

        <div className={styles.fields}>
          <PFTextInput
            size="xlarge"
            label="이름"
            value={displayName === EMPTY_SETTINGS_VALUE ? '' : displayName}
            required
            disabled
          />

          <div className={styles.addressField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              휴대폰 번호 <span className={styles.inlineRequiredMark}>*</span>
            </PFText>
            <div className={styles.inlineRow}>
              <PFTextInput
                size="xlarge"
                value={displayPhone === EMPTY_SETTINGS_VALUE ? '' : displayPhone}
                required
                readOnly
              />
              <PFButton
                size="xlarge"
                variant="secondary"
                type="button"
                disabled={isReverifying}
                onClick={handleReverify}
              >
                {isReverifying ? '본인인증 진행 중…' : '재인증 하기'}
              </PFButton>
            </div>
            {identityError ? (
              <PFText as="p" typo="bd-sm-md" color="error" className={styles.fieldError}>
                {identityError}
              </PFText>
            ) : null}
          </div>

          <PFTextInput
            size="xlarge"
            label="생년월일"
            value={displayBirth === EMPTY_SETTINGS_VALUE ? '' : displayBirth}
            required
            disabled
          />

          <div className={styles.genderField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              성별
            </PFText>
            <div className={styles.genderOptions}>
              <PFButton size="xlarge" variant="tertiary" width="100%" type="button" disabled>
                남성
              </PFButton>
              <PFButton size="xlarge" variant="tertiary" width="100%" type="button" disabled>
                여성
              </PFButton>
            </div>
          </div>

          <div className={styles.schoolStatusField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              현재 학교에 재학 중이신가요?{' '}
              <span className={styles.inlineRequiredMark}>*</span>
            </PFText>
            <div className={styles.schoolStatusOptions}>
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
                onValueChange={handleSchoolNameChange}
              />
              <PFSelect
                size="xlarge"
                label="학년"
                required
                placeholder="학년을 선택해 주세요"
                value={grade}
                onValueChange={setGrade}
                options={schoolGradeOptions.map(option => ({
                  value: option,
                  label: option,
                }))}
              />
            </>
          ) : null}

          <div className={styles.addressField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              자택 주소 <span className={styles.inlineRequiredMark}>*</span>
            </PFText>
            <div className={styles.inlineRow}>
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

          <PFTextInput
            size="xlarge"
            label="Email"
            value={displayEmail === EMPTY_SETTINGS_VALUE ? '' : displayEmail}
            disabled
          />
        </div>
      </section>

      <div className={styles.actions}>
        {submitError ? (
          <PFText as="p" typo="bd-sm-md" color="error" className={styles.submitError}>
            {submitError}
          </PFText>
        ) : null}
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!isValid || profileUpdateMutation.isPending || isReverifying}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {profileUpdateMutation.isPending ? '수정 중…' : '수정 완료하기'}
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleCancel}>
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
    </div>
  )
}
