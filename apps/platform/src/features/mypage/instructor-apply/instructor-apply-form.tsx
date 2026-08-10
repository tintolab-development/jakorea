import { useMemo, useState, type ChangeEvent } from 'react'
import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
import { CAREER_LEVEL_OPTIONS } from '@jakorea/domain/instructor/career-level'
import {
  CONSENT_RADIO_OPTIONS,
  CONSENT_VALUE,
  INSTRUCTOR_CONSENT_DOCUMENT_ITEMS,
  INSTRUCTOR_CONSENT_RADIO_ITEMS,
  TERMS_CONSENT_DESCRIPTION,
  type InstructorConsentDocumentKey,
} from '@jakorea/domain/instructor/consent'
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
import { INSTRUCTOR_MEMBER_TYPE_OPTIONS } from '@jakorea/domain/instructor/member-type'
import {
  EMPTY_INSTRUCTOR_CAREER,
  EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW,
  EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW,
  EMPTY_INSTRUCTOR_JA_KOREA_ROW,
  EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW,
  INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import {
  collectInstructorRegisterValidation,
  isInstructorRegisterBasicInfoIncompleteForConsent,
} from '@jakorea/domain/instructor/validate-register'
import { isValidEmail, parseBirthDate } from '@/features/auth/sign-up'
import {
  PFAlertModal,
  PFButton,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormSection,
  PFSelect,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import styles from './instructor-apply-form.module.css'

const REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE = '필수 항목을 모두 작성해주세요'
const CONSENT_BASIC_INFO_REQUIRED_ALERT_MESSAGE = '기본 정보를 먼저 작성 해주세요.'

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
}: {
  name: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (next: T) => void
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
            onChange={() => onChange(option.value)}
          />
          <PFText as="span" typo="bd-md-rg" color="black">
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
    <PFButton type="button" variant="secondary" size="small" onClick={onAdd}>
      추가
    </PFButton>
  ) : (
    <PFButton type="button" variant="secondary" size="small" onClick={onRemove}>
      삭제
    </PFButton>
  )
}

export type InstructorApplyFormProps = {
  onSubmitSuccess: () => void
}

export function InstructorApplyForm({ onSubmitSuccess }: InstructorApplyFormProps) {
  const [values, setValues] = useState<InstructorSharedProfileFormValues>(
    INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES
  )
  const [alert, setAlert] = useState<AlertState>(null)
  const [submitting, setSubmitting] = useState(false)

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
    setValues(prev => ({ ...prev, [key]: next }))
  }

  const handleMemberTypeChange = (memberType: InstructorSharedProfileFormValues['memberType']) => {
    setValues(prev => ({
      ...prev,
      memberType,
      ...(memberType === 'school_teacher'
        ? { affiliationName: '', affiliationNone: false }
        : { schoolName: '', employmentStatus: '' }),
    }))
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
    if (
      isInstructorRegisterBasicInfoIncompleteForConsent(
        values,
        value => parseBirthDate(value) == null
      )
    ) {
      setAlert({
        title: '안내',
        description: CONSENT_BASIC_INFO_REQUIRED_ALERT_MESSAGE,
      })
      return
    }

    // TODO: Platform 동의서 템플릿 에디터 연동
    patch(key, CONSENT_VALUE.agree)
    setAlert({
      title: '안내',
      description: '동의서 작성을 완료했습니다. (임시 — 템플릿 에디터 연동 예정)',
    })
  }

  const handleSubmit = () => {
    const { missingRequired, formatMessages } = collectInstructorRegisterValidation(values, {
      isBirthDateIncomplete: value => {
        const digits = value.replace(/\D/g, '')
        return digits.length > 0 && digits.length < 8
      },
      isBirthDateValid: value => parseBirthDate(value) != null,
      isEmailValid: isValidEmail,
    })

    if (missingRequired) {
      setAlert({ title: '안내', description: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE })
      return
    }
    if (formatMessages.length > 0) {
      setAlert({ title: '안내', description: formatMessages[0] })
      return
    }

    setSubmitting(true)
    // TODO: POST /api/portal/me/instructor-role-requests
    window.setTimeout(() => {
      setSubmitting(false)
      onSubmitSuccess()
    }, 300)
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
        <PFFormSection id="instructor-apply-basic" title="기본 정보" required>
          <PFFormFieldTable>
            <PFFormFieldRow type="double">
              <PFFormField label="성명">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="200px"
                  placeholder={PH.name}
                  value={values.name}
                  onValueChange={value => patch('name', value)}
                />
              </PFFormField>
              <PFFormField label="성별 및 생년월일">
                <div className={styles.inlineControls}>
                  <RadioGroup
                    name="gender"
                    value={values.gender}
                    options={GENDER_OPTIONS}
                    onChange={value => patch('gender', value)}
                  />
                  <span className={styles.inlineSeparator} aria-hidden />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width="180px"
                    placeholder={PH.birthDate}
                    value={values.birthDate}
                    onValueChange={value => patch('birthDate', value)}
                  />
                </div>
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="double">
              <PFFormField label="연락처">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="200px"
                  placeholder={PH.contact}
                  value={values.contact}
                  onValueChange={value => patch('contact', value)}
                />
              </PFFormField>
              <PFFormField label="이메일">
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width="200px"
                  placeholder={PH.email}
                  value={values.email}
                  onValueChange={value => patch('email', value)}
                />
              </PFFormField>
            </PFFormFieldRow>
            <PFFormFieldRow type="double">
              <PFFormField label="회원 유형">
                <RadioGroup
                  name="memberType"
                  value={values.memberType}
                  options={INSTRUCTOR_MEMBER_TYPE_OPTIONS}
                  onChange={handleMemberTypeChange}
                />
              </PFFormField>
              {values.memberType === 'school_teacher' ? (
                <PFFormField label="소속">
                  <div className={styles.inlineControls}>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width="200px"
                      placeholder={PH.schoolName}
                      value={values.schoolName}
                      onValueChange={value => patch('schoolName', value)}
                    />
                    <span className={styles.inlineSeparator} aria-hidden />
                    <PFSelect
                      variant="formPage"
                      size="large"
                      width="200px"
                      placeholder={PH.employmentStatus}
                      options={toSelectOptions(SCHOOL_TEACHER_EMPLOYMENT_STATUS_FORM_OPTIONS)}
                      value={values.employmentStatus}
                      onValueChange={value =>
                        patch(
                          'employmentStatus',
                          value as InstructorSharedProfileFormValues['employmentStatus']
                        )
                      }
                    />
                  </div>
                </PFFormField>
              ) : (
                <PFFormField label="소속">
                  <div className={styles.inlineControls}>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width="200px"
                      placeholder={PH.affiliationName}
                      disabled={values.affiliationNone}
                      value={values.affiliationName}
                      onValueChange={value => patch('affiliationName', value)}
                    />
                    <span className={styles.inlineSeparator} aria-hidden />
                    <label className={styles.checkboxOption}>
                      <input
                        type="checkbox"
                        checked={values.affiliationNone}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          setValues(prev => ({
                            ...prev,
                            affiliationNone: event.target.checked,
                            affiliationName: event.target.checked ? '' : prev.affiliationName,
                          }))
                        }}
                      />
                      <PFText as="span" typo="bd-md-rg" color="black">
                        소속 없음
                      </PFText>
                    </label>
                  </div>
                </PFFormField>
              )}
            </PFFormFieldRow>

            <PFFormFieldRow type="single">
              <PFFormField label="자택 주소지">
                <div className={styles.inlineControls}>
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={240}
                    placeholder={PH.homeAddress}
                    value={values.homeAddress}
                    onValueChange={value => patch('homeAddress', value)}
                  />
                  <span className={styles.inlineSeparator} aria-hidden />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={240}
                    placeholder={PH.homeAddressDetail}
                    value={values.homeAddressDetail}
                    onValueChange={value => patch('homeAddressDetail', value)}
                  />
                </div>
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
                <div className={styles.settlementAccount}>
                  <div className={styles.bankAccountPair}>
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
                  </div>
                  <span className={styles.inlineSeparator} aria-hidden />
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={240}
                    placeholder={PH.accountHolder}
                    value={values.accountHolder}
                    onValueChange={value => patch('accountHolder', value)}
                  />
                </div>
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
          id="instructor-apply-consent"
          title="약관 및 동의"
          description={TERMS_CONSENT_DESCRIPTION}
        >
          <PFFormFieldTable>
            {INSTRUCTOR_CONSENT_RADIO_ITEMS.map(item => (
              <PFFormFieldRow key={item.key} type="single">
                <PFFormField label={item.label} required={item.required}>
                  <RadioGroup
                    name={item.key}
                    value={values[item.key]}
                    options={CONSENT_RADIO_OPTIONS}
                    onChange={value => patch(item.key, value)}
                  />
                </PFFormField>
              </PFFormFieldRow>
            ))}
            {INSTRUCTOR_CONSENT_DOCUMENT_ITEMS.map(item => {
              const agreed = values[item.key] === CONSENT_VALUE.agree
              return (
                <PFFormFieldRow key={item.key} type="single">
                  <PFFormField label={item.label}>
                    <div className={styles.consentStatus}>
                      <PFText
                        as="span"
                        typo="bd-md-rg"
                        color={agreed ? 'black' : 'neutral-cool-500'}
                      >
                        {agreed ? '동의' : '미동의'}
                      </PFText>
                      <PFButton
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() => handleConsentDocumentWrite(item.key)}
                      >
                        동의서 작성
                      </PFButton>
                    </div>
                  </PFFormField>
                </PFFormFieldRow>
              )
            })}
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection
          id="instructor-apply-education"
          title="학력사항"
          description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.education}
        >
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="최종 학력">
                <div className={styles.inlineControls}>
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={160}
                    placeholder={PH.eduSchoolType}
                    options={toSelectOptions(EDUCATION_SCHOOL_TYPE_OPTIONS)}
                    value={values.eduSchoolType}
                    onValueChange={handleEduSchoolTypeChange}
                  />
                  <span className={styles.inlineSeparator} aria-hidden />
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={120}
                    placeholder={PH.eduStatus}
                    options={toSelectOptions(EDUCATION_STATUS_OPTIONS)}
                    value={values.eduStatus}
                    onValueChange={value => patch('eduStatus', value)}
                  />
                </div>
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
                        <label key={option.value} className={styles.checkboxOption}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={locked}
                            onChange={() => toggleEducationDetail(option.value)}
                          />
                          <PFText as="span" typo="bd-md-rg" color="black">
                            {option.label}
                          </PFText>
                        </label>
                      )
                    })}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
          </PFFormFieldTable>

          {values.educationDetailKeys.includes('high') ? (
            <PFFormFieldTable>
              <PFFormFieldRow type="single">
                <PFFormField label="고등학교">
                  <div className={styles.inlineControls}>
                    <div className={styles.period}>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={140}
                        placeholder={PH.admitYear}
                        value={values.highSchool.admitYear ?? ''}
                        onValueChange={value =>
                          patch('highSchool', {
                            ...values.highSchool,
                            admitYear: value || null,
                          })
                        }
                      />
                      <span className={styles.tilde} aria-hidden>
                        ~
                      </span>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={140}
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
                    </div>
                    <span className={styles.inlineSeparator} aria-hidden />
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      className={styles.inlineBirthInput}
                      placeholder={PH.educationSchoolName}
                      value={values.highSchool.schoolName}
                      onValueChange={value =>
                        patch('highSchool', { ...values.highSchool, schoolName: value })
                      }
                    />
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>
          ) : null}

          {values.educationDetailKeys.includes('college23') ? (
            <PFFormFieldTable>
              <PFFormFieldRow type="single">
                <PFFormField label="대학교 2, 3년제">
                  <div className={styles.fieldStack}>
                    {values.college23Rows.map((row, index) => (
                      <div key={`college23-${index}`} className={styles.fieldStackRow}>
                        <div className={styles.period}>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
                            placeholder={PH.admitYear}
                            value={row.admitYear ?? ''}
                            onValueChange={value => {
                              const next = [...values.college23Rows]
                              next[index] = { ...row, admitYear: value || null }
                              patch('college23Rows', next)
                            }}
                          />
                          <span className={styles.tilde} aria-hidden>
                            ~
                          </span>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
                            placeholder={PH.gradYear}
                            disabled={finalEducationEnrolled && lockedEducationKey === 'college23'}
                            value={row.gradYear ?? ''}
                            onValueChange={value => {
                              const next = [...values.college23Rows]
                              next[index] = { ...row, gradYear: value || null }
                              patch('college23Rows', next)
                            }}
                          />
                        </div>
                        <span className={styles.inlineSeparator} aria-hidden />
                        <div className={styles.inlineGroup}>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={200}
                            placeholder={PH.universityName}
                            value={row.schoolName}
                            onValueChange={value => {
                              const next = [...values.college23Rows]
                              next[index] = { ...row, schoolName: value }
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
                        </div>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>
          ) : null}

          {values.educationDetailKeys.includes('college4') ? (
            <PFFormFieldTable>
              <PFFormFieldRow type="single">
                <PFFormField label="대학교 4년제">
                  <div className={styles.fieldStack}>
                    {values.college4Rows.map((row, index) => (
                      <div key={`college4-${index}`} className={styles.fieldStackRow}>
                        <div className={styles.period}>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
                            placeholder={PH.admitYear}
                            value={row.admitYear ?? ''}
                            onValueChange={value => {
                              const next = [...values.college4Rows]
                              next[index] = { ...row, admitYear: value || null }
                              patch('college4Rows', next)
                            }}
                          />
                          <span className={styles.tilde} aria-hidden>
                            ~
                          </span>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
                            placeholder={PH.gradYear}
                            disabled={finalEducationEnrolled && lockedEducationKey === 'college4'}
                            value={row.gradYear ?? ''}
                            onValueChange={value => {
                              const next = [...values.college4Rows]
                              next[index] = { ...row, gradYear: value || null }
                              patch('college4Rows', next)
                            }}
                          />
                        </div>
                        <span className={styles.inlineSeparator} aria-hidden />
                        <div className={styles.inlineGroup}>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={200}
                            placeholder={PH.universityName}
                            value={row.schoolName}
                            onValueChange={value => {
                              const next = [...values.college4Rows]
                              next[index] = { ...row, schoolName: value }
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
                        </div>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>
          ) : null}

          {values.educationDetailKeys.includes('graduate') ? (
            <PFFormFieldTable>
              <PFFormFieldRow type="single">
                <PFFormField label="대학원">
                  <div className={styles.fieldStack}>
                    {values.graduateRows.map((row, index) => (
                      <div key={`graduate-${index}`} className={styles.fieldStackRow}>
                        <div className={styles.period}>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
                            placeholder={PH.admitYear}
                            value={row.admitYear ?? ''}
                            onValueChange={value => {
                              const next = [...values.graduateRows]
                              next[index] = { ...row, admitYear: value || null }
                              patch('graduateRows', next)
                            }}
                          />
                          <span className={styles.tilde} aria-hidden>
                            ~
                          </span>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
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
                        </div>
                        <span className={styles.inlineSeparator} aria-hidden />
                        <div className={styles.inlineGroup}>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={200}
                            placeholder={PH.universityName}
                            value={row.schoolName}
                            onValueChange={value => {
                              const next = [...values.graduateRows]
                              next[index] = { ...row, schoolName: value }
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
                        </div>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>
          ) : null}
        </PFFormSection>

        <PFFormSection id="instructor-apply-career" title="경력사항">
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
                        <div className={styles.period}>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
                            placeholder={PH.careerPeriodStart}
                            value={row.periodStart ?? ''}
                            onValueChange={value => {
                              const next = [...values.careers]
                              next[index] = { ...row, periodStart: value || null }
                              patch('careers', next)
                            }}
                          />
                          <span className={styles.tilde} aria-hidden>
                            ~
                          </span>
                          <PFTextInput
                            variant="formPage"
                            size="large"
                            width={140}
                            placeholder={PH.careerPeriodEnd}
                            disabled={row.currentlyEmployed}
                            value={row.periodEnd ?? ''}
                            onValueChange={value => {
                              const next = [...values.careers]
                              next[index] = { ...row, periodEnd: value || null }
                              patch('careers', next)
                            }}
                          />
                        </div>
                        <span className={styles.inlineSeparator} aria-hidden />
                        <div className={styles.inlineGroup}>
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
                          <label className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              checked={row.currentlyEmployed}
                              onChange={event => {
                                const next = [...values.careers]
                                next[index] = {
                                  ...row,
                                  currentlyEmployed: event.target.checked,
                                  periodEnd: event.target.checked ? null : row.periodEnd,
                                }
                                patch('careers', next)
                              }}
                            />
                            <PFText as="span" typo="bd-md-rg" color="black">
                              재직중
                            </PFText>
                          </label>
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
                        </div>
                      </div>
                    ))}
                  </div>
                </PFFormField>
              </PFFormFieldRow>
            ) : null}
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-ja" title="JA Korea 활동 경험">
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="활동 이력">
                <div className={styles.fieldStack}>
                  {values.jaKoreaRows.map((row, index) => (
                    <div key={`ja-${index}`} className={styles.fieldStackRow}>
                      <div className={styles.period}>
                        <PFTextInput
                          variant="formPage"
                          size="large"
                          width={140}
                          placeholder={PH.jaPeriodStart}
                          value={row.periodStart ?? ''}
                          onValueChange={value => {
                            const next = [...values.jaKoreaRows]
                            next[index] = { ...row, periodStart: value || null }
                            patch('jaKoreaRows', next)
                          }}
                        />
                        <span className={styles.tilde} aria-hidden>
                          ~
                        </span>
                        <PFTextInput
                          variant="formPage"
                          size="large"
                          width={140}
                          placeholder={PH.jaPeriodEnd}
                          value={row.periodEnd ?? ''}
                          onValueChange={value => {
                            const next = [...values.jaKoreaRows]
                            next[index] = { ...row, periodEnd: value || null }
                            patch('jaKoreaRows', next)
                          }}
                        />
                      </div>
                      <span className={styles.inlineSeparator} aria-hidden />
                      <div className={styles.inlineGroup}>
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
                      </div>
                    </div>
                  ))}
                </div>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-license" title="자격 및 면허">
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="자격 및 면허 내역">
                <div className={styles.fieldStack}>
                  {values.licenseRows.map((row, index) => (
                    <div key={`license-${index}`} className={styles.fieldStackRow}>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={140}
                        placeholder={PH.licenseYear}
                        value={row.acquiredYear ?? ''}
                        onValueChange={value => {
                          const next = [...values.licenseRows]
                          next[index] = { ...row, acquiredYear: value || null }
                          patch('licenseRows', next)
                        }}
                      />
                      <span className={styles.inlineSeparator} aria-hidden />
                      <div className={styles.inlineGroup}>
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
                      </div>
                    </div>
                  ))}
                </div>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection id="instructor-apply-award" title="수상 및 수료">
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="수상 및 수료 내역">
                <div className={styles.fieldStack}>
                  {values.awardRows.map((row, index) => (
                    <div key={`award-${index}`} className={styles.fieldStackRow}>
                      <PFTextInput
                        variant="formPage"
                        size="large"
                        width={140}
                        placeholder={PH.awardYear}
                        value={row.acquiredYear ?? ''}
                        onValueChange={value => {
                          const next = [...values.awardRows]
                          next[index] = { ...row, acquiredYear: value || null }
                          patch('awardRows', next)
                        }}
                      />
                      <span className={styles.inlineSeparator} aria-hidden />
                      <div className={styles.inlineGroup}>
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
                      </div>
                    </div>
                  ))}
                </div>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>

        <PFFormSection
          id="instructor-apply-free-write"
          title="자유 작성"
          description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.freeWrite}
        >
          {INSTRUCTOR_FREE_WRITE_ITEMS.map(item => (
            <PFFormFieldTable key={item.name}>
              <PFFormFieldRow type="single">
                <PFFormField label={item.label}>
                  <textarea
                    className={styles.textarea}
                    placeholder={PH.freeWrite}
                    value={values[item.name]}
                    onChange={event => patch(item.name, event.target.value)}
                  />
                </PFFormField>
              </PFFormFieldRow>
            </PFFormFieldTable>
          ))}
        </PFFormSection>

        <div className={styles.actions}>
          <PFButton size="xlarge" width={240} type="submit" disabled={submitting}>
            {submitting ? '신청 중…' : '강사 신청하기'}
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
