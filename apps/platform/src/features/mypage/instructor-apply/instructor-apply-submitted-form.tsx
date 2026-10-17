import { useNavigate } from 'react-router-dom'
import { CONSENT_VALUE } from '@jakorea/domain/instructor/consent'
import {
  getInstructorConsentDocumentItems,
  getInstructorFormLayout,
  getInstructorFormSectionDisplayTitle,
} from '@jakorea/domain/instructor/form-layout'
import { INSTRUCTOR_FORM_SECTION_DESCRIPTIONS } from '@jakorea/domain/instructor/form-copy'
import { INSTRUCTOR_FREE_WRITE_ITEMS } from '@jakorea/domain/instructor/free-write'
import type { InstructorConsentDocumentKey } from '@jakorea/domain/instructor/consent'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { INSTRUCTOR_APPLY_PATH } from '../lib/constants'
import type { InstructorApplySubmittedSnapshot } from './api/map-detail-to-form-values'
import { getInstructorApplyConsentPath } from './consent/catalog'
import type { InstructorApplyConsentKey } from './consent/catalog'
import {
  displayOrDash,
  formatInstructorApplyAffiliationDisplay,
  formatInstructorApplyBusinessIncomeDisplay,
  formatInstructorApplyCareerLevelDisplay,
  formatInstructorApplyEducationDetailFieldLabel,
  formatInstructorApplyEducationDetailSummary,
  formatInstructorApplyEducationSchoolTypeDisplay,
  formatInstructorApplyEducationStatusDisplay,
  formatInstructorApplyEducationYearRange,
  formatInstructorApplyGenderDisplay,
  formatInstructorApplyGraduateLeadingDisplay,
  formatInstructorApplyPeriodDisplay,
  formatInstructorApplySchoolMajorLine,
} from './lib/format-instructor-apply-display'
import { formatInstructorConsentAgreedAtLabel } from './lib/format-instructor-apply-datetime'
import { TeacherAffiliationDisplay } from './ui/teacher-affiliation-display'
import styles from './instructor-apply-form.module.css'
import {
  PFButton,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFieldValueText,
  PFFormInlineJoinedValues,
  PFFormInlineSeparatedFields,
  PFFormSection,
  PFText,
} from '@/shared/ui'

const FORM_SURFACE = 'platformApply' as const
const FORM_LAYOUT = getInstructorFormLayout(FORM_SURFACE)
const CONSENT_DOCUMENT_ITEMS = getInstructorConsentDocumentItems(FORM_SURFACE)

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

export type InstructorApplySubmittedFormProps = {
  snapshot: InstructorApplySubmittedSnapshot
}

export function InstructorApplySubmittedForm({ snapshot }: InstructorApplySubmittedFormProps) {
  const navigate = useNavigate()
  const { values, consentAgreedAt } = snapshot

  const handleConsentView = (key: InstructorConsentDocumentKey) => {
    const returnTo = encodeURIComponent(INSTRUCTOR_APPLY_PATH)
    navigate(`${getInstructorApplyConsentPath(key)}?mode=view&returnTo=${returnTo}`)
  }

  return (
    <div className={styles.form}>
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
                      <PFButton
                        type="button"
                        variant="secondary"
                        size="formPage"
                        onClick={() => handleConsentView(item.key)}
                      >
                        동의서 보기
                      </PFButton>
                      {agreedAt ? (
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
              <PFFormFieldValueText>{displayOrDash(values.name)}</PFFormFieldValueText>
            </PFFormField>
            <PFFormField label="성별 및 생년월일">
              <PFFormInlineJoinedValues
                parts={[
                  formatInstructorApplyGenderDisplay(values.gender),
                  values.birthDate,
                ]}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="double">
            <PFFormField label="연락처">
              <PFFormFieldValueText>
                {displayOrDash(formatKoreanPhoneNumber(values.contact))}
              </PFFormFieldValueText>
            </PFFormField>
            <PFFormField label="이메일">
              <PFFormFieldValueText>{displayOrDash(values.email)}</PFFormFieldValueText>
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="자택 주소지">
              <PFFormInlineJoinedValues
                parts={[values.homeAddress, values.homeAddressDetail]}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="소속">
              {values.memberType === 'school_teacher' ? (
                <TeacherAffiliationDisplay
                  schoolName={values.schoolName}
                  employmentStatus={values.employmentStatus}
                />
              ) : (
                <PFFormFieldValueText>
                  {displayOrDash(formatInstructorApplyAffiliationDisplay(values))}
                </PFFormFieldValueText>
              )}
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="강사 경력">
              <PFFormFieldValueText>{displayOrDash(values.instructorCareer)}</PFFormFieldValueText>
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="정산 계좌 정보">
              <PFFormInlineJoinedValues
                parts={[values.bankName, values.accountNumber, values.accountHolder]}
              />
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="사업소득자 여부">
              <PFFormFieldValueText>
                {formatInstructorApplyBusinessIncomeDisplay(values.isBusinessIncome)}
              </PFFormFieldValueText>
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="한 줄 소개">
              <PFFormFieldValueText>{displayOrDash(values.oneLineIntro)}</PFFormFieldValueText>
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
              <PFFormInlineJoinedValues
                parts={[
                  formatInstructorApplyEducationSchoolTypeDisplay(values.eduSchoolType),
                  formatInstructorApplyEducationStatusDisplay(values.eduStatus),
                ]}
              />
            </PFFormField>
          </PFFormFieldRow>
          {values.educationDetailKeys.length > 0 ? (
            <PFFormFieldRow type="single">
              <PFFormField label="학력 상세">
                <PFFormFieldValueText>
                  {displayOrDash(
                    formatInstructorApplyEducationDetailSummary(values.educationDetailKeys),
                  )}
                </PFFormFieldValueText>
              </PFFormField>
            </PFFormFieldRow>
          ) : null}
          {values.educationDetailKeys.includes('high') ? (
            <PFFormFieldRow type="single">
              <PFFormField label={formatInstructorApplyEducationDetailFieldLabel('high')}>
                <PFFormInlineJoinedValues
                  parts={[
                    formatInstructorApplyEducationYearRange(
                      values.highSchool.admitYear,
                      values.highSchool.gradYear,
                    ),
                    formatInstructorApplySchoolMajorLine(
                      values.highSchool.schoolName,
                      values.highSchool.major,
                    ),
                  ]}
                />
              </PFFormField>
            </PFFormFieldRow>
          ) : null}
          {values.educationDetailKeys.includes('college23')
            ? values.college23Rows
                .filter(
                  row =>
                    row.schoolName.trim() ||
                    formatInstructorApplyEducationYearRange(row.admitYear, row.gradYear),
                )
                .map((row, index) => (
                  <PFFormFieldRow key={`c23-${index}`} type="single">
                    <PFFormField
                      label={formatInstructorApplyEducationDetailFieldLabel('college23')}
                    >
                      <PFFormInlineJoinedValues
                        parts={[
                          formatInstructorApplyEducationYearRange(row.admitYear, row.gradYear),
                          formatInstructorApplySchoolMajorLine(row.schoolName, row.major),
                        ]}
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                ))
            : null}
          {values.educationDetailKeys.includes('college4')
            ? values.college4Rows
                .filter(
                  row =>
                    row.schoolName.trim() ||
                    formatInstructorApplyEducationYearRange(row.admitYear, row.gradYear),
                )
                .map((row, index) => (
                  <PFFormFieldRow key={`c4-${index}`} type="single">
                    <PFFormField
                      label={formatInstructorApplyEducationDetailFieldLabel('college4')}
                    >
                      <PFFormInlineJoinedValues
                        parts={[
                          formatInstructorApplyEducationYearRange(row.admitYear, row.gradYear),
                          formatInstructorApplySchoolMajorLine(row.schoolName, row.major),
                        ]}
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                ))
            : null}
          {values.educationDetailKeys.includes('graduate')
            ? values.graduateRows
                .filter(
                  row =>
                    row.schoolName.trim() ||
                    formatInstructorApplyEducationYearRange(row.admitYear, row.gradYear) ||
                    row.degree,
                )
                .map((row, index) => (
                  <PFFormFieldRow key={`grad-${index}`} type="single">
                    <PFFormField
                      label={formatInstructorApplyEducationDetailFieldLabel('graduate')}
                    >
                      <PFFormInlineJoinedValues
                        parts={[
                          formatInstructorApplyGraduateLeadingDisplay(
                            row.admitYear,
                            row.gradYear,
                            row.degree,
                          ),
                          formatInstructorApplySchoolMajorLine(row.schoolName, row.major),
                        ]}
                      />
                    </PFFormField>
                  </PFFormFieldRow>
                ))
            : null}
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="instructor-apply-career" title={SECTION_TITLE.career} required>
        <PFFormFieldTable>
          <PFFormFieldRow type="single">
            <PFFormField label="경력 구분">
              <PFFormFieldValueText>
                {formatInstructorApplyCareerLevelDisplay(values.careerLevel)}
              </PFFormFieldValueText>
            </PFFormField>
          </PFFormFieldRow>
          {values.careers
            .filter(row => row.companyName.trim() || row.roleName.trim())
            .map((row, index) => (
              <PFFormFieldRow key={`career-${index}`} type="single">
                <PFFormField label="경력">
                  <PFFormInlineJoinedValues
                    parts={[
                      row.companyName,
                      row.roleName,
                      formatInstructorApplyPeriodDisplay(
                        row.periodStart,
                        row.periodEnd,
                        row.currentlyEmployed,
                      ),
                    ]}
                  />
                </PFFormField>
              </PFFormFieldRow>
            ))}
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="instructor-apply-ja" title={SECTION_TITLE.ja}>
        <PFFormFieldTable>
          {values.jaKoreaRows
            .filter(row => row.title.trim())
            .map((row, index) => (
              <PFFormFieldRow key={`ja-${index}`} type="single">
                <PFFormField label="JA Korea 활동">
                  <PFFormInlineJoinedValues
                    parts={[
                      row.title,
                      row.note,
                      formatInstructorApplyPeriodDisplay(row.periodStart, row.periodEnd),
                    ]}
                  />
                </PFFormField>
              </PFFormFieldRow>
            ))}
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="instructor-apply-license" title={SECTION_TITLE.license}>
        <PFFormFieldTable>
          {values.licenseRows
            .filter(row => row.title.trim())
            .map((row, index) => (
              <PFFormFieldRow key={`license-${index}`} type="single">
                <PFFormField label="자격증">
                  <PFFormInlineJoinedValues
                    parts={[row.title, row.issuer, row.acquiredYear]}
                  />
                </PFFormField>
              </PFFormFieldRow>
            ))}
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection id="instructor-apply-award" title={SECTION_TITLE.award}>
        <PFFormFieldTable>
          {values.awardRows
            .filter(row => row.title.trim())
            .map((row, index) => (
              <PFFormFieldRow key={`award-${index}`} type="single">
                <PFFormField label="수상">
                  <PFFormInlineJoinedValues
                    parts={[row.title, row.issuer, row.acquiredYear]}
                  />
                </PFFormField>
              </PFFormFieldRow>
            ))}
        </PFFormFieldTable>
      </PFFormSection>

      <PFFormSection
        id="instructor-apply-free-write"
        title={SECTION_TITLE.freeWrite}
        description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.freeWrite}
      >
        {INSTRUCTOR_FREE_WRITE_ITEMS.map(item => (
          <PFFormFieldTable key={item.name}>
            <PFFormFieldRow type="single">
              <PFFormField label={item.label} layout="vertical">
                <PFFormFieldValueText>{displayOrDash(values[item.name])}</PFFormFieldValueText>
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        ))}
      </PFFormSection>
    </div>
  )
}
