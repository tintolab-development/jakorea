import { useCallback, useEffect, useState } from 'react'
import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
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
} from '@/features/auth/sign-in'
import { AddressSearchModal, SchoolSearchModal, type SelectedSchool } from '@/features/auth/sign-up'
import {
  mapInstructorFormValuesToCmsProfile,
  mapInstructorFormValuesToPortalSettlement,
} from '@/features/mypage/instructor-apply/api/map-create-request'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import { EMPTY_SETTINGS_VALUE } from '../../lib/constants'
import type { InstructorBasicSettingsAddressMeta } from '../../lib/map-instructor-basic-profile-update'
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

export type SettingsInstructorBasicFieldsProps = {
  profile: SettingsProfileInput
  values: InstructorSharedProfileFormValues
  onPatch: (partial: Partial<InstructorSharedProfileFormValues>) => void
  onAddressMetaChange: (meta: InstructorBasicSettingsAddressMeta) => void
  /** 휴대폰 재인증 진행 여부 — 저장 버튼 잠금용 */
  onReverifyingChange?: (busy: boolean) => void
  /**
   * 교사 겸 강사 — 소속/학교 검색. 교사 가입 + 강사 신청이므로 부모가 `memberType=school_teacher`로
   * 넘기며, 재직 현황은 교사 경로로 표시됨 (자유 입력 소속 없음)
   */
  isDual?: boolean
  onSchoolSelect?: (school: SelectedSchool) => void
}

/** 강사 회원정보 설정 — 기본 정보 필드 (값은 부모가 소유) */
export function SettingsInstructorBasicFields({
  profile,
  values,
  onPatch: patch,
  onAddressMetaChange,
  onReverifyingChange,
  isDual = false,
  onSchoolSelect,
}: SettingsInstructorBasicFieldsProps) {
  const [phone, setPhone] = useState(profile.phone?.trim() ?? '')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isSchoolSearchOpen, setIsSchoolSearchOpen] = useState(false)
  const [phoneError, setPhoneError] = useState<string | undefined>()
  const { mutateAsync: confirmPhone, isPending: isConfirmingPhone } =
    usePortalPhoneIdentityConfirmMutation()

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

  useEffect(() => {
    onReverifyingChange?.(isReverifying)
  }, [isReverifying, onReverifyingChange])

  const handleReverify = () => {
    if (isReverifying) return
    setPhoneError(undefined)
    resetError()
    if (isRemoteApiConfigured()) {
      markMypagePhoneIdentityConfirmPending()
    }
    void verify()
  }

  const isSchoolTeacher = values.memberType === 'school_teacher'

  return (
    <>
        <div className={styles.fields}>
          <PFTextInput
            size="xlarge"
            label="이름"
            value={displayName === EMPTY_SETTINGS_VALUE ? '' : displayName}
            disabled
          />

          <div className={styles.addressField}>
            <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
              휴대폰 번호
            </PFText>
            <div className={styles.inlineRow}>
              <PFTextInput
                size="xlarge"
                value={displayPhone === EMPTY_SETTINGS_VALUE ? '' : displayPhone}
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
            disabled
          />

          {isDual ? (
            <div className={styles.addressField}>
              <PFText as="span" typo="label-md" color="inherit" className={styles.fieldLabel}>
                소속/학교 <span className={styles.inlineRequiredMark}>*</span>
              </PFText>
              <div className={styles.inlineRow}>
                <PFTextInput
                  size="xlarge"
                  placeholder="검색으로 학교를 선택해 주세요"
                  value={values.schoolName}
                  readOnly
                  onClick={() => setIsSchoolSearchOpen(true)}
                />
                <PFButton
                  size="xlarge"
                  variant="secondary"
                  type="button"
                  onClick={() => setIsSchoolSearchOpen(true)}
                >
                  검색
                </PFButton>
              </div>
            </div>
          ) : isSchoolTeacher ? (
            <PFTextInput size="xlarge" label="소속" value={values.schoolName} disabled />
          ) : null}
          {isSchoolTeacher ? (
            <>
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

      <AddressSearchModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={selection => {
          patch({
            homeAddress: selection.address,
            homeAddressDetail: values.homeAddressDetail,
          })
          onAddressMetaChange({
            postalCode: selection.postalCode ?? '',
            regionSido: selection.regionSido ?? '',
            regionSigungu: selection.regionSigungu ?? '',
          })
          setIsAddressModalOpen(false)
        }}
      />

      {isDual ? (
        <SchoolSearchModal
          open={isSchoolSearchOpen}
          onClose={() => setIsSchoolSearchOpen(false)}
          onSelect={school => {
            patch({ schoolName: school.name })
            onSchoolSelect?.(school)
            setIsSchoolSearchOpen(false)
          }}
        />
      ) : null}
    </>
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
