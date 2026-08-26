import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
import { CAREER_LEVEL_OPTIONS } from '@jakorea/domain/instructor/career-level'
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
  EDUCATION_DEGREE_OPTIONS,
  EDUCATION_DETAIL_OPTIONS,
  EDUCATION_SCHOOL_TYPE_OPTIONS,
  EDUCATION_STATUS_OPTIONS,
  isEducationDetailKey,
  orderEducationDetailKeys,
  resolveAvailableEducationDetailKeys,
  type EducationDetailKey,
} from '@jakorea/domain/instructor/education-options'
import { SCHOOL_TEACHER_EMPLOYMENT_STATUS_FORM_OPTIONS } from '@jakorea/domain/instructor/employment-status'
import {
  INSTRUCTOR_FORM_PLACEHOLDERS as PH,
  INSTRUCTOR_FORM_SECTION_DESCRIPTIONS,
} from '@jakorea/domain/instructor/form-copy'
import { INSTRUCTOR_FREE_WRITE_ITEMS } from '@jakorea/domain/instructor/free-write'
import { GENDER_OPTIONS } from '@jakorea/domain/instructor/gender'
import {
  EMPTY_INSTRUCTOR_CAREER,
  EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW,
  EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW,
  EMPTY_INSTRUCTOR_JA_KOREA_ROW,
  EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW,
  INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { isValidEmail, parseBirthDate } from '@/features/auth/sign-up'
import {
  PFAlertModal,
  PFButton,
  PFCheckbox,
  PFCircleAddButton,
  PFDateInput,
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFieldValueText,
  PFFormHomeAddressFields,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFFormPeriodPair,
  PFFormPeriodTilde,
  PFFormSection,
  PFItemDeleteButton,
  PFSelect,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { getInstructorApplyApiErrorMessage } from './api/get-instructor-apply-api-error-message'
import { mapInstructorApplyFormToCreateRequest } from './api/map-create-request'
import { useCreateInstructorRoleRequestMutation } from './api/use-create-instructor-role-request-mutation'
import { EducationSchoolNameField } from './education-school-name-field'
import { getInstructorApplyConsentPath } from './consent/catalog'
import { loadInstructorApplyFormDraft, saveInstructorApplyFormDraft } from './consent/form-persist'
import type { InstructorApplyLockedBasicInfo } from './map-locked-basic-info'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
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
  'homeAddress',
  'homeAddressDetail',
  'memberType',
  'schoolName',
  'employmentStatus',
  'affiliationName',
  'affiliationNone',
] as const satisfies ReadonlyArray<keyof InstructorApplyLockedBasicInfo>

function applyLockedBasic(
  base: InstructorSharedProfileFormValues,
  locked: InstructorApplyLockedBasicInfo
): InstructorSharedProfileFormValues {
  return {
    ...base,
    name: locked.name,
    gender: locked.gender || base.gender,
    birthDate: locked.birthDate,
    contact: locked.contact,
    email: locked.email,
    homeAddress: locked.homeAddress,
    homeAddressDetail: locked.homeAddressDetail,
    memberType: locked.memberType,
    schoolName: locked.memberType === 'school_teacher' ? locked.schoolName : '',
    employmentStatus: locked.memberType === 'school_teacher' ? locked.employmentStatus : '',
    affiliationName: locked.memberType === 'general' ? locked.affiliationName : '',
    affiliationNone: locked.memberType === 'general' ? locked.affiliationNone : false,
  }
}

type AlertState = {
  title: string
  description?: string
} | null

function toSelectOptions(
  options: readonly { value: string; label: string }[]
): { value: string; label: string }[] {
  return options.map(option => ({ value: option.value, label: option.label }))
}

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

function ListRowActions({
  isFirst,
  onAdd,
  onRemove,
}: {
  isFirst: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  return isFirst ? (
    <PFCircleAddButton onClick={onAdd} aria-label="항목 추가" />
  ) : (
    <PFItemDeleteButton onClick={onRemove} aria-label="항목 삭제" />
  )
}

export type InstructorApplyFormProps = {
  onSubmitSuccess: () => void
  /** 회원가입(포털 프로필) 기본정보 — 해당 항목은 비활성·고정 노출 */
  lockedBasic: InstructorApplyLockedBasicInfo
}

export function InstructorApplyForm({ onSubmitSuccess, lockedBasic }: InstructorApplyFormProps) {
  const navigate = useNavigate()
  const [values, setValues] = useState<InstructorSharedProfileFormValues>(() =>
    applyLockedBasic(
      loadInstructorApplyFormDraft() ?? INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
      lockedBasic
    )
  )
  const [alert, setAlert] = useState<AlertState>(null)
  const [submitting, setSubmitting] = useState(false)
  const createMutation = useCreateInstructorRoleRequestMutation()
  const useRemoteSubmit = isRemoteApiConfigured() && Boolean(getAccessToken())
  const isSubmitting = submitting || createMutation.isPending

  useEffect(() => {
    setValues(prev => applyLockedBasic(prev, lockedBasic))
  }, [lockedBasic])

  useEffect(() => {
    saveInstructorApplyFormDraft(values)
  }, [values])

  const availableEducationKeys = useMemo(
    () => resolveAvailableEducationDetailKeys(values.eduSchoolType),
    [values.eduSchoolType]
  )
  const lockedEducationKey = isEducationDetailKey(values.eduSchoolType)
    ? values.eduSchoolType
    : null
  const finalEducationEnrolled = values.eduStatus === 'enrolled'

  const patch = <K extends keyof InstructorSharedProfileFormValues>(
    key: K,
    next: InstructorSharedProfileFormValues[K]
  ) => {
    if ((LOCKED_BASIC_KEYS as readonly string[]).includes(key)) return
    setValues(prev => ({ ...prev, [key]: next }))
  }

  const handleEduSchoolTypeChange = (eduSchoolType: string) => {
    const available = resolveAvailableEducationDetailKeys(eduSchoolType)
    const locked = isEducationDetailKey(eduSchoolType) ? eduSchoolType : null
    setValues(prev => ({
      ...prev,
      eduSchoolType,
      educationDetailKeys: locked
        ? orderEducationDetailKeys([
            ...prev.educationDetailKeys.filter(key => available.includes(key)),
            locked,
          ])
        : [],
    }))
  }

  const toggleEducationDetail = (key: EducationDetailKey) => {
    if (key === values.eduSchoolType) return
    setValues(prev => {
      const has = prev.educationDetailKeys.includes(key)
      const nextKeys = has
        ? prev.educationDetailKeys.filter(item => item !== key)
        : [...prev.educationDetailKeys, key]
      return {
        ...prev,
        educationDetailKeys: orderEducationDetailKeys(nextKeys),
      }
    })
  }

  const handleConsentDocumentWrite = (key: InstructorConsentDocumentKey) => {
    saveInstructorApplyFormDraft(values)
    navigate(getInstructorApplyConsentPath(key))
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
        requireFreeWrite: true,
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
        onSubmitSuccess()
      }, 300)
      return
    }

    const body = mapInstructorApplyFormToCreateRequest(values)
    createMutation.mutate(body, {
      onSuccess: () => {
        setSubmitting(false)
        onSubmitSuccess()
      },
      onError: error => {
        setSubmitting(false)
        setAlert({
          title: '안내',
          description: getInstructorApplyApiErrorMessage(
            error,
            '강사 신청을 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          ),
        })
      },
    })
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
                  return (
                    <PFFormField
                      key={item.key}
                      label={item.label}
                      labelWidth="wide"
                      required={!FORM_LAYOUT.consent.allItemsRequired && item.required}
                    >
                      <PFFormInlineRow>
                        <PFFormInlineSegment>
                          <PFFormFieldValueText>{agreed ? '동의' : '미동의'}</PFFormFieldValueText>
                        </PFFormInlineSegment>
                        <PFFormInlineSeparator />
                        <PFFormInlineSegment>
                          <PFButton
                            type="button"
                            variant="secondary"
                            size="formPage"
                            onClick={() => handleConsentDocumentWrite(item.key)}
                          >
                            동의서 작성
                          </PFButton>
                        </PFFormInlineSegment>
                      </PFFormInlineRow>
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
                <PFFormInlineRow>
                  <PFFormInlineSegment>
                    <RadioGroup
                      name="gender"
                      value={values.gender}
                      options={GENDER_OPTIONS}
                      disabled
                      onChange={value => patch('gender', value)}
                    />
                  </PFFormInlineSegment>
                  <PFFormInlineSeparator />
                  <PFFormInlineSegment>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width="180px"
                      placeholder={PH.birthDate}
                      disabled
                      value={values.birthDate}
                      onValueChange={value => patch('birthDate', value)}
                    />
                  </PFFormInlineSegment>
                </PFFormInlineRow>
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
            <PFFormFieldRow type="single">
              <PFFormField label="소속">
                {values.memberType === 'school_teacher' ? (
                  <PFFormInlineRow>
                    <PFFormInlineSegment>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={200}
                        placeholder={PH.schoolName}
                        disabled
                        value={values.schoolName}
                        onValueChange={value => patch('schoolName', value)}
                      />
                    </PFFormInlineSegment>
                    <PFFormInlineSeparator />
                    <PFFormInlineSegment>
                      <PFSelect
                        variant="formPage"
                        size="large"
                        width={200}
                        placeholder={PH.employmentStatus}
                        options={toSelectOptions(SCHOOL_TEACHER_EMPLOYMENT_STATUS_FORM_OPTIONS)}
                        disabled
                        value={values.employmentStatus}
                        onValueChange={value =>
                          patch(
                            'employmentStatus',
                            value as InstructorSharedProfileFormValues['employmentStatus']
                          )
                        }
                      />
                    </PFFormInlineSegment>
                  </PFFormInlineRow>
                ) : (
                  <PFFormInlineRow>
                    <PFFormInlineSegment>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={200}
                        placeholder={PH.affiliationName}
                        disabled
                        value={values.affiliationName}
                        onValueChange={value => patch('affiliationName', value)}
                      />
                    </PFFormInlineSegment>
                    <PFFormInlineSeparator />
                    <PFFormInlineSegment>
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
                    </PFFormInlineSegment>
                  </PFFormInlineRow>
                )}
              </PFFormField>
            </PFFormFieldRow>

            <PFFormFieldRow type="single">
              <PFFormField label="자택 주소지">
                <PFFormHomeAddressFields
                  roadValue={values.homeAddress}
                  detailValue={values.homeAddressDetail}
                  onRoadChange={value => patch('homeAddress', value)}
                  onDetailChange={value => patch('homeAddressDetail', value)}
                  roadPlaceholder={PH.homeAddress}
                  detailPlaceholder={PH.homeAddressDetail}
                  disabled
                />
              </PFFormField>
            </PFFormFieldRow>
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
                <PFFormInlineRow>
                  <PFFormInlineSegment>
                    <PFFormControlCluster>
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
                    </PFFormControlCluster>
                  </PFFormInlineSegment>
                  <PFFormInlineSeparator />
                  <PFFormInlineSegment>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width={240}
                      placeholder={PH.accountHolder}
                      value={values.accountHolder}
                      onValueChange={value => patch('accountHolder', value)}
                    />
                  </PFFormInlineSegment>
                </PFFormInlineRow>
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
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="최종 학력">
                <PFFormInlineRow>
                  <PFFormInlineSegment>
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={160}
                    placeholder={PH.eduSchoolType}
                    options={toSelectOptions(EDUCATION_SCHOOL_TYPE_OPTIONS)}
                    value={values.eduSchoolType}
                    onValueChange={handleEduSchoolTypeChange}
                  />
                  </PFFormInlineSegment>
                  <PFFormInlineSeparator />
                  <PFFormInlineSegment>
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={120}
                    placeholder={PH.eduStatus}
                    options={toSelectOptions(EDUCATION_STATUS_OPTIONS)}
                    value={values.eduStatus}
                    onValueChange={value => patch('eduStatus', value)}
                  />
                </PFFormInlineSegment>
                </PFFormInlineRow>
              </PFFormField>
            </PFFormFieldRow>
            {availableEducationKeys.length > 0 ? (
              <PFFormFieldRow type="single">
                <PFFormField label="학력 상세">
                  <div className={styles.radioGroup}>
                    {EDUCATION_DETAIL_OPTIONS.filter(option =>
                      availableEducationKeys.includes(option.value)
                    ).map(option => {
                      const locked = option.value === values.eduSchoolType
                      const checked = values.educationDetailKeys.includes(option.value)
                      return (
                        <PFCheckbox
                          key={option.value}
                          size="large"
                          checked={checked}
                          disabled={locked}
                          onCheckedChange={() => toggleEducationDetail(option.value)}
                        >
                          {option.label}
                        </PFCheckbox>
                      )
                    })}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}

            {values.educationDetailKeys.includes('high') ? (
              <PFFormFieldRow type="single">
                <PFFormField label="고등학교">
                  <PFFormInlineRow>
                    <PFFormInlineSegment>
                      <PFFormPeriodPair>
                        <PFDateInput
                          variant="formPage"
                          size="large"
                          width={200}
                          picker="year"
                          placeholder={PH.admitYear}
                          value={values.highSchool.admitYear ?? ''}
                          onValueChange={value =>
                            patch('highSchool', {
                              ...values.highSchool,
                              admitYear: value || null,
                            })
                          }
                        />
                        <PFFormPeriodTilde />
                        <PFDateInput
                          variant="formPage"
                          size="large"
                          width={200}
                          picker="year"
                          placeholder={PH.gradYear}
                          disabled={finalEducationEnrolled && lockedEducationKey === 'high'}
                          value={values.highSchool.gradYear ?? ''}
                          onValueChange={value =>
                            patch('highSchool', {
                              ...values.highSchool,
                              gradYear: value || null,
                            })
                          }
                        />
                      </PFFormPeriodPair>
                    </PFFormInlineSegment>
                    <PFFormInlineSeparator />
                    <PFFormInlineSegment>
                      <EducationSchoolNameField
                        detailKey="high"
                        value={values.highSchool.schoolName}
                        onChange={schoolName =>
                          patch('highSchool', { ...values.highSchool, schoolName })
                        }
                      />
                    </PFFormInlineSegment>
                  </PFFormInlineRow>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}

            {values.educationDetailKeys.includes('college23') ? (
              <PFFormFieldRow type="single">
                <PFFormField label="대학교 2, 3년제">
                  <div className={styles.fieldStack}>
                    {values.college23Rows.map((row, index) => (
                      <div key={`college23-${index}`} className={styles.fieldStackRow}>
                        <PFFormInlineRow>
                          <PFFormInlineSegment>
                        <PFFormPeriodPair>
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="year"
                                placeholder={PH.admitYear}
                                value={row.admitYear ?? ''}
                                onValueChange={value => {
                                  const next = [...values.college23Rows]
                                  next[index] = { ...row, admitYear: value || null }
                                  patch('college23Rows', next)
                                }}
                              />
                              <PFFormPeriodTilde />
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="year"
                                placeholder={PH.gradYear}
                                disabled={finalEducationEnrolled && lockedEducationKey === 'college23'}
                                value={row.gradYear ?? ''}
                                onValueChange={value => {
                                  const next = [...values.college23Rows]
                                  next[index] = { ...row, gradYear: value || null }
                                  patch('college23Rows', next)
                                }}
                              />
                            </PFFormPeriodPair>
                          </PFFormInlineSegment>
                          <PFFormInlineSeparator />
                          <PFFormInlineSegment>
                        <PFFormControlCluster>
                              <EducationSchoolNameField
                                detailKey="college23"
                                value={row.schoolName}
                                onChange={schoolName => {
                                  const next = [...values.college23Rows]
                                  next[index] = { ...row, schoolName }
                                  patch('college23Rows', next)
                                }}
                              />
                              <PFTextInput
                                variant="formPage"
                                size="large"
                                width={160}
                                placeholder={PH.major}
                                value={row.major}
                                onValueChange={value => {
                                  const next = [...values.college23Rows]
                                  next[index] = { ...row, major: value }
                                  patch('college23Rows', next)
                                }}
                              />
                              <ListRowActions
                                isFirst={index === 0}
                                onAdd={() =>
                                  patch('college23Rows', [
                                    ...values.college23Rows,
                                    { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW },
                                  ])
                                }
                                onRemove={() =>
                                  patch(
                                    'college23Rows',
                                    values.college23Rows.filter((_, i) => i !== index)
                                  )
                                }
                              />
                            </PFFormControlCluster>
                          </PFFormInlineSegment>
                        </PFFormInlineRow>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}

            {values.educationDetailKeys.includes('college4') ? (
              <PFFormFieldRow type="single">
                <PFFormField label="대학교 4년제">
                  <div className={styles.fieldStack}>
                    {values.college4Rows.map((row, index) => (
                      <div key={`college4-${index}`} className={styles.fieldStackRow}>
                        <PFFormInlineRow>
                          <PFFormInlineSegment>
                        <PFFormPeriodPair>
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="year"
                                placeholder={PH.admitYear}
                                value={row.admitYear ?? ''}
                                onValueChange={value => {
                                  const next = [...values.college4Rows]
                                  next[index] = { ...row, admitYear: value || null }
                                  patch('college4Rows', next)
                                }}
                              />
                              <PFFormPeriodTilde />
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="year"
                                placeholder={PH.gradYear}
                                disabled={finalEducationEnrolled && lockedEducationKey === 'college4'}
                                value={row.gradYear ?? ''}
                                onValueChange={value => {
                                  const next = [...values.college4Rows]
                                  next[index] = { ...row, gradYear: value || null }
                                  patch('college4Rows', next)
                                }}
                              />
                            </PFFormPeriodPair>
                          </PFFormInlineSegment>
                          <PFFormInlineSeparator />
                          <PFFormInlineSegment>
                        <PFFormControlCluster>
                              <EducationSchoolNameField
                                detailKey="college4"
                                value={row.schoolName}
                                onChange={schoolName => {
                                  const next = [...values.college4Rows]
                                  next[index] = { ...row, schoolName }
                                  patch('college4Rows', next)
                                }}
                              />
                              <PFTextInput
                                variant="formPage"
                                size="large"
                                width={160}
                                placeholder={PH.major}
                                value={row.major}
                                onValueChange={value => {
                                  const next = [...values.college4Rows]
                                  next[index] = { ...row, major: value }
                                  patch('college4Rows', next)
                                }}
                              />
                              <ListRowActions
                                isFirst={index === 0}
                                onAdd={() =>
                                  patch('college4Rows', [
                                    ...values.college4Rows,
                                    { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW },
                                  ])
                                }
                                onRemove={() =>
                                  patch(
                                    'college4Rows',
                                    values.college4Rows.filter((_, i) => i !== index)
                                  )
                                }
                              />
                            </PFFormControlCluster>
                          </PFFormInlineSegment>
                        </PFFormInlineRow>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}

            {values.educationDetailKeys.includes('graduate') ? (
              <PFFormFieldRow type="single">
                <PFFormField label="대학원">
                  <div className={styles.fieldStack}>
                    {values.graduateRows.map((row, index) => (
                      <div key={`graduate-${index}`} className={styles.fieldStackRow}>
                        <PFFormInlineRow>
                          <PFFormInlineSegment>
                        <PFFormPeriodPair>
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="year"
                                placeholder={PH.admitYear}
                                value={row.admitYear ?? ''}
                                onValueChange={value => {
                                  const next = [...values.graduateRows]
                                  next[index] = { ...row, admitYear: value || null }
                                  patch('graduateRows', next)
                                }}
                              />
                              <PFFormPeriodTilde />
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="year"
                                placeholder={PH.gradYear}
                                disabled={finalEducationEnrolled && lockedEducationKey === 'graduate'}
                                value={row.gradYear ?? ''}
                                onValueChange={value => {
                                  const next = [...values.graduateRows]
                                  next[index] = { ...row, gradYear: value || null }
                                  patch('graduateRows', next)
                                }}
                              />
                              <PFSelect
                                variant="formPage"
                                size="large"
                                width={120}
                                className={styles.degreeSelectMargin}
                                placeholder={PH.degree}
                                options={toSelectOptions(EDUCATION_DEGREE_OPTIONS)}
                                value={row.degree}
                                onValueChange={value => {
                                  const next = [...values.graduateRows]
                                  next[index] = { ...row, degree: value }
                                  patch('graduateRows', next)
                                }}
                              />
                            </PFFormPeriodPair>
                          </PFFormInlineSegment>
                          <PFFormInlineSeparator />
                          <PFFormInlineSegment>
                        <PFFormControlCluster>
                              <EducationSchoolNameField
                                detailKey="graduate"
                                value={row.schoolName}
                                onChange={schoolName => {
                                  const next = [...values.graduateRows]
                                  next[index] = { ...row, schoolName }
                                  patch('graduateRows', next)
                                }}
                              />
                              <PFTextInput
                                variant="formPage"
                                size="large"
                                width={160}
                                placeholder={PH.major}
                                value={row.major}
                                onValueChange={value => {
                                  const next = [...values.graduateRows]
                                  next[index] = { ...row, major: value }
                                  patch('graduateRows', next)
                                }}
                              />
                              <ListRowActions
                                isFirst={index === 0}
                                onAdd={() =>
                                  patch('graduateRows', [
                                    ...values.graduateRows,
                                    { ...EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW },
                                  ])
                                }
                                onRemove={() =>
                                  patch(
                                    'graduateRows',
                                    values.graduateRows.filter((_, i) => i !== index)
                                  )
                                }
                              />
                            </PFFormControlCluster>
                          </PFFormInlineSegment>
                        </PFFormInlineRow>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-career" title={SECTION_TITLE.career} required>
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="경력 구분">
                <RadioGroup
                  name="careerLevel"
                  value={values.careerLevel}
                  options={CAREER_LEVEL_OPTIONS}
                  onChange={value => patch('careerLevel', value)}
                />
              </PFFormField>
            </PFFormFieldRow>
            {values.careerLevel === 'experienced' ? (
              <PFFormFieldRow type="single">
                <PFFormField label="경력 사항">
                  <div className={styles.fieldStack}>
                    {values.careers.map((row, index) => (
                      <div key={`career-${index}`} className={styles.fieldStackRow}>
                        <PFFormInlineRow>
                          <PFFormInlineSegment>
                        <PFFormPeriodPair>
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="month"
                                placeholder={PH.careerPeriodStart}
                                value={row.periodStart ?? ''}
                                onValueChange={value => {
                                  const next = [...values.careers]
                                  next[index] = { ...row, periodStart: value || null }
                                  patch('careers', next)
                                }}
                              />
                              <PFFormPeriodTilde />
                              <PFDateInput
                                variant="formPage"
                                size="large"
                                width={200}
                                picker="month"
                                placeholder={PH.careerPeriodEnd}
                                disabled={row.currentlyEmployed}
                                value={row.periodEnd ?? ''}
                                onValueChange={value => {
                                  const next = [...values.careers]
                                  next[index] = { ...row, periodEnd: value || null }
                                  patch('careers', next)
                                }}
                              />
                            </PFFormPeriodPair>
                          </PFFormInlineSegment>
                          <PFFormInlineSeparator />
                          <PFFormInlineSegment>
                        <PFFormControlCluster>
                              <PFTextInput
                                variant="formPage"
                                size="large"
                                width={200}
                                placeholder={PH.companyName}
                                value={row.companyName}
                                onValueChange={value => {
                                  const next = [...values.careers]
                                  next[index] = { ...row, companyName: value }
                                  patch('careers', next)
                                }}
                              />
                              <PFTextInput
                                variant="formPage"
                                size="large"
                                width={160}
                                placeholder={PH.roleName}
                                value={row.roleName}
                                onValueChange={value => {
                                  const next = [...values.careers]
                                  next[index] = { ...row, roleName: value }
                                  patch('careers', next)
                                }}
                              />
                              <PFCheckbox
                                size="large"
                                checked={row.currentlyEmployed}
                                onCheckedChange={checked => {
                                  const next = [...values.careers]
                                  next[index] = {
                                    ...row,
                                    currentlyEmployed: checked,
                                    periodEnd: checked ? null : row.periodEnd,
                                  }
                                  patch('careers', next)
                                }}
                              >
                                재직중
                              </PFCheckbox>
                              <ListRowActions
                                isFirst={index === 0}
                                onAdd={() =>
                                  patch('careers', [...values.careers, { ...EMPTY_INSTRUCTOR_CAREER }])
                                }
                                onRemove={() =>
                                  patch(
                                    'careers',
                                    values.careers.filter((_, i) => i !== index)
                                  )
                                }
                              />
                            </PFFormControlCluster>
                          </PFFormInlineSegment>
                        </PFFormInlineRow>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-ja" title={SECTION_TITLE.ja}>
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="활동 이력">
                <div className={styles.fieldStack}>
                  {values.jaKoreaRows.map((row, index) => (
                    <div key={`ja-${index}`} className={styles.fieldStackRow}>
                      <PFFormInlineRow>
                        <PFFormInlineSegment>
                      <PFFormPeriodPair>
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              placeholder={PH.jaPeriodStart}
                              value={row.periodStart ?? ''}
                              onValueChange={value => {
                                const next = [...values.jaKoreaRows]
                                next[index] = { ...row, periodStart: value || null }
                                patch('jaKoreaRows', next)
                              }}
                            />
                            <PFFormPeriodTilde />
                            <PFDateInput
                              variant="formPage"
                              size="large"
                              width={200}
                              placeholder={PH.jaPeriodEnd}
                              value={row.periodEnd ?? ''}
                              onValueChange={value => {
                                const next = [...values.jaKoreaRows]
                                next[index] = { ...row, periodEnd: value || null }
                                patch('jaKoreaRows', next)
                              }}
                            />
                          </PFFormPeriodPair>
                        </PFFormInlineSegment>
                        <PFFormInlineSeparator />
                        <PFFormInlineSegment>
                      <PFFormControlCluster>
                            <PFTextInput
                              variant="formPage"
                              size="large"
                              width={200}
                              placeholder={PH.jaProgramName}
                              value={row.title}
                              onValueChange={value => {
                                const next = [...values.jaKoreaRows]
                                next[index] = { ...row, title: value }
                                patch('jaKoreaRows', next)
                              }}
                            />
                            <PFTextInput
                              variant="formPage"
                              size="large"
                              width={160}
                              placeholder={PH.jaNote}
                              value={row.note}
                              onValueChange={value => {
                                const next = [...values.jaKoreaRows]
                                next[index] = { ...row, note: value }
                                patch('jaKoreaRows', next)
                              }}
                            />
                            <ListRowActions
                              isFirst={index === 0}
                              onAdd={() =>
                                patch('jaKoreaRows', [
                                  ...values.jaKoreaRows,
                                  { ...EMPTY_INSTRUCTOR_JA_KOREA_ROW },
                                ])
                              }
                              onRemove={() =>
                                patch(
                                  'jaKoreaRows',
                                  values.jaKoreaRows.filter((_, i) => i !== index)
                                )
                              }
                            />
                          </PFFormControlCluster>
                        </PFFormInlineSegment>
                      </PFFormInlineRow>
                    </div>
                  ))}
                </div>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-license" title={SECTION_TITLE.license}>
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="자격 및 면허 내역">
                <div className={styles.fieldStack}>
                  {values.licenseRows.map((row, index) => (
                    <div key={`license-${index}`} className={styles.fieldStackRow}>
                      <PFFormInlineRow>
                        <PFFormInlineSegment>
                      <PFDateInput
                            variant="formPage"
                            size="large"
                            width={200}
                            picker="year"
                            placeholder={PH.licenseYear}
                            value={row.acquiredYear ?? ''}
                            onValueChange={value => {
                              const next = [...values.licenseRows]
                              next[index] = { ...row, acquiredYear: value || null }
                              patch('licenseRows', next)
                            }}
                          />
                        </PFFormInlineSegment>
                        <PFFormInlineSeparator />
                        <PFFormInlineSegment>
                      <PFFormControlCluster>
                            <PFTextInput
                              variant="formPage"
                              size="large"
                              width={200}
                              placeholder={PH.licenseTitle}
                              value={row.title}
                              onValueChange={value => {
                                const next = [...values.licenseRows]
                                next[index] = { ...row, title: value }
                                patch('licenseRows', next)
                              }}
                            />
                            <PFTextInput
                              variant="formPage"
                              size="large"
                              width={160}
                              placeholder={PH.licenseIssuer}
                              value={row.issuer}
                              onValueChange={value => {
                                const next = [...values.licenseRows]
                                next[index] = { ...row, issuer: value }
                                patch('licenseRows', next)
                              }}
                            />
                            <ListRowActions
                              isFirst={index === 0}
                              onAdd={() =>
                                patch('licenseRows', [
                                  ...values.licenseRows,
                                  { ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW },
                                ])
                              }
                              onRemove={() =>
                                patch(
                                  'licenseRows',
                                  values.licenseRows.filter((_, i) => i !== index)
                                )
                              }
                            />
                          </PFFormControlCluster>
                        </PFFormInlineSegment>
                      </PFFormInlineRow>
                    </div>
                  ))}
                </div>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-award" title={SECTION_TITLE.award}>
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="수상 및 수료 내역">
                <div className={styles.fieldStack}>
                  {values.awardRows.map((row, index) => (
                    <div key={`award-${index}`} className={styles.fieldStackRow}>
                      <PFFormInlineRow>
                        <PFFormInlineSegment>
                      <PFDateInput
                            variant="formPage"
                            size="large"
                            width={200}
                            picker="year"
                            placeholder={PH.awardYear}
                            value={row.acquiredYear ?? ''}
                            onValueChange={value => {
                              const next = [...values.awardRows]
                              next[index] = { ...row, acquiredYear: value || null }
                              patch('awardRows', next)
                            }}
                          />
                        </PFFormInlineSegment>
                        <PFFormInlineSeparator />
                        <PFFormInlineSegment>
                      <PFFormControlCluster>
                            <PFTextInput
                              variant="formPage"
                              size="large"
                              width={200}
                              placeholder={PH.awardTitle}
                              value={row.title}
                              onValueChange={value => {
                                const next = [...values.awardRows]
                                next[index] = { ...row, title: value }
                                patch('awardRows', next)
                              }}
                            />
                            <PFTextInput
                              variant="formPage"
                              size="large"
                              width={160}
                              placeholder={PH.awardIssuer}
                              value={row.issuer}
                              onValueChange={value => {
                                const next = [...values.awardRows]
                                next[index] = { ...row, issuer: value }
                                patch('awardRows', next)
                              }}
                            />
                            <ListRowActions
                              isFirst={index === 0}
                              onAdd={() =>
                                patch('awardRows', [
                                  ...values.awardRows,
                                  { ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW },
                                ])
                              }
                              onRemove={() =>
                                patch(
                                  'awardRows',
                                  values.awardRows.filter((_, i) => i !== index)
                                )
                              }
                            />
                          </PFFormControlCluster>
                        </PFFormInlineSegment>
                      </PFFormInlineRow>
                    </div>
                  ))}
                </div>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection
          id="instructor-apply-free-write"
          title={SECTION_TITLE.freeWrite}
          description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.freeWrite}
          required
        >
          {INSTRUCTOR_FREE_WRITE_ITEMS.map(item => (
            <PFFormFieldTable key={item.name}>
              <PFFormFieldRow type="single">
                <PFFormField label={item.label} layout="vertical">
                  <textarea
                    className={styles.textarea}
                    placeholder={PH.freeWrite}
                    value={values[item.name]}
                    maxLength={1000}
                    onChange={event => patch(item.name, event.target.value)}
                  />
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>
          ))}
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
    </>
  )
}
