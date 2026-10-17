import { BUSINESS_INCOME } from '@jakorea/domain/instructor/business-income'
import { CONSENT_VALUE } from '@jakorea/domain/instructor/consent'
import type { EducationDetailKey } from '@jakorea/domain/instructor/education-options'
import {
  EMPTY_INSTRUCTOR_CAREER,
  EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW,
  EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW,
  EMPTY_INSTRUCTOR_JA_KOREA_ROW,
  EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW,
  INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import type { InstructorApplyConsentKey } from '../consent/catalog'
import {
  toInstructorFormBirthDate,
  toInstructorFormGender,
} from '../map-locked-basic-info'
import type {
  InstructorRoleRequestCareerRow,
  InstructorRoleRequestDetail,
  InstructorRoleRequestEducationGraduateRow,
  InstructorRoleRequestEducationSchoolRow,
  InstructorRoleRequestJaActivityRow,
  InstructorRoleRequestLicenseOrAwardRow,
  InstructorRoleRequestProfile,
  InstructorRoleRequestTermsAgreement,
} from './types'

const TERMS_TYPE_TO_CONSENT_KEY: Record<string, InstructorApplyConsentKey> = {
  PAYMENT_STATEMENT_PRE_CONSENT: 'consentPaymentStatement',
  FACILITATOR_PLEDGE: 'consentEducatorPledge',
  ADMINISTRATIVE_INFO_CONSENT: 'consentAdministrativeJoint',
  CRIMINAL_HISTORY_CHECK_CONSENT: 'consentSexOffenseCheck',
}

export type InstructorApplySubmittedSnapshot = {
  values: InstructorSharedProfileFormValues
  requestedAt?: string
  consentAgreedAt: Partial<Record<InstructorApplyConsentKey, string>>
}

function wireMonthToForm(value: string | undefined): string | null {
  if (!value?.trim()) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 6) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}`
  }
  if (digits.length === 4) return digits
  return value.trim()
}

function wireYearToForm(value: string | undefined): string | null {
  if (!value?.trim()) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(0, 4)
  return value.trim()
}

function mapSchoolRowToForm(
  row: InstructorRoleRequestEducationSchoolRow | undefined,
): typeof EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW | null {
  if (!row?.schoolName?.trim()) return null
  return {
    schoolName: row.schoolName.trim(),
    major: row.major?.trim() ?? '',
    admitYear: wireMonthToForm(row.admitYear),
    gradYear: wireMonthToForm(row.gradYear),
  }
}

function mapGraduateRowToForm(
  row: InstructorRoleRequestEducationGraduateRow | undefined,
): typeof EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW | null {
  const base = mapSchoolRowToForm(row)
  if (!base) return null
  return {
    ...base,
    degree: row?.degree === 'master' || row?.degree === 'doctor' ? row.degree : '',
  }
}

function ensureListRows<T>(rows: T[], empty: T): T[] {
  return rows.length > 0 ? rows : [{ ...empty }]
}

function fromApiEmploymentStatus(
  status: InstructorRoleRequestProfile['affiliation']['employmentStatus'] | undefined,
): InstructorSharedProfileFormValues['employmentStatus'] {
  if (status === 'ACTIVE') return 'ACTIVE'
  if (status === 'LEAVE') return 'ON_LEAVE'
  if (status === 'TRANSFER') return 'TRANSFERRED'
  if (status === 'RESIGNED') return 'WITHDRAWN'
  return ''
}

export function mapInstructorCmsProfileToFormPartial(
  profile: InstructorRoleRequestProfile | undefined,
): Partial<InstructorSharedProfileFormValues> {
  if (!profile) return {}

  const memberType = profile.memberType === 'SCHOOL_TEACHER' ? 'school_teacher' : 'general'
  const affiliation = profile.affiliation ?? {}
  const education = profile.education ?? { detailKeys: [] }
  const career = profile.career ?? { level: 'experienced', rows: [] }
  const essays = profile.essays ?? {}

  const highSchool = mapSchoolRowToForm(education.highSchool)
  const college23Rows = (education.college23 ?? [])
    .map(mapSchoolRowToForm)
    .filter((row): row is NonNullable<typeof row> => row != null)
  const college4Rows = (education.college4 ?? [])
    .map(mapSchoolRowToForm)
    .filter((row): row is NonNullable<typeof row> => row != null)
  const graduateRows = (education.graduate ?? [])
    .map(mapGraduateRowToForm)
    .filter((row): row is NonNullable<typeof row> => row != null)

  const careers = (career.rows ?? [])
    .map((row: InstructorRoleRequestCareerRow) => ({
      companyName: row.companyName?.trim() ?? '',
      roleName: row.roleName?.trim() ?? '',
      periodStart: wireMonthToForm(row.periodStart),
      periodEnd: wireMonthToForm(row.periodEnd),
      currentlyEmployed: row.currentlyEmployed ?? false,
    }))
    .filter(row => row.companyName || row.roleName)

  const jaKoreaRows = (profile.jaKoreaActivities ?? [])
    .map((row: InstructorRoleRequestJaActivityRow) => ({
      title: row.title?.trim() ?? '',
      note: row.note?.trim() ?? '',
      periodStart: wireMonthToForm(row.periodStart),
      periodEnd: wireMonthToForm(row.periodEnd),
    }))
    .filter(row => row.title)

  const licenseRows = (profile.licenses ?? [])
    .map((row: InstructorRoleRequestLicenseOrAwardRow) => ({
      title: row.title?.trim() ?? '',
      issuer: row.issuer?.trim() ?? '',
      acquiredYear: wireYearToForm(row.acquiredYear),
    }))
    .filter(row => row.title)

  const awardRows = (profile.awards ?? [])
    .map((row: InstructorRoleRequestLicenseOrAwardRow) => ({
      title: row.title?.trim() ?? '',
      issuer: row.issuer?.trim() ?? '',
      acquiredYear: wireYearToForm(row.acquiredYear),
    }))
    .filter(row => row.title)

  return {
    memberType,
    ...(memberType === 'school_teacher'
      ? {
          schoolName: affiliation.schoolName?.trim() ?? '',
          employmentStatus: fromApiEmploymentStatus(affiliation.employmentStatus),
          affiliationName: '',
          affiliationNone: false,
        }
      : {
          schoolName: '',
          employmentStatus: '',
          affiliationName: affiliation.organizationNames?.[0]?.trim() ?? '',
          affiliationNone: (affiliation.organizationNames?.length ?? 0) === 0,
        }),
    instructorCareer:
      profile.instructorCareerSummary?.trim() ?? career.summaryYears?.trim() ?? '',
    oneLineIntro: profile.oneLineIntro?.trim() ?? '',
    homeAddress: profile.homeAddress?.line?.trim() ?? '',
    homeAddressDetail: profile.homeAddress?.detail?.trim() ?? '',
    eduSchoolType: education.highestSchoolType ?? '',
    eduStatus: education.highestStatus ?? '',
    educationDetailKeys: (education.detailKeys ?? []) as EducationDetailKey[],
    highSchool: highSchool ?? { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW },
    college23Rows: ensureListRows(college23Rows, { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW }),
    college4Rows: ensureListRows(college4Rows, { ...EMPTY_INSTRUCTOR_EDUCATION_SCHOOL_ROW }),
    graduateRows: ensureListRows(graduateRows, { ...EMPTY_INSTRUCTOR_EDUCATION_GRADUATE_ROW }),
    careerLevel: career.level ?? 'experienced',
    careers: ensureListRows(careers, { ...EMPTY_INSTRUCTOR_CAREER }),
    jaKoreaRows: ensureListRows(jaKoreaRows, { ...EMPTY_INSTRUCTOR_JA_KOREA_ROW }),
    licenseRows: ensureListRows(licenseRows, { ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW }),
    awardRows: ensureListRows(awardRows, { ...EMPTY_INSTRUCTOR_LICENSE_OR_AWARD_ROW }),
    freeWrite1: essays.freeWrite1?.trim() ?? '',
    freeWrite2: essays.freeWrite2?.trim() ?? '',
    freeWrite3: essays.freeWrite3?.trim() ?? '',
    freeWrite4: essays.freeWrite4?.trim() ?? '',
  }
}

function mapTermsToConsent(
  rows: InstructorRoleRequestTermsAgreement[] | undefined,
  requestedAt?: string,
): {
  consentPartial: Partial<InstructorSharedProfileFormValues>
  consentAgreedAt: Partial<Record<InstructorApplyConsentKey, string>>
} {
  const consentPartial: Partial<InstructorSharedProfileFormValues> = {}
  const consentAgreedAt: Partial<Record<InstructorApplyConsentKey, string>> = {}

  for (const row of rows ?? []) {
    const key = TERMS_TYPE_TO_CONSENT_KEY[row.termsType?.trim() ?? '']
    if (!key) continue
    consentPartial[key] = row.agreed ? CONSENT_VALUE.agree : CONSENT_VALUE.disagree
    const at = row.agreedAt?.trim() || requestedAt?.trim()
    if (at && row.agreed) {
      consentAgreedAt[key] = at
    }
  }

  return { consentPartial, consentAgreedAt }
}

export function mapInstructorSettlementToFormPartial(
  settlement: InstructorRoleRequestDetail['settlement'],
): Partial<InstructorSharedProfileFormValues> {
  if (!settlement) return {}
  const account =
    settlement.bankAccounts?.find(item => item.current) ?? settlement.bankAccounts?.[0]
  return {
    isBusinessIncome: settlement.businessIncome ? BUSINESS_INCOME.yes : BUSINESS_INCOME.no,
    bankName: settlement.bankName?.trim() || account?.bankName?.trim() || '',
    accountNumber: settlement.accountNumber?.trim() || account?.accountNumber?.trim() || '',
    accountHolder: settlement.accountHolder?.trim() || account?.accountHolder?.trim() || '',
  }
}

/** Portal 상세 응답 → 승인 대기 화면 표시용 폼값 */
export function mapInstructorRoleRequestDetailToSubmittedSnapshot(
  detail: InstructorRoleRequestDetail,
): InstructorApplySubmittedSnapshot {
  const { consentPartial, consentAgreedAt } = mapTermsToConsent(
    detail.termsAgreements,
    detail.requestedAt,
  )

  const values: InstructorSharedProfileFormValues = {
    ...INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
    ...mapInstructorCmsProfileToFormPartial(detail.profile),
    ...mapInstructorSettlementToFormPartial(detail.settlement),
    ...consentPartial,
    name: detail.name?.trim() ?? '',
    gender: toInstructorFormGender(detail.gender) || INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES.gender,
    birthDate: toInstructorFormBirthDate(detail.birthDate),
    contact: detail.phone?.trim() ? formatKoreanPhoneNumber(detail.phone.trim()) : '',
    email: detail.email?.trim() ?? '',
  }

  return {
    values,
    requestedAt: detail.requestedAt,
    consentAgreedAt,
  }
}
