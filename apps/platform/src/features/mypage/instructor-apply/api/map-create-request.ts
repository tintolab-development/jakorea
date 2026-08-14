import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import type {
  InstructorRoleRequestCreateRequest,
  InstructorRoleRequestEducationGraduateRow,
  InstructorRoleRequestEducationSchoolRow,
  InstructorRoleRequestProfile,
  InstructorRoleRequestSettlement,
  InstructorRoleRequestTermsAgreement,
} from './types'

/** CMS 권한 목록·승인 카피와 맞춘 기본 신청 유형 */
export const DEFAULT_INSTRUCTOR_REQUESTED_ACTIVITY_TYPE = 'JA 강사단'

/** CMS `ADMIN_PRE_REGISTER_TERMS_VERSION`과 동일 */
const TERMS_VERSION = '1.0'

const AGREEMENT_TERMS: {
  formKey: keyof InstructorSharedProfileFormValues
  termsType: string
}[] = [
  { formKey: 'consentPaymentStatement', termsType: 'PAYMENT_STATEMENT_PRE_CONSENT' },
  { formKey: 'consentEducatorPledge', termsType: 'FACILITATOR_PLEDGE' },
  { formKey: 'consentAdministrativeJoint', termsType: 'ADMINISTRATIVE_INFO_CONSENT' },
  { formKey: 'consentSexOffenseCheck', termsType: 'CRIMINAL_HISTORY_CHECK_CONSENT' },
]

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
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

/** CMS `formatMonth` — wire `YYYY-MM` (폼 문자열: YYYY / YYYY.MM / YYYY-MM / …) */
function formatMonth(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`
  if (digits.length === 4) return `${digits}-01`
  return undefined
}

/** CMS `formatYear` — wire `YYYY` */
function formatYear(value: string | null | undefined): string | undefined {
  if (value == null) return undefined
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(0, 4)
  return undefined
}

function filterNonEmptyRows<T>(rows: Array<T | null>): T[] {
  return rows.filter((row): row is T => row != null)
}

/** 폼 `ON_LEAVE` 등 → CMS wire `LEAVE` 등 */
function toApiEmploymentStatus(
  status: string,
): InstructorRoleRequestProfile['affiliation']['employmentStatus'] | undefined {
  const v = status.trim()
  if (v === 'ACTIVE') return 'ACTIVE'
  if (v === 'ON_LEAVE' || v === 'LEAVE') return 'LEAVE'
  if (v === 'TRANSFERRED' || v === 'TRANSFER') return 'TRANSFER'
  if (v === 'WITHDRAWN' || v === 'RESIGNED') return 'RESIGNED'
  return undefined
}

function mapSchoolRowToApi(
  row:
    | {
        admitYear: string | null
        gradYear: string | null
        schoolName: string
        major: string
      }
    | null
    | undefined,
): InstructorRoleRequestEducationSchoolRow | null {
  if (!row) return null
  const schoolName = row.schoolName?.trim() ?? ''
  if (!schoolName) return null
  return {
    schoolName,
    ...(trimOptional(row.major) ? { major: row.major.trim() } : {}),
    ...(formatMonth(row.admitYear) ? { admitYear: formatMonth(row.admitYear) } : {}),
    ...(formatMonth(row.gradYear) ? { gradYear: formatMonth(row.gradYear) } : {}),
  }
}

function mapSchoolRowsToApi(
  rows: Array<{
    admitYear: string | null
    gradYear: string | null
    schoolName: string
    major: string
  } | null | undefined> | null | undefined,
): InstructorRoleRequestEducationSchoolRow[] {
  return filterNonEmptyRows((rows ?? []).map(mapSchoolRowToApi))
}

function mapGraduateRowToApi(
  row: {
    admitYear: string | null
    gradYear: string | null
    schoolName: string
    major: string
    degree: string
  } | null | undefined,
): InstructorRoleRequestEducationGraduateRow | null {
  if (!row) return null
  const base = mapSchoolRowToApi(row)
  if (!base) return null
  const degree = row.degree?.trim()
  return {
    ...base,
    ...(degree === 'master' || degree === 'doctor' ? { degree } : {}),
  }
}

function mapProfile(values: InstructorSharedProfileFormValues): InstructorRoleRequestProfile {
  const memberType = values.memberType === 'school_teacher' ? 'SCHOOL_TEACHER' : 'GENERAL'
  const employmentStatus = toApiEmploymentStatus(values.employmentStatus)
  const affiliation =
    memberType === 'SCHOOL_TEACHER'
      ? {
          ...(trimOptional(values.schoolName) ? { schoolName: values.schoolName.trim() } : {}),
          ...(employmentStatus ? { employmentStatus } : {}),
          organizationNames: [] as string[],
        }
      : {
          organizationNames: values.affiliationNone
            ? []
            : [trimOptional(values.affiliationName)].filter(
                (name): name is string => name != null,
              ),
        }

  const education: InstructorRoleRequestProfile['education'] = {
    ...(trimOptional(values.eduSchoolType)
      ? {
          highestSchoolType: values.eduSchoolType as NonNullable<
            InstructorRoleRequestProfile['education']['highestSchoolType']
          >,
        }
      : {}),
    ...(trimOptional(values.eduStatus)
      ? {
          highestStatus: values.eduStatus as NonNullable<
            InstructorRoleRequestProfile['education']['highestStatus']
          >,
        }
      : {}),
    ...(values.educationDetailKeys.length > 0
      ? {
          detailKeys: [...values.educationDetailKeys] as NonNullable<
            InstructorRoleRequestProfile['education']['detailKeys']
          >,
        }
      : {}),
    ...(mapSchoolRowToApi(values.highSchool)
      ? { highSchool: mapSchoolRowToApi(values.highSchool)! }
      : {}),
    college23: mapSchoolRowsToApi(values.college23Rows),
    college4: mapSchoolRowsToApi(values.college4Rows),
    graduate: filterNonEmptyRows((values.graduateRows ?? []).map(mapGraduateRowToApi)),
  }

  const careerRows = filterNonEmptyRows(
    (values.careers ?? []).map(row => {
      if (!row) return null
      const companyName = row.companyName?.trim() ?? ''
      const roleName = row.roleName?.trim() ?? ''
      if (!companyName && !roleName) return null
      return {
        companyName: companyName || roleName,
        roleName: roleName || companyName,
        ...(formatMonth(row.periodStart) ? { periodStart: formatMonth(row.periodStart) } : {}),
        ...(formatMonth(row.periodEnd) ? { periodEnd: formatMonth(row.periodEnd) } : {}),
        currentlyEmployed: row.currentlyEmployed,
      }
    }),
  )

  const jaKoreaActivities = filterNonEmptyRows(
    (values.jaKoreaRows ?? []).map(row => {
      if (!row) return null
      const title = row.title?.trim() ?? ''
      if (!title) return null
      return {
        title,
        ...(trimOptional(row.note) ? { note: row.note.trim() } : {}),
        ...(formatMonth(row.periodStart) ? { periodStart: formatMonth(row.periodStart) } : {}),
        ...(formatMonth(row.periodEnd) ? { periodEnd: formatMonth(row.periodEnd) } : {}),
      }
    }),
  )

  const licenses = filterNonEmptyRows(
    (values.licenseRows ?? []).map(row => {
      if (!row) return null
      const title = row.title?.trim() ?? ''
      if (!title) return null
      return {
        title,
        ...(trimOptional(row.issuer) ? { issuer: row.issuer.trim() } : {}),
        ...(formatYear(row.acquiredYear) ? { acquiredYear: formatYear(row.acquiredYear) } : {}),
      }
    }),
  )

  const awards = filterNonEmptyRows(
    (values.awardRows ?? []).map(row => {
      if (!row) return null
      const title = row.title?.trim() ?? ''
      if (!title) return null
      return {
        title,
        ...(trimOptional(row.issuer) ? { issuer: row.issuer.trim() } : {}),
        ...(formatYear(row.acquiredYear) ? { acquiredYear: formatYear(row.acquiredYear) } : {}),
      }
    }),
  )

  return {
    memberType,
    affiliation,
    ...(trimOptional(values.instructorCareer)
      ? { instructorCareerSummary: values.instructorCareer.trim() }
      : {}),
    ...(trimOptional(values.oneLineIntro) ? { oneLineIntro: values.oneLineIntro.trim() } : {}),
    homeAddress: {
      line: values.homeAddress.trim(),
      ...(trimOptional(values.homeAddressDetail)
        ? { detail: values.homeAddressDetail.trim() }
        : {}),
    },
    education,
    career: {
      level: values.careerLevel,
      rows: careerRows,
      ...(trimOptional(values.instructorCareer)
        ? { summaryYears: values.instructorCareer.trim() }
        : {}),
    },
    jaKoreaActivities,
    licenses,
    awards,
    essays: {
      ...(trimOptional(values.freeWrite1) ? { freeWrite1: values.freeWrite1.trim() } : {}),
      ...(trimOptional(values.freeWrite2) ? { freeWrite2: values.freeWrite2.trim() } : {}),
      ...(trimOptional(values.freeWrite3) ? { freeWrite3: values.freeWrite3.trim() } : {}),
      ...(trimOptional(values.freeWrite4) ? { freeWrite4: values.freeWrite4.trim() } : {}),
    },
  }
}

function mapSettlement(values: InstructorSharedProfileFormValues): InstructorRoleRequestSettlement {
  const bankName = values.bankName.trim()
  const accountNumber = values.accountNumber.trim()
  const accountHolder = values.accountHolder.trim()
  return {
    businessIncome: values.isBusinessIncome === 'yes',
    ...(bankName ? { bankName } : {}),
    ...(accountNumber ? { accountNumber } : {}),
    ...(accountHolder ? { accountHolder } : {}),
    ...(bankName
      ? {
          bankAccounts: [
            {
              bankName,
              ...(accountNumber ? { accountNumber } : {}),
              ...(accountHolder ? { accountHolder } : {}),
              current: true,
            },
          ],
        }
      : {}),
  }
}

function mapTermsAgreements(
  values: InstructorSharedProfileFormValues,
): InstructorRoleRequestTermsAgreement[] {
  return AGREEMENT_TERMS.map(item => ({
    termsType: item.termsType,
    version: TERMS_VERSION,
    /** CMS 동의서 작성형과 동일 — 가입·등록 필수는 SERVICE/PRIVACY만 */
    required: false,
    agreed: values[item.formKey] === 'agree',
  }))
}

/**
 * Platform 강사 신청 폼 → POST InstructorRoleRequestCreateRequest
 * BE는 Snapshot이 아닌 profile/settlement/termsAgreements 구조체를 수용해야 함.
 * @see apps/cms/docs/api/portal-instructor-role-request-create-structured-handoff-2026-08-13.md
 */
export function mapInstructorApplyFormToCreateRequest(
  values: InstructorSharedProfileFormValues,
  options?: { requestedActivityType?: string },
): InstructorRoleRequestCreateRequest {
  return {
    requestedActivityType:
      options?.requestedActivityType?.trim() || DEFAULT_INSTRUCTOR_REQUESTED_ACTIVITY_TYPE,
    name: values.name.trim(),
    gender: toApiGender(values.gender),
    birthDate: toApiBirthDate(values.birthDate),
    phone: values.contact.trim(),
    email: values.email.trim(),
    profile: mapProfile(values),
    settlement: mapSettlement(values),
    termsAgreements: mapTermsAgreements(values),
  }
}
