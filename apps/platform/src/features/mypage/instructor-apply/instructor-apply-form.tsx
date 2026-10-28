import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
import {
  CONSENT_VALUE,
  type InstructorConsentDocumentKey,
} from '@jakorea/domain/instructor/consent'
import {
  getInstructorConsentDocumentItems,
  getInstructorFormLayout,
  getInstructorFormSectionDisplayTitle,
  getInstructorRequiredConsentAgreeKeys,
} from '@jakorea/domain/instructor/form-layout'
import {
  INSTRUCTOR_FORM_PLACEHOLDERS as PH,
  INSTRUCTOR_FORM_SECTION_DESCRIPTIONS,
} from '@jakorea/domain/instructor/form-copy'
import { GENDER_OPTIONS } from '@jakorea/domain/instructor/gender'
import {
  INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { isValidEmail, parseBirthDate } from '@/features/auth/sign-up'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import { queryRetryDelay, shouldRetryQuery } from '@/shared/lib/query-retry'
import {
  PFAlertModal,
  PFButton,
  PFCheckbox,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFieldValueText,
  PFFormHomeAddressFields,
  PFFormInlineSeparatedFields,
  PFFormSection,
  PFLoadingSpinner,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { getInstructorApplyApiErrorMessage } from './api/get-instructor-apply-api-error-message'
import { mapInstructorApplyFormToCreateRequest } from './api/map-create-request'
import { resolveInstructorApplyTermsAgreementVersions } from './api/resolve-terms-agreement-versions'
import { resolveInstructorEmploymentStatusToSync } from './api/resolve-employment-status-sync'
import { useCreateInstructorRoleRequestMutation } from './api/use-create-instructor-role-request-mutation'
import {
  InstructorAwardProfileFields,
  InstructorCareerProfileFields,
  InstructorEducationProfileFields,
  InstructorFreeWriteProfileFields,
  InstructorJaProfileFields,
  InstructorLicenseProfileFields,
} from './instructor-profile-fields'
import {
  getInstructorApplyConsentPath,
  INSTRUCTOR_APPLY_CONSENT_KEYS,
  type InstructorApplyConsentKey,
} from './consent/catalog'
import { formatInstructorConsentAgreedAtLabel } from './lib/format-instructor-apply-datetime'
import { instructorApplyPath } from '../lib/constants'
import { loadInstructorApplyFormDraft, saveInstructorApplyFormDraft } from './consent/form-persist'
import { clearInstructorApplySessionCache } from './lib/instructor-apply-session-cache'
import { resolveInstructorApplySubmittedSnapshot } from './lib/resolve-submitted-snapshot'
import { useCurrentInstructorRoleRequestDetailQuery } from './api/use-current-instructor-role-request-detail-query'
import { InstructorApplyRejectedBanner } from './instructor-apply-rejected-banner'
import type { InstructorRoleRequestSummary } from './api/types'
import {
  applyLockedBasicToInstructorForm,
  resolveInstructorApplyHomeAddressLock,
  type InstructorApplyLockedBasicInfo,
} from './map-locked-basic-info'
import { fetchPortalConsents } from '../settings/api/consents'
import { mapPortalConsentsToInstructorApplyValues } from './lib/map-portal-consents-to-apply'
import { useInstructorApplyConsentDocumentPreview } from './lib/use-instructor-apply-consent-document-preview'
import { ConsentDocumentPreviewOverlay } from '../settings/ui/consent-document-preview-overlay'
import { TeacherAffiliationDisplay } from './ui/teacher-affiliation-display'
import styles from './instructor-apply-form.module.css'

const REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE = '필수 항목을 모두 작성해주세요'
const FORM_SURFACE = 'platformApply' as const
const FORM_LAYOUT = getInstructorFormLayout(FORM_SURFACE)
const CONSENT_DOCUMENT_ITEMS = getInstructorConsentDocumentItems(FORM_SURFACE)
const REQUIRED_CONSENT_AGREE_KEYS = getInstructorRequiredConsentAgreeKeys(FORM_SURFACE)

function chunkPairs<T>(items: readonly T[]): T[][] {
  const rows: T[][] = []
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2) as T[])
  }
  return rows
}

const CONSENT_DOCUMENT_ROWS = chunkPairs(CONSENT_DOCUMENT_ITEMS)

const SECTION_TITLE = {
  consent: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'consent'),
  basic: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'basic'),
  education: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'education'),
  career: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'career'),
  ja: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'ja'),
  license: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'license'),
  award: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'award'),
  freeWrite: getInstructorFormSectionDisplayTitle(FORM_SURFACE, 'freeWrite'),
} as const
const LOCKED_BASIC_KEYS = [
  'name',
  'gender',
  'birthDate',
  'contact',
  'email',
  'memberType',
  'schoolName',
  'affiliationName',
  'affiliationNone',
] as const satisfies ReadonlyArray<keyof InstructorApplyLockedBasicInfo>

function shouldPreserveEmploymentStatus(
  draft: InstructorSharedProfileFormValues | null,
): boolean {
  return draft?.memberType === 'school_teacher' && Boolean(draft.employmentStatus)
}

type AlertState = {
  title: string
  description?: string
} | null

function RadioGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled = false,
}: {
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (next: T) => void
  disabled?: boolean
}) {
  return (
    <div className={styles.radioGroup} role="radiogroup" aria-label={name}>
      {options.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          <PFText
            as="span"
            typo="bd-md-rg"
            color={value === option.value ? 'primary-500' : 'black'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}

function HomeAddressFieldRow({
  roadValue,
  detailValue,
  roadDisabled,
  detailDisabled,
  onRoadChange,
  onDetailChange,
}: {
  roadValue: string
  detailValue: string
  roadDisabled: boolean
  detailDisabled: boolean
  onRoadChange: (value: string) => void
  onDetailChange: (value: string) => void
}) {
  return (
    <PFFormFieldRow type="single">
      <PFFormField label="자택 주소지">
        <PFFormHomeAddressFields
          roadValue={roadValue}
          detailValue={detailValue}
          onRoadChange={onRoadChange}
          onDetailChange={onDetailChange}
          roadPlaceholder={PH.homeAddress}
          detailPlaceholder={PH.homeAddressDetail}
          roadDisabled={roadDisabled}
          detailDisabled={detailDisabled}
        />
      </PFFormField>
    </PFFormFieldRow>
  )
}

export type InstructorApplyFormProps = {
  onSubmitSuccess: () => void
  /** 회원가입(포털 프로필) 기본정보 — 해당 항목은 비활성·고정 노출 */
  lockedBasic: InstructorApplyLockedBasicInfo
  /** 반려 후 재신청 — 이전 제출 상세로 편집 폼을 시드 */
  seedFromSubmittedRequest?: boolean
  /** 재신청 편집 화면에도 반려 안내 배너를 띄울 때 */
  rejectedSummary?: InstructorRoleRequestSummary | null
}

export function InstructorApplyForm({
  onSubmitSuccess,
  lockedBasic,
  seedFromSubmittedRequest = false,
  rejectedSummary,
}: InstructorApplyFormProps) {
  const navigate = useNavigate()
  const employmentTouchedRef = useRef(false)
  const hadDraftOnMountRef = useRef(loadInstructorApplyFormDraft() != null)
  const seededFromSubmittedRef = useRef(hadDraftOnMountRef.current)
  const detailQuery = useCurrentInstructorRoleRequestDetailQuery({
    enabled: seedFromSubmittedRequest && !hadDraftOnMountRef.current,
  })

  const [values, setValues] = useState<InstructorSharedProfileFormValues>(() => {
    const draft = loadInstructorApplyFormDraft()
    if (seedFromSubmittedRequest && !draft && detailQuery.data) {
      const snapshot = resolveInstructorApplySubmittedSnapshot({
        detail: detailQuery.data,
        lockedBasic,
      })
      if (snapshot) {
        seededFromSubmittedRef.current = true
        const preserveEmploymentStatus = shouldPreserveEmploymentStatus(snapshot.values)
        if (preserveEmploymentStatus) {
          employmentTouchedRef.current = true
        }
        return applyLockedBasicToInstructorForm(
          snapshot.values,
          lockedBasic,
          preserveEmploymentStatus,
        )
      }
    }
    const preserveEmploymentStatus = shouldPreserveEmploymentStatus(draft)
    if (preserveEmploymentStatus) {
      employmentTouchedRef.current = true
    }
    return applyLockedBasicToInstructorForm(
      draft ?? INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
      lockedBasic,
      preserveEmploymentStatus,
    )
  })
  const [consentAgreedAt, setConsentAgreedAt] = useState<
    Partial<Record<InstructorApplyConsentKey, string>>
  >(() => {
    if (!seedFromSubmittedRequest || hadDraftOnMountRef.current || !detailQuery.data) {
      return {}
    }
    return (
      resolveInstructorApplySubmittedSnapshot({
        detail: detailQuery.data,
        lockedBasic,
      })?.consentAgreedAt ?? {}
    )
  })
  const [submittedSeedApplied, setSubmittedSeedApplied] = useState(
    () => !seedFromSubmittedRequest || hadDraftOnMountRef.current || seededFromSubmittedRef.current,
  )
  const [alert, setAlert] = useState<AlertState>(null)
  const [submitting, setSubmitting] = useState(false)
  const createMutation = useCreateInstructorRoleRequestMutation()
  const useRemoteSubmit = isRemoteApiConfigured() && Boolean(getAccessToken())
  const consentsQuery = useQuery({
    queryKey: platformQueryKeys.mypage.consents(),
    queryFn: ({ signal }) => fetchPortalConsents(signal),
    enabled: useRemoteSubmit,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  })
  const isSubmitting = submitting || createMutation.isPending
  const homeAddressLock = resolveInstructorApplyHomeAddressLock(lockedBasic)

  useEffect(() => {
    setValues(prev =>
      applyLockedBasicToInstructorForm(prev, lockedBasic, employmentTouchedRef.current),
    )
  }, [lockedBasic])

  useEffect(() => {
    if (!seedFromSubmittedRequest || seededFromSubmittedRef.current) return
    if (detailQuery.isPending && detailQuery.data === undefined) return

    const snapshot = resolveInstructorApplySubmittedSnapshot({
      detail: detailQuery.data,
      lockedBasic,
    })
    seededFromSubmittedRef.current = true
    setSubmittedSeedApplied(true)
    if (!snapshot) return

    const preserveEmploymentStatus = shouldPreserveEmploymentStatus(snapshot.values)
    if (preserveEmploymentStatus) {
      employmentTouchedRef.current = true
    }
    setValues(
      applyLockedBasicToInstructorForm(snapshot.values, lockedBasic, preserveEmploymentStatus),
    )
    setConsentAgreedAt(snapshot.consentAgreedAt)
  }, [seedFromSubmittedRequest, detailQuery.isPending, detailQuery.data, lockedBasic])

  useEffect(() => {
    if (!useRemoteSubmit || !consentsQuery.isSuccess || consentsQuery.isFetching) return
    if (seedFromSubmittedRequest && !submittedSeedApplied) return
    const mapped = mapPortalConsentsToInstructorApplyValues(consentsQuery.data)
    setConsentAgreedAt(mapped.agreedAt)
    setValues(prev => {
      const unchanged = INSTRUCTOR_APPLY_CONSENT_KEYS.every(
        key => prev[key] === mapped.values[key],
      )
      if (unchanged) return prev
      return { ...prev, ...mapped.values }
    })
  }, [
    useRemoteSubmit,
    consentsQuery.isSuccess,
    consentsQuery.isFetching,
    consentsQuery.data,
    seedFromSubmittedRequest,
    submittedSeedApplied,
  ])

  useEffect(() => {
    if (seedFromSubmittedRequest && !submittedSeedApplied) return
    saveInstructorApplyFormDraft(values)
  }, [values, seedFromSubmittedRequest, submittedSeedApplied])

  const patch = <K extends keyof InstructorSharedProfileFormValues>(
    key: K,
    next: InstructorSharedProfileFormValues[K]
  ) => {
    if ((LOCKED_BASIC_KEYS as readonly string[]).includes(key)) return
    if (key === 'homeAddress' && homeAddressLock.roadLocked) return
    if (key === 'homeAddressDetail' && homeAddressLock.detailLocked) return
    setValues(prev => ({ ...prev, [key]: next }))
  }

  const handleEmploymentStatusChange = (
    next: InstructorSharedProfileFormValues['employmentStatus'],
  ) => {
    employmentTouchedRef.current = true
    setValues(prev => ({ ...prev, employmentStatus: next }))
  }

  const formReturnTo = instructorApplyPath({ reapply: seedFromSubmittedRequest })

  const {
    previewItem,
    fallbackDraft,
    fallbackPaymentBasicInfo,
    fallbackSignatureImageSrc,
    isRemoteSession: isConsentPreviewRemote,
    openPreview,
    closePreview,
  } = useInstructorApplyConsentDocumentPreview()

  const handleConsentDocumentWrite = (key: InstructorConsentDocumentKey) => {
    saveInstructorApplyFormDraft(values)
    const returnTo = encodeURIComponent(formReturnTo)
    navigate(`${getInstructorApplyConsentPath(key)}?returnTo=${returnTo}`)
  }

  const handleConsentDocumentView = (key: InstructorConsentDocumentKey) => {
    openPreview(key)
  }

  const handleSubmit = () => {
    const { missingRequired, formatMessages } = collectInstructorRegisterValidation(
      values,
      {
        isBirthDateIncomplete: value => {
          const digits = value.replace(/\D/g, '')
          return digits.length > 0 && digits.length < 8
        },
        isBirthDateValid: value => parseBirthDate(value) != null,
        isEmailValid: isValidEmail,
      },
      {
        requiredConsentAgreeKeys: [...REQUIRED_CONSENT_AGREE_KEYS],
        requireEducation: true,
        requireCareer: true,
      }
    )

    if (missingRequired) {
      setAlert({ title: '안내', description: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE })
      return
    }
    if (formatMessages.length > 0) {
      setAlert({ title: '안내', description: formatMessages[0] })
      return
    }

    setSubmitting(true)

    if (!useRemoteSubmit) {
      window.setTimeout(() => {
        setSubmitting(false)
        clearInstructorApplySessionCache()
        onSubmitSuccess()
      }, 300)
      return
    }

    void (async () => {
      try {
        const mapped = mapInstructorApplyFormToCreateRequest(values)
        const termsAgreements = await resolveInstructorApplyTermsAgreementVersions(
          mapped.termsAgreements,
        )
        const employmentStatusToSync = resolveInstructorEmploymentStatusToSync(
          values.memberType,
          values.employmentStatus,
          lockedBasic.employmentStatus,
        )
        await createMutation.mutateAsync({
          body: { ...mapped, termsAgreements },
          employmentStatusToSync,
        })
        setSubmitting(false)
        clearInstructorApplySessionCache()
        onSubmitSuccess()
      } catch (error) {
        setSubmitting(false)
        setAlert({
          title: '안내',
          description: getInstructorApplyApiErrorMessage(
            error,
            '강사 신청을 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          ),
        })
      }
    })()
  }

  const rejectedBanner = rejectedSummary ? (
    <InstructorApplyRejectedBanner summary={rejectedSummary} />
  ) : null

  if (seedFromSubmittedRequest && !submittedSeedApplied) {
    return (
      <>
        {rejectedBanner}
        <PFLoadingSpinner centered label="이전 신청 내용을 불러오는 중" />
      </>
    )
  }

  return (
    <>
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        {rejectedBanner}
        <PFFormSection
          id="instructor-apply-consent"
          title={SECTION_TITLE.consent}
          description={FORM_LAYOUT.consent.description}
          footer={FORM_LAYOUT.consent.footerText}
          required={FORM_LAYOUT.consent.allItemsRequired}
        >
          <PFFormFieldTable>
            {CONSENT_DOCUMENT_ROWS.map(row => (
              <PFFormFieldRow key={row.map(item => item.key).join('-')} type="double">
                {row.map(item => {
                  const agreed = values[item.key] === CONSENT_VALUE.agree
                  const agreedAt = consentAgreedAt[item.key as InstructorApplyConsentKey]
                  return (
                    <PFFormField
                      key={item.key}
                      label={item.label}
                      labelWidth="wide"
                      required={!FORM_LAYOUT.consent.allItemsRequired && item.required}
                    >
                      <PFFormInlineSeparatedFields>
                        <PFFormFieldValueText>{agreed ? '동의' : '미동의'}</PFFormFieldValueText>
                        {agreed ? (
                          <PFButton
                            type="button"
                            variant="secondary"
                            size="formPage"
                            onClick={() => handleConsentDocumentView(item.key)}
                          >
                            동의서 보기
                          </PFButton>
                        ) : (
                          <PFButton
                            type="button"
                            variant="secondary"
                            size="formPage"
                            onClick={() => handleConsentDocumentWrite(item.key)}
                          >
                            동의서 작성
                          </PFButton>
                        )}
                        {agreed && agreedAt ? (
                          <PFText as="span" typo="bd-md-rg" color="neutral-cool-600">
                            {formatInstructorConsentAgreedAtLabel(agreedAt)}
                          </PFText>
                        ) : null}
                      </PFFormInlineSeparatedFields>
                    </PFFormField>
                  )
                })}
              </PFFormFieldRow>
            ))}
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-basic" title={SECTION_TITLE.basic} required>
          <PFFormFieldTable>
            <PFFormFieldRow type="double">
              <PFFormField label="성명">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="200px"
                  placeholder={PH.name}
                  disabled
                  value={values.name}
                  onValueChange={value => patch('name', value)}
                />
              </PFFormField>
              <PFFormField label="성별 및 생년월일">
                <PFFormInlineSeparatedFields>
                  <RadioGroup
                    name="gender"
                    value={values.gender}
                    options={GENDER_OPTIONS}
                    disabled
                    onChange={value => patch('gender', value)}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width="180px"
                    placeholder={PH.birthDate}
                    disabled
                    value={values.birthDate}
                    onValueChange={value => patch('birthDate', value)}
                  />
                </PFFormInlineSeparatedFields>
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="double">
              <PFFormField label="연락처">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="200px"
                  placeholder={PH.contact}
                  disabled
                  value={formatKoreanPhoneNumber(values.contact)}
                  onValueChange={value => patch('contact', value)}
                />
              </PFFormField>
              <PFFormField label="이메일">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="200px"
                  placeholder={PH.email}
                  disabled
                  value={values.email}
                  onValueChange={value => patch('email', value)}
                />
              </PFFormField>
            </PFFormFieldRow>
            {values.memberType === 'school_teacher' ? (
              <HomeAddressFieldRow
                roadValue={values.homeAddress}
                detailValue={values.homeAddressDetail}
                roadDisabled={homeAddressLock.roadLocked}
                detailDisabled={homeAddressLock.detailLocked}
                onRoadChange={value => patch('homeAddress', value)}
                onDetailChange={value => patch('homeAddressDetail', value)}
              />
            ) : null}
            <PFFormFieldRow type="single">
              <PFFormField label="소속">
                {values.memberType === 'school_teacher' ? (
                  <TeacherAffiliationDisplay
                    schoolName={values.schoolName}
                    employmentStatus={values.employmentStatus}
                    onEmploymentStatusChange={handleEmploymentStatusChange}
                  />
                ) : (
                  <PFFormInlineSeparatedFields>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width={200}
                      placeholder={PH.affiliationName}
                      disabled
                      value={values.affiliationName}
                      onValueChange={value => patch('affiliationName', value)}
                    />
                    <PFCheckbox
                      size="large"
                      checked={values.affiliationNone}
                      disabled
                      onCheckedChange={checked => {
                        setValues(prev => ({
                          ...prev,
                          affiliationNone: checked,
                          affiliationName: checked ? '' : prev.affiliationName,
                        }))
                      }}
                    >
                      소속 없음
                    </PFCheckbox>
                  </PFFormInlineSeparatedFields>
                )}
              </PFFormField>
            </PFFormFieldRow>
            {values.memberType === 'school_teacher' ? null : (
              <HomeAddressFieldRow
                roadValue={values.homeAddress}
                detailValue={values.homeAddressDetail}
                roadDisabled={homeAddressLock.roadLocked}
                detailDisabled={homeAddressLock.detailLocked}
                onRoadChange={value => patch('homeAddress', value)}
                onDetailChange={value => patch('homeAddressDetail', value)}
              />
            )}
            <PFFormFieldRow type="single">
              <PFFormField label="강사 경력">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="200px"
                  placeholder={PH.instructorCareer}
                  value={values.instructorCareer}
                  onValueChange={value => patch('instructorCareer', value)}
                />
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="single">
              <PFFormField label="정산 계좌 정보">
                <PFFormInlineSeparatedFields>
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={120}
                    placeholder={PH.bankName}
                    value={values.bankName}
                    onValueChange={value => patch('bankName', value)}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={240}
                    placeholder={PH.accountNumber}
                    value={values.accountNumber}
                    onValueChange={value => patch('accountNumber', value)}
                  />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={240}
                    placeholder={PH.accountHolder}
                    value={values.accountHolder}
                    onValueChange={value => patch('accountHolder', value)}
                  />
                </PFFormInlineSeparatedFields>
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="single">
              <PFFormField label="사업소득자 여부">
                <RadioGroup
                  name="isBusinessIncome"
                  value={values.isBusinessIncome}
                  options={BUSINESS_INCOME_OPTIONS}
                  onChange={value => patch('isBusinessIncome', value)}
                />
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="single">
              <PFFormField label="한 줄 소개">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="100%"
                  placeholder={PH.oneLineIntro}
                  value={values.oneLineIntro}
                  onValueChange={value => patch('oneLineIntro', value)}
                />
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection
          id="instructor-apply-education"
          title={SECTION_TITLE.education}
          description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.education}
          required
        >
          <InstructorEducationProfileFields values={values} onValuesChange={setValues} />
        </PFFormSection>

        <PFFormSection id="instructor-apply-career" title={SECTION_TITLE.career} required>
          <InstructorCareerProfileFields values={values} onValuesChange={setValues} />
        </PFFormSection>

        <PFFormSection id="instructor-apply-ja" title={SECTION_TITLE.ja}>
          <InstructorJaProfileFields values={values} onValuesChange={setValues} />
        </PFFormSection>

        <PFFormSection id="instructor-apply-license" title={SECTION_TITLE.license}>
          <InstructorLicenseProfileFields values={values} onValuesChange={setValues} />
        </PFFormSection>

        <PFFormSection id="instructor-apply-award" title={SECTION_TITLE.award}>
          <InstructorAwardProfileFields values={values} onValuesChange={setValues} />
        </PFFormSection>

        <PFFormSection
          id="instructor-apply-free-write"
          title={SECTION_TITLE.freeWrite}
          description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.freeWrite}
        >
          <InstructorFreeWriteProfileFields values={values} onValuesChange={setValues} />
        </PFFormSection>

        <div className={styles.actions}>
          <PFButton size="xlarge" width={240} type="submit" disabled={isSubmitting}>
            {isSubmitting ? '신청 중…' : '강사 신청하기'}
          </PFButton>
        </div>
      </form>

      <PFAlertModal
        open={alert != null}
        title={alert?.title ?? ''}
        description={alert?.description}
        onConfirm={() => setAlert(null)}
      />

      <ConsentDocumentPreviewOverlay
        open={previewItem != null}
        item={previewItem}
        isRemoteSession={isConsentPreviewRemote}
        fallbackDraft={fallbackDraft}
        fallbackPaymentBasicInfo={fallbackPaymentBasicInfo}
        fallbackSignatureImageSrc={fallbackSignatureImageSrc}
        onClose={closePreview}
      />
    </>
  )
}
