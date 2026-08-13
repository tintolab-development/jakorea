import {
  EDUCATION_SCHOOL_TYPE_OPTIONS,
  EDUCATION_STATUS_OPTIONS,
} from '@jakorea/domain/instructor/education-options'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { formatHomeAddress } from '@/features/auth/sign-up'
import type { InstructorRoleRequestCreateRequest } from './types'

/** CMS 권한 목록·승인 카피와 맞춘 기본 신청 유형 */
export const DEFAULT_INSTRUCTOR_REQUESTED_ACTIVITY_TYPE = 'JA 강사단'

const AGREEMENT_TERMS: {
  formKey: keyof InstructorSharedProfileFormValues
  termsType: string
  required: boolean
}[] = [
  { formKey: 'consentPaymentStatement', termsType: 'PAYMENT_STATEMENT_PRE_CONSENT', required: true },
  { formKey: 'consentEducatorPledge', termsType: 'FACILITATOR_PLEDGE', required: true },
  {
    formKey: 'consentAdministrativeJoint',
    termsType: 'ADMINISTRATIVE_INFO_CONSENT',
    required: true,
  },
  {
    formKey: 'consentSexOffenseCheck',
    termsType: 'CRIMINAL_HISTORY_CHECK_CONSENT',
    required: true,
  },
]

function labelOf(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find(option => option.value === value)?.label ?? value.trim()
}

function toApiBirthDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length !== 8) return value.trim()
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

function toApiGender(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'female' || normalized === 'f') return 'F'
  return 'M'
}

function buildEducationLevelSnapshot(values: InstructorSharedProfileFormValues): string {
  const school = labelOf(EDUCATION_SCHOOL_TYPE_OPTIONS, values.eduSchoolType)
  const status = labelOf(EDUCATION_STATUS_OPTIONS, values.eduStatus)
  return [school, status].filter(Boolean).join(' / ')
}

function buildCareerTextSnapshot(values: InstructorSharedProfileFormValues): string {
  return JSON.stringify({
    v: 1 as const,
    summary: values.instructorCareer.trim(),
    careerLevel: values.careerLevel,
    careers: values.careers,
    jaKoreaRows: values.jaKoreaRows,
    licenseRows: values.licenseRows,
    awardRows: values.awardRows,
    education: {
      eduSchoolType: values.eduSchoolType,
      eduStatus: values.eduStatus,
      educationDetailKeys: values.educationDetailKeys,
      highSchool: values.highSchool,
      college23Rows: values.college23Rows,
      college4Rows: values.college4Rows,
      graduateRows: values.graduateRows,
    },
    memberType: values.memberType,
    schoolName: values.schoolName,
    employmentStatus: values.employmentStatus,
    affiliationName: values.affiliationName,
    affiliationNone: values.affiliationNone,
  })
}

function buildBankAccountSnapshotJson(values: InstructorSharedProfileFormValues): string {
  return JSON.stringify({
    bankName: values.bankName.trim(),
    accountNumber: values.accountNumber.trim(),
    accountHolder: values.accountHolder.trim(),
  })
}

function buildAgreementSnapshotJson(values: InstructorSharedProfileFormValues): string {
  return JSON.stringify(
    AGREEMENT_TERMS.map(item => ({
      termsType: item.termsType,
      required: item.required,
      agreed: values[item.formKey] === 'agree',
    })),
  )
}

/** Platform 강사 신청 폼 → POST InstructorRoleRequestCreateRequest */
export function mapInstructorApplyFormToCreateRequest(
  values: InstructorSharedProfileFormValues,
  options?: { requestedActivityType?: string },
): InstructorRoleRequestCreateRequest {
  const homeAddress = formatHomeAddress(values.homeAddress, values.homeAddressDetail)

  return {
    requestedActivityType:
      options?.requestedActivityType?.trim() || DEFAULT_INSTRUCTOR_REQUESTED_ACTIVITY_TYPE,
    nameSnapshot: values.name.trim(),
    genderSnapshot: toApiGender(values.gender),
    birthDateSnapshot: toApiBirthDate(values.birthDate),
    phoneSnapshot: values.contact.trim(),
    emailSnapshot: values.email.trim(),
    homeAddressSnapshot: homeAddress,
    bankAccountSnapshotJson: buildBankAccountSnapshotJson(values),
    educationLevelSnapshot: buildEducationLevelSnapshot(values),
    careerTextSnapshot: buildCareerTextSnapshot(values),
    businessIncomeYn: values.isBusinessIncome === 'yes',
    selfIntroductionSnapshot: values.freeWrite1.trim() || undefined,
    youthEconomyEducationOpinionSnapshot: values.freeWrite2.trim() || undefined,
    youthCommunicationOpinionSnapshot: values.freeWrite3.trim() || undefined,
    unexpectedSituationResponseSnapshot: values.freeWrite4.trim() || undefined,
    oneLineIntroSnapshot: values.oneLineIntro.trim() || undefined,
    agreementSnapshotJson: buildAgreementSnapshotJson(values),
  }
}
