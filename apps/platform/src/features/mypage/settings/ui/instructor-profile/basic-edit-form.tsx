import { useCallback, useEffect, useMemo, useState } from 'react'
import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
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
  type PortalProfileResponse,
} from '@/features/auth/sign-in'
import { AddressSearchModal } from '@/features/auth/sign-up'
import {
  mapInstructorFormValuesToCmsProfile,
  mapInstructorFormValuesToPortalSettlement,
} from '@/features/mypage/instructor-apply/api/map-create-request'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFAlertModal, PFButton, PFText, PFTextInput } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE } from '../../lib/constants'
import {
  mapInstructorBasicSettingsToPortalProfileUpdate,
  type InstructorBasicSettingsAddressMeta,
} from '../../lib/map-instructor-basic-profile-update'
import { buildInstructorSettingsFormValues } from '../../lib/map-instructor-settings-form'
import {
  SETTINGS_TEACHER_EMPLOYMENT_OPTIONS,
  toSettingsGender,
} from '../../lib/map-edit'
import {
  formatSettingsDateDot,
  formatSettingsPhone,
  formatSettingsText,
  type SettingsProfileInput,
} from '../../lib/map-view'
import styles from '../edit-form.module.css'

const REQUIRED_INCOMPLETE = '필수 항목을 모두 작성해주세요'

function validateInstructorBasicEdit(values: InstructorSharedProfileFormValues): string | null {
  const result = collectInstructorRegisterValidation(values, {}, { requiredConsentAgreeKeys: [] })
  if (result.missingRequired) return REQUIRED_INCOMPLETE
  if (result.formatMessages[0]) return result.formatMessages[0]
  return null
}

export type SettingsInstructorBasicEditFormProps = {
  profile: SettingsProfileInput
  initialValues: InstructorSharedProfileFormValues
  onCancel: () => void
  onSaved: (next: InstructorSharedProfileFormValues) => void
  /** 회원정보 설정 — 기본 정보 섹션만 교체 */
  embedded?: boolean
}

export function SettingsInstructorBasicEditForm({
  profile,
  initialValues,
  onCancel,
  onSaved,
  embedded = false,
}: SettingsInstructorBasicEditFormProps) {
  const [values, setValues] = useState(initialValues)
  const [phone, setPhone] = useState(profile.phone?.trim() ?? '')
  const [postalCode, setPostalCode] = useState(profile.postalCode?.trim() ?? '')
  const [regionSido, setRegionSido] = useState(profile.regionSido?.trim() ?? '')
  const [regionSigungu, setRegionSigungu] = useState(profile.regionSigungu?.trim() ?? '')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [phoneError, setPhoneError] = useState<string | undefined>()
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const profileUpdateMutation = usePortalProfileUpdateMutation()
  const { mutateAsync: confirmPhone, isPending: isConfirmingPhone } =
    usePortalPhoneIdentityConfirmMutation()

  const patch = useCallback((partial: Partial<InstructorSharedProfileFormValues>) => {
    setValues(prev => ({ ...prev, ...partial }))
  }, [])

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
            const nextPhone = changed.phone?.trim() || verifiedPhone || ''
            setPhone(nextPhone)
            patch({
              contact: nextPhone ? formatKoreanPhoneNumber(nextPhone) : values.contact,
            })
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
          patch({ contact: formatKoreanPhoneNumber(verifiedPhone) })
        }
      })()
    },
    [confirmPhone, patch, values.contact],
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
  const displayGender = toSettingsGender(profile.gender)
  const identityError = phoneError ?? errorMessage ?? undefined
  const isReverifying = isVerifying || isConfirmingPhone
  const isValid = useMemo(() => validateInstructorBasicEdit(values) === null, [values])

  const addressMeta: InstructorBasicSettingsAddressMeta = {
    postalCode,
    regionSido,
    regionSigungu,
  }

  const handleReverify = () => {
    if (isReverifying) return
    setPhoneError(undefined)
    resetError()
    if (isRemoteApiConfigured()) {
      markMypagePhoneIdentityConfirmPending()
    }
    void verify()
  }

  const handleSave = async () => {
    if (!isValid || profileUpdateMutation.isPending || isReverifying) return
    setSubmitError(null)
    const validationError = validateInstructorBasicEdit(values)
    if (validationError) {
      setAlertMessage(validationError)
      return
    }

    if (!isRemoteApiConfigured()) {
      onSaved(values)
      return
    }

    try {
      const updated = await profileUpdateMutation.mutateAsync(
        mapInstructorBasicSettingsToPortalProfileUpdate(values, addressMeta),
      )
      onSaved(buildInstructorSettingsFormValues(updated as PortalProfileResponse))
    } catch (error) {
      setSubmitError(
        getLoginApiErrorMessage(error, '회원 정보를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
      )
    }
  }

  const handleCancel = () => {
    clearMypagePhoneIdentityConfirmPending()
    onCancel()
  }

  const isSchoolTeacher = values.memberType === 'school_teacher'

  const formContent = (
    <>
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
              <PFButton
                size="xlarge"
                variant="tertiary"
                width="100%"
                type="button"
                selected={displayGender === 'male'}
                disabled
              >
                남성
              </PFButton>
              <PFButton
                size="xlarge"
                variant="tertiary"
                width="100%"
                type="button"
                selected={displayGender === 'female'}
                disabled
              >
                여성
              </PFButton>
            </div>
          </div>

          <PFTextInput
            size="xlarge"
            label="이메일"
            value={displayEmail === EMPTY_SETTINGS_VALUE ? '' : displayEmail}
            required
            disabled
          />

          {isSchoolTeacher ? (
            <>
              <PFTextInput
                size="xlarge"
                label="소속"
                value={values.schoolName}
                required
                disabled
              />
              <div className={styles.schoolStatusField}>
                <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
                  재직 현황 <span className={styles.inlineRequiredMark}>*</span>
                </PFText>
                <div className={styles.schoolStatusOptions}>
                  {SETTINGS_TEACHER_EMPLOYMENT_OPTIONS.map(option => (
                    <PFButton
                      key={option.value}
                      size="xlarge"
                      variant="tertiary"
                      selected={values.employmentStatus === option.value}
                      width="100%"
                      type="button"
                      onClick={() => patch({ employmentStatus: option.value })}
                    >
                      {option.label}
                    </PFButton>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <PFTextInput
              size="xlarge"
              label="소속"
              placeholder="소속을 입력해 주세요"
              value={values.affiliationName}
              onValueChange={value => patch({ affiliationName: value, affiliationNone: false })}
              required
            />
          )}

          <PFTextInput
            size="xlarge"
            label="강사 경력"
            placeholder="예: 3년"
            value={values.instructorCareer}
            onValueChange={value => patch({ instructorCareer: value })}
            required
          />

          <div className={styles.addressField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              자택 주소 <span className={styles.inlineRequiredMark}>*</span>
            </PFText>
            <div className={styles.inlineRow}>
              <PFTextInput
                size="xlarge"
                placeholder="주소를 검색해 주세요"
                value={values.homeAddress}
                readOnly
                onClick={() => setIsAddressModalOpen(true)}
              />
              <PFButton
                size="xlarge"
                variant="secondary"
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
              >
                주소 검색
              </PFButton>
            </div>
            <PFTextInput
              size="xlarge"
              placeholder="상세주소를 입력해 주세요"
              value={values.homeAddressDetail}
              onValueChange={value => patch({ homeAddressDetail: value })}
            />
          </div>

          <div className={styles.settlementAccountField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              정산 계좌 정보
            </PFText>
            <PFTextInput
              size="xlarge"
              placeholder="은행명"
              value={values.bankName}
              onValueChange={value => patch({ bankName: value })}
              required
            />
            <div className={styles.settlementAccountSplit}>
              <PFTextInput
                size="xlarge"
                placeholder="계좌번호"
                value={values.accountNumber}
                onValueChange={value => patch({ accountNumber: value })}
                required
              />
              <PFTextInput
                size="xlarge"
                placeholder="예금주"
                value={values.accountHolder}
                onValueChange={value => patch({ accountHolder: value })}
                required
              />
            </div>
          </div>

          <div className={styles.schoolStatusField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              사업소득자 여부
            </PFText>
            <div className={styles.schoolStatusOptions}>
              {BUSINESS_INCOME_OPTIONS.map(option => (
                <PFButton
                  key={option.value}
                  size="xlarge"
                  variant="tertiary"
                  selected={values.isBusinessIncome === option.value}
                  width="100%"
                  type="button"
                  onClick={() => patch({ isBusinessIncome: option.value })}
                >
                  {option.label}
                </PFButton>
              ))}
            </div>
          </div>

          <PFTextInput
            size="xlarge"
            label="한 줄 소개"
            placeholder="한 줄 소개 멘트"
            value={values.oneLineIntro}
            onValueChange={value => patch({ oneLineIntro: value })}
            required
          />
        </div>

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
            void handleSave()
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
          patch({
            homeAddress: selection.address,
            homeAddressDetail: values.homeAddressDetail,
          })
          setPostalCode(selection.postalCode ?? '')
          setRegionSido(selection.regionSido ?? '')
          setRegionSigungu(selection.regionSigungu ?? '')
          setIsAddressModalOpen(false)
        }}
      />

      <PFAlertModal
        open={alertMessage != null}
        title="안내"
        description={alertMessage ?? undefined}
        onConfirm={() => setAlertMessage(null)}
      />
    </>
  )

  if (embedded) {
    return <div className={styles.inlineEdit}>{formContent}</div>
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <PFText as="h2" typo="form-section-title" color="black" className={styles.sectionTitle}>
          기본 정보
        </PFText>
        {formContent}
      </section>
    </div>
  )
}

/** 로컬 mock 저장 시 프로필 스냅샷 병합 */
export function mergeInstructorBasicEditToSettingsProfile(
  previous: SettingsProfileInput,
  values: InstructorSharedProfileFormValues,
): SettingsProfileInput {
  const cmsProfile = mapInstructorFormValuesToCmsProfile(values)
  return {
    ...previous,
    phone: values.contact.replace(/\D/g, '').length > 0 ? values.contact : previous.phone,
    address: values.homeAddress.trim() || previous.address,
    addressDetail: values.homeAddressDetail.trim() || previous.addressDetail,
    affiliationName:
      values.memberType === 'school_teacher'
        ? values.schoolName.trim() || previous.affiliationName
        : values.affiliationNone
          ? undefined
          : values.affiliationName.trim() || previous.affiliationName,
    schoolName: values.memberType === 'school_teacher' ? values.schoolName : previous.schoolName,
    teacherEmploymentStatus:
      values.memberType === 'school_teacher'
        ? values.employmentStatus || previous.teacherEmploymentStatus
        : previous.teacherEmploymentStatus,
    instructorProfile: {
      profile: cmsProfile,
      settlement: mapInstructorFormValuesToPortalSettlement(values),
    },
  }
}
