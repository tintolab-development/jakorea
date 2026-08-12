import dayjs, { type Dayjs } from 'dayjs'
import type {
  ApplicantInstructorRow,
  ApplicantInstructorAward,
  ApplicantInstructorCareerDetail,
  ApplicantInstructorEducationItem,
} from '@/data/mock/applicant-instructors'
import {
  EMPTY_CAREER,
  EMPTY_JA_KOREA_ROW,
  EMPTY_LICENSE_OR_AWARD_ROW,
  type InstructorProfileFormValues,
} from '@/features/user/shared/ui/instructor-profile-form'
import type { EducationDetailKey } from '@/features/user/shared/ui/instructor-register-education-section'
import {
  buildInstructorRegisterCertifications,
  buildInstructorRegisterEducationLevel,
} from '@/features/user/api/map-instructor-register-extras'
import type {
  InstructorCmsCareerLevel,
  InstructorCmsEducation,
  InstructorCmsEducationSchoolRow,
  InstructorCmsEducationSchoolType,
  InstructorCmsEducationStatus,
  InstructorCmsEssays,
  InstructorCmsGraduateDegree,
  InstructorCmsJaActivityRow,
  InstructorCmsLicenseOrAwardRow,
  InstructorCmsProfileProposal,
  InstructorCmsSettlement,
} from '@/features/user/api/types/instructor-cms-profile-proposal'
import type { InstructorCmsProfile as ApiInstructorCmsProfile } from '@/shared/api/generated/members/schemas/instructorCmsProfile'
import type { InstructorCmsSettlement as ApiInstructorCmsSettlement } from '@/shared/api/generated/members/schemas/instructorCmsSettlement'
import type { InstructorDetailResponse } from '@/shared/api/generated/members/schemas/instructorDetailResponse'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import {
  formatInstructorEducationLevelDisplay,
  toInstructorFeeGradeApiValue,
} from '@/features/user/api/map-instructor-activity-display'
import type { Affiliation } from '@/shared/api/generated/members/schemas/affiliation'
import { parseOrganizationNamesFromText } from '@/features/user/detail/lib/parse-instructor-affiliation-text'

const MONTH_FORMAT = 'YYYY-MM'
const YEAR_FORMAT = 'YYYY'

function formatMonth(value: Dayjs | null | undefined): string | undefined {
  if (value == null || !value.isValid()) return undefined
  return value.format(MONTH_FORMAT)
}

function parseMonth(value: string | undefined): Dayjs | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = dayjs(trimmed, [MONTH_FORMAT, 'YYYY-MM-DD', YEAR_FORMAT], true)
  return parsed.isValid() ? parsed : null
}

function formatYear(value: Dayjs | null | undefined): string | undefined {
  if (value == null || !value.isValid()) return undefined
  return value.format(YEAR_FORMAT)
}

function parseYear(value: string | undefined): Dayjs | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = dayjs(trimmed, [YEAR_FORMAT, `${YEAR_FORMAT}-01-01`], true)
  return parsed.isValid() ? parsed : null
}

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** Form.List는 빈 배열이면 행·입력 UI가 0개 — 편집 화면에서 최소 1행 보장 */
export function ensureInstructorFormListRows<T>(rows: T[] | undefined, emptyRow: T): T[] {
  return rows != null && rows.length > 0 ? rows : [{ ...emptyRow }]
}

function mapCmsEmploymentStatus(
  status: InstructorCmsProfileProposal['affiliation']['employmentStatus']
): SchoolTeacherEmploymentStatus | undefined {
  if (status === 'LEAVE') return 'ON_LEAVE'
  if (status === 'TRANSFER') return 'TRANSFERRED'
  if (status === 'RESIGNED') return 'WITHDRAWN'
  return status
}

function mapSchoolRowToApi(
  row:
    | {
        admitYear: Dayjs | null
        gradYear: Dayjs | null
        schoolName: string
        major: string
      }
    | null
    | undefined
): InstructorCmsEducationSchoolRow | null {
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
  rows: Array<InstructorProfileFormValues['college4Rows'][number] | null | undefined> | null | undefined
): InstructorCmsEducationSchoolRow[] {
  return filterNonEmptyRows((rows ?? []).map(mapSchoolRowToApi))
}

function mapGraduateRowToApi(
  row: InstructorProfileFormValues['graduateRows'][number] | null | undefined
) {
  if (!row) return null
  const base = mapSchoolRowToApi(row)
  if (!base) return null
  const degree = row.degree?.trim()
  return {
    ...base,
    ...(degree === 'master' || degree === 'doctor' ? { degree: degree as InstructorCmsGraduateDegree } : {}),
  }
}

function filterNonEmptyRows<T>(rows: Array<T | null>): T[] {
  return rows.filter((row): row is T => row != null)
}

/** CMS 등록·수정 폼 → BE `profile` */
export function instructorProfileFormValuesToCmsProfile(
  values: InstructorProfileFormValues
): InstructorCmsProfileProposal {
  const memberType = values.memberType === 'school_teacher' ? 'SCHOOL_TEACHER' : 'GENERAL'
  const affiliation =
    memberType === 'SCHOOL_TEACHER'
      ? {
          schoolName: trimOptional(values.schoolName),
          ...(values.employmentStatus
            ? { employmentStatus: values.employmentStatus as InstructorCmsProfileProposal['affiliation']['employmentStatus'] }
            : {}),
          organizationNames: [],
        }
      : {
          organizationNames: values.affiliationNone
            ? []
            : [trimOptional(values.affiliationName)].filter(
                (name): name is string => name != null
              ),
        }

  const education: InstructorCmsEducation = {
    ...(trimOptional(values.eduSchoolType)
      ? { highestSchoolType: values.eduSchoolType as InstructorCmsEducationSchoolType }
      : {}),
    ...(trimOptional(values.eduStatus)
      ? { highestStatus: values.eduStatus as InstructorCmsEducationStatus }
      : {}),
    ...(values.educationDetailKeys.length > 0
      ? { detailKeys: [...values.educationDetailKeys] as InstructorCmsEducationSchoolType[] }
      : {}),
    ...(mapSchoolRowToApi(values.highSchool) ? { highSchool: mapSchoolRowToApi(values.highSchool)! } : {}),
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
    })
  )

  const jaKoreaActivities: InstructorCmsJaActivityRow[] = filterNonEmptyRows(
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
    })
  )

  const licenses: InstructorCmsLicenseOrAwardRow[] = filterNonEmptyRows(
    (values.licenseRows ?? []).map(row => {
      if (!row) return null
      const title = row.title?.trim() ?? ''
      if (!title) return null
      return {
        title,
        ...(trimOptional(row.issuer) ? { issuer: row.issuer.trim() } : {}),
        ...(formatYear(row.acquiredYear) ? { acquiredYear: formatYear(row.acquiredYear) } : {}),
      }
    })
  )

  const awards: InstructorCmsLicenseOrAwardRow[] = filterNonEmptyRows(
    (values.awardRows ?? []).map(row => {
      if (!row) return null
      const title = row.title?.trim() ?? ''
      if (!title) return null
      return {
        title,
        ...(trimOptional(row.issuer) ? { issuer: row.issuer.trim() } : {}),
        ...(formatYear(row.acquiredYear) ? { acquiredYear: formatYear(row.acquiredYear) } : {}),
      }
    })
  )

  const essays: InstructorCmsEssays = {
    ...(trimOptional(values.freeWrite1) ? { freeWrite1: values.freeWrite1.trim() } : {}),
    ...(trimOptional(values.freeWrite2) ? { freeWrite2: values.freeWrite2.trim() } : {}),
    ...(trimOptional(values.freeWrite3) ? { freeWrite3: values.freeWrite3.trim() } : {}),
    ...(trimOptional(values.freeWrite4) ? { freeWrite4: values.freeWrite4.trim() } : {}),
  }

  return {
    memberType,
    affiliation,
    ...(trimOptional(values.instructorCareer)
      ? { instructorCareerSummary: values.instructorCareer.trim() }
      : {}),
    ...(trimOptional(values.instructorFeeGrade)
      ? { defaultFeeGrade: values.instructorFeeGrade.trim() }
      : {}),
    ...(trimOptional(values.jaEvaluationGrade)
      ? { defaultJaGrade: values.jaEvaluationGrade.trim() }
      : {}),
    ...(trimOptional(values.oneLineIntro) ? { oneLineIntro: values.oneLineIntro.trim() } : {}),
    homeAddress: {
      line: values.homeAddress.trim(),
      ...(trimOptional(values.homeAddressDetail) ? { detail: values.homeAddressDetail.trim() } : {}),
    },
    education,
    career: {
      level: values.careerLevel as InstructorCmsCareerLevel,
      rows: careerRows,
      ...(trimOptional(values.instructorCareer)
        ? { summaryYears: values.instructorCareer.trim() }
        : {}),
    },
    jaKoreaActivities,
    licenses,
    awards,
    essays,
  }
}

export function instructorProfileFormValuesToCmsSettlement(
  values: InstructorProfileFormValues
): InstructorCmsSettlement {
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

/** legacy flat `instructorProfile` → `profile` (읽기 호환) */
export function mergeInstructorCmsProfileFromLegacyFlat(
  profile: InstructorCmsProfileProposal,
  legacy: InstructorDetailResponse | null | undefined,
  options?: { looseAffiliation?: string; organizationText?: string }
): InstructorCmsProfileProposal {
  let next = { ...profile }

  if (legacy) {
    const educationLevel = legacy.educationLevel?.trim()
    if (educationLevel && !next.education.highestSchoolType && !next.education.highestStatus) {
      const [schoolType, status] = educationLevel.split(/\s*\/\s*/).map(part => part.trim())
      next = {
        ...next,
        education: {
          ...next.education,
          ...(schoolType ? { highestSchoolType: schoolType as InstructorCmsEducationSchoolType } : {}),
          ...(status ? { highestStatus: status as InstructorCmsEducationStatus } : {}),
        },
      }
    }

    if (legacy.careerText?.trim() && !next.instructorCareerSummary) {
      next.instructorCareerSummary = legacy.careerText.trim()
      next.career = {
        ...next.career,
        summaryYears: legacy.careerText.trim(),
      }
    }

    if (legacy.selfIntroduction?.trim() && !next.essays.freeWrite1) {
      next.essays = { ...next.essays, freeWrite1: legacy.selfIntroduction.trim() }
    }

    if (legacy.oneLineIntro?.trim() && !next.oneLineIntro) {
      next.oneLineIntro = legacy.oneLineIntro.trim()
    }
  }

  return mergeAffiliationFromLooseFields(next, legacy, options)
}

function pickTrimmedAffiliation(
  ...values: Array<string | undefined | null>
): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function mergeAffiliationFromLooseFields(
  profile: InstructorCmsProfileProposal,
  legacy: InstructorDetailResponse | null | undefined,
  options?: { looseAffiliation?: string; organizationText?: string }
): InstructorCmsProfileProposal {
  let next = { ...profile }
  const affiliation = next.affiliation ?? {}
  const legacyLoose = legacy as
    | (InstructorDetailResponse & {
        affiliatedSchoolName?: string
        schoolName?: string
        affiliation?: string
        organizationText?: string
      })
    | null
    | undefined

  if (next.memberType === 'SCHOOL_TEACHER') {
    if (!affiliation.schoolName?.trim()) {
      const school = pickTrimmedAffiliation(
        legacyLoose?.affiliatedSchoolName,
        legacyLoose?.schoolName,
        options?.organizationText
      )
      if (school) {
        next = {
          ...next,
          affiliation: { ...affiliation, schoolName: school, organizationNames: [] },
        }
      }
    }
    return next
  }

  const existingOrgs =
    affiliation.organizationNames?.map(name => name.trim()).filter(Boolean) ?? []
  if (existingOrgs.length > 0) {
    return next
  }

  const fromText = pickTrimmedAffiliation(
    options?.organizationText,
    options?.looseAffiliation,
    legacyLoose?.affiliation,
    legacyLoose?.organizationText
  )
  const parsed = parseOrganizationNamesFromText(fromText)
  if (parsed.length === 0) {
    return next
  }

  return {
    ...next,
    affiliation: { organizationNames: parsed },
  }
}

function mapSchoolRowToForm(row: InstructorCmsEducationSchoolRow | undefined) {
  if (!row) return undefined
  return {
    admitYear: parseMonth(row.admitYear),
    gradYear: parseMonth(row.gradYear),
    schoolName: row.schoolName ?? '',
    major: row.major ?? '',
  }
}

function mapGraduateRowToForm(row: InstructorCmsEducationSchoolRow & { degree?: InstructorCmsGraduateDegree }) {
  const base = mapSchoolRowToForm(row)
  if (!base) return undefined
  return { ...base, degree: row.degree ?? '' }
}

/** BE `profile` → CMS 등록·수정 폼 partial */
export function instructorCmsProfileToFormValues(
  profile: InstructorCmsProfileProposal
): Partial<InstructorProfileFormValues> {
  const memberType = profile.memberType === 'SCHOOL_TEACHER' ? 'school_teacher' : 'general'
  const affiliation = profile.affiliation ?? {}

  return {
    memberType,
    ...(memberType === 'school_teacher'
      ? {
          schoolName: affiliation.schoolName ?? '',
          employmentStatus: mapCmsEmploymentStatus(affiliation.employmentStatus) ?? '',
          affiliationName: '',
          affiliationNone: false,
        }
      : {
          schoolName: '',
          employmentStatus: '',
          affiliationName: affiliation.organizationNames?.[0] ?? '',
          affiliationNone: (affiliation.organizationNames?.length ?? 0) === 0,
        }),
    instructorCareer: profile.instructorCareerSummary ?? profile.career.summaryYears ?? '',
    instructorFeeGrade: profile.defaultFeeGrade ?? '',
    jaEvaluationGrade: profile.defaultJaGrade ?? '',
    oneLineIntro: profile.oneLineIntro ?? '',
    homeAddress: profile.homeAddress.line ?? '',
    homeAddressDetail: profile.homeAddress.detail ?? '',
    eduSchoolType: profile.education.highestSchoolType ?? '',
    eduStatus: profile.education.highestStatus ?? '',
    educationDetailKeys: (profile.education.detailKeys ?? []) as EducationDetailKey[],
    ...(mapSchoolRowToForm(profile.education.highSchool)
      ? { highSchool: mapSchoolRowToForm(profile.education.highSchool)! }
      : {}),
    college23Rows:
      profile.education.college23?.map(row => mapSchoolRowToForm(row)!).filter(Boolean) ?? undefined,
    college4Rows:
      profile.education.college4?.map(row => mapSchoolRowToForm(row)!).filter(Boolean) ?? undefined,
    graduateRows:
      profile.education.graduate?.map(row => mapGraduateRowToForm(row)!).filter(Boolean) ?? undefined,
    careerLevel: profile.career.level ?? 'experienced',
    careers: ensureInstructorFormListRows(
      profile.career.rows?.map(row => ({
        companyName: row.companyName ?? '',
        roleName: row.roleName ?? '',
        periodStart: parseMonth(row.periodStart),
        periodEnd: parseMonth(row.periodEnd),
        currentlyEmployed: row.currentlyEmployed ?? false,
      })),
      EMPTY_CAREER
    ),
    jaKoreaRows: ensureInstructorFormListRows(
      profile.jaKoreaActivities?.map(row => ({
        title: row.title ?? '',
        note: row.note ?? '',
        periodStart: parseMonth(row.periodStart),
        periodEnd: parseMonth(row.periodEnd),
      })),
      EMPTY_JA_KOREA_ROW
    ),
    licenseRows: ensureInstructorFormListRows(
      profile.licenses?.map(row => ({
        title: row.title ?? '',
        issuer: row.issuer ?? '',
        acquiredYear: parseYear(row.acquiredYear),
      })),
      EMPTY_LICENSE_OR_AWARD_ROW
    ),
    awardRows: ensureInstructorFormListRows(
      profile.awards?.map(row => ({
        title: row.title ?? '',
        issuer: row.issuer ?? '',
        acquiredYear: parseYear(row.acquiredYear),
      })),
      EMPTY_LICENSE_OR_AWARD_ROW
    ),
    freeWrite1: profile.essays.freeWrite1 ?? '',
    freeWrite2: profile.essays.freeWrite2 ?? '',
    freeWrite3: profile.essays.freeWrite3 ?? '',
    freeWrite4: profile.essays.freeWrite4 ?? '',
  }
}

function mapEducationSchoolTypeLabel(type: InstructorCmsEducationSchoolType | string | undefined): string {
  switch (type) {
    case 'high':
      return '고등학교'
    case 'college23':
      return '대학교 2, 3년제'
    case 'college4':
      return '대학교 4년제'
    case 'graduate':
      return '대학원'
    default:
      return type?.trim() ?? ''
  }
}

function mapEducationStatusLabel(status: InstructorCmsEducationStatus | string | undefined): string {
  switch (status) {
    case 'enrolled':
      return '재학'
    case 'graduated':
      return '졸업'
    case 'completed':
      return '수료'
    default:
      return status?.trim() ?? ''
  }
}

function educationRowsToApplicantItems(
  education: InstructorCmsEducation
): ApplicantInstructorEducationItem[] {
  const items: ApplicantInstructorEducationItem[] = []
  const pushRow = (
    schoolType: string,
    row: InstructorCmsEducationSchoolRow,
    status?: string,
    degreeLabel?: string
  ) => {
    if (!row.schoolName?.trim()) return
    const majorParts = [row.major?.trim(), degreeLabel].filter(Boolean)
    items.push({
      schoolType,
      ...(status ? { status } : {}),
      schoolName: row.schoolName.trim(),
      ...(majorParts.length > 0 ? { major: majorParts.join(' · ') } : {}),
      ...(row.admitYear ? { enrollmentYear: row.admitYear.slice(0, 4) } : {}),
      ...(row.gradYear ? { graduationYear: row.gradYear.slice(0, 4) } : {}),
    })
  }

  if (education.highSchool) {
    pushRow(
      mapEducationSchoolTypeLabel('high'),
      education.highSchool,
      mapEducationStatusLabel(education.highestSchoolType === 'high' ? education.highestStatus : undefined)
    )
  }
  for (const row of education.college23 ?? []) {
    pushRow(mapEducationSchoolTypeLabel('college23'), row, mapEducationStatusLabel(education.highestStatus))
  }
  for (const row of education.college4 ?? []) {
    pushRow(mapEducationSchoolTypeLabel('college4'), row, mapEducationStatusLabel(education.highestStatus))
  }
  for (const row of education.graduate ?? []) {
    const gradRow = row as InstructorCmsEducationSchoolRow & { degree?: InstructorCmsGraduateDegree }
    pushRow(
      mapEducationSchoolTypeLabel('graduate'),
      gradRow,
      mapEducationStatusLabel(education.highestStatus),
      gradRow.degree === 'doctor' ? '박사' : gradRow.degree === 'master' ? '석사' : undefined
    )
  }

  if (items.length === 0 && education.highestSchoolType) {
    const typeLabel = mapEducationSchoolTypeLabel(education.highestSchoolType)
    const statusLabel = mapEducationStatusLabel(education.highestStatus)
    items.push({
      schoolType: typeLabel,
      ...(statusLabel ? { status: statusLabel } : {}),
    })
  }

  return items
}

function mapCareerRowsToApplicantDetails(
  profile: InstructorCmsProfileProposal
): ApplicantInstructorCareerDetail[] {
  return (profile.career.rows ?? []).map(row => ({
    companyName: row.companyName,
    role: row.roleName,
    startDate: row.periodStart,
    endDate: row.currentlyEmployed ? undefined : row.periodEnd,
    isCurrent: row.currentlyEmployed,
  }))
}

function mapLicenseRowsToQualifications(
  licenses: InstructorCmsLicenseOrAwardRow[] | undefined
): NonNullable<ApplicantInstructorRow['qualifications']> {
  return (licenses ?? [])
    .filter(row => row.title?.trim())
    .map(row => ({
      name: row.title.trim(),
      ...(row.acquiredYear ? { year: row.acquiredYear.slice(0, 4) } : {}),
    }))
}

function mapAwardRows(awards: InstructorCmsLicenseOrAwardRow[] | undefined): ApplicantInstructorAward[] {
  return (awards ?? [])
    .filter(row => row.title?.trim())
    .map(row => ({
      name: row.title.trim(),
      ...(row.acquiredYear ? { year: row.acquiredYear.slice(0, 4) } : {}),
    }))
}

/** BE `profile` → 강사 이력서 view row partial */
export function instructorCmsProfileToApplicantInstructorRowPartial(
  profile: InstructorCmsProfileProposal
): Pick<
  ApplicantInstructorRow,
  | 'careerDetails'
  | 'educations'
  | 'qualifications'
  | 'awards'
  | 'freeWriting1'
  | 'freeWriting2'
  | 'freeWriting3'
  | 'freeWriting4'
  | 'educationLevel'
  | 'educationSchoolName'
  | 'teachingExperience'
  | 'oneLineIntro'
  | 'instructorCareerLevel'
> {
  const educations = educationRowsToApplicantItems(profile.education)
  const highestLabel = [
    profile.education.highestSchoolType
      ? formatInstructorEducationLevelDisplay(
          `${profile.education.highestSchoolType} / ${profile.education.highestStatus ?? ''}`.trim()
        )
      : undefined,
  ]
    .filter(Boolean)
    .join(' / ')

  const finalSchool =
    educations.find(item => item.schoolName?.trim())?.schoolName ??
    profile.education.highSchool?.schoolName ??
    profile.education.college4?.[0]?.schoolName

  return {
    careerDetails: mapCareerRowsToApplicantDetails(profile),
    educations,
    qualifications: mapLicenseRowsToQualifications(profile.licenses),
    awards: mapAwardRows(profile.awards),
    freeWriting1: profile.essays.freeWrite1 ?? '',
    freeWriting2: profile.essays.freeWrite2 ?? '',
    freeWriting3: profile.essays.freeWrite3 ?? '',
    freeWriting4: profile.essays.freeWrite4 ?? '',
    educationLevel: highestLabel || mapEducationSchoolTypeLabel(profile.education.highestSchoolType),
    educationSchoolName: finalSchool ?? '-',
    teachingExperience:
      profile.instructorCareerSummary?.trim() ||
      profile.career.summaryYears?.trim() ||
      (profile.career.level === 'new' ? '신입' : ''),
    oneLineIntro: profile.oneLineIntro?.trim() || '-',
    instructorCareerLevel: profile.career.level,
  }
}

function mapApiEmploymentStatus(
  raw: string | undefined
): InstructorCmsProfileProposal['affiliation']['employmentStatus'] {
  const v = raw?.trim().toUpperCase()
  if (v === 'ACTIVE' || v === 'LEAVE' || v === 'TRANSFER' || v === 'RESIGNED') {
    return v as InstructorCmsProfileProposal['affiliation']['employmentStatus']
  }
  if (v === 'ON_LEAVE') return 'LEAVE'
  if (v === 'WITHDRAWN') return 'RESIGNED'
  if (v === 'TRANSFERRED') return 'TRANSFER'
  return undefined
}

/** OpenAPI `InstructorCmsProfile` → CMS proposal DTO */
export function normalizeInstructorCmsProfileFromApi(
  profile: ApiInstructorCmsProfile | undefined
): InstructorCmsProfileProposal | undefined {
  if (!profile) return undefined

  const memberTypeRaw = profile.memberType?.trim().toUpperCase()
  const memberType: InstructorCmsProfileProposal['memberType'] =
    memberTypeRaw === 'SCHOOL_TEACHER' ? 'SCHOOL_TEACHER' : 'GENERAL'

  return {
    memberType,
    ...(profile.status?.trim() ? { status: profile.status.trim() } : {}),
    affiliation: {
      ...(profile.affiliation?.schoolName?.trim()
        ? { schoolName: profile.affiliation.schoolName.trim() }
        : {}),
      ...(mapApiEmploymentStatus(profile.affiliation?.employmentStatus)
        ? { employmentStatus: mapApiEmploymentStatus(profile.affiliation?.employmentStatus) }
        : {}),
      organizationNames: profile.affiliation?.organizationNames?.map(name => name.trim()).filter(Boolean) ?? [],
      ...(profile.affiliation?.affiliatedSchoolUserId != null
        ? { affiliatedSchoolUserId: String(profile.affiliation.affiliatedSchoolUserId) }
        : {}),
    },
    ...(profile.instructorCareerSummary?.trim()
      ? { instructorCareerSummary: profile.instructorCareerSummary.trim() }
      : {}),
    ...(profile.oneLineIntro?.trim() ? { oneLineIntro: profile.oneLineIntro.trim() } : {}),
    homeAddress: {
      line: profile.homeAddress?.line?.trim() ?? '',
      ...(profile.homeAddress?.detail?.trim()
        ? { detail: profile.homeAddress.detail.trim() }
        : {}),
    },
    education: (profile.education ?? {}) as InstructorCmsEducation,
    // Orval Career/rows·활동·자격 item이 `{[key: string]: unknown}` 이라 proposal DTO로 unknown 경유
    career: (profile.career ?? { level: 'experienced', rows: [] }) as unknown as InstructorCmsProfileProposal['career'],
    jaKoreaActivities: (profile.jaKoreaActivities ??
      []) as unknown as InstructorCmsProfileProposal['jaKoreaActivities'],
    licenses: (profile.licenses ?? []) as unknown as InstructorCmsProfileProposal['licenses'],
    awards: (profile.awards ?? []) as unknown as InstructorCmsProfileProposal['awards'],
    essays: (profile.essays ?? {}) as InstructorCmsEssays,
    defaultFeeGrade: profile.defaultFeeGrade ?? null,
    defaultJaGrade: profile.defaultJaGrade ?? null,
  }
}

function toApiAffiliation(
  affiliation: InstructorCmsProfileProposal['affiliation']
): Affiliation {
  const result: Affiliation = {}
  if (affiliation.schoolName?.trim()) result.schoolName = affiliation.schoolName.trim()
  if (affiliation.employmentStatus) result.employmentStatus = affiliation.employmentStatus
  const orgs = affiliation.organizationNames?.map(name => name.trim()).filter(Boolean) ?? []
  if (orgs.length > 0) result.organizationNames = orgs
  const schoolUserId = affiliation.affiliatedSchoolUserId?.trim()
  if (schoolUserId) {
    const parsed = Number(schoolUserId)
    if (Number.isFinite(parsed)) result.affiliatedSchoolUserId = parsed
  }
  return result
}

/** CMS proposal DTO → OpenAPI `InstructorCmsProfile` (pre-register·PATCH wire) */
export function toApiInstructorCmsProfile(
  profile: InstructorCmsProfileProposal
): ApiInstructorCmsProfile {
  const feeGrade = toInstructorFeeGradeApiValue(profile.defaultFeeGrade)
  const jaGrade = profile.defaultJaGrade?.trim() || undefined

  return {
    memberType: profile.memberType,
    affiliation: toApiAffiliation(profile.affiliation),
    ...(profile.instructorCareerSummary?.trim()
      ? { instructorCareerSummary: profile.instructorCareerSummary.trim() }
      : {}),
    ...(profile.oneLineIntro?.trim() ? { oneLineIntro: profile.oneLineIntro.trim() } : {}),
    homeAddress: {
      line: profile.homeAddress.line.trim(),
      ...(profile.homeAddress.detail?.trim()
        ? { detail: profile.homeAddress.detail.trim() }
        : {}),
    },
    education: profile.education as ApiInstructorCmsProfile['education'],
    career: profile.career as unknown as ApiInstructorCmsProfile['career'],
    jaKoreaActivities:
      profile.jaKoreaActivities as unknown as ApiInstructorCmsProfile['jaKoreaActivities'],
    licenses: profile.licenses as unknown as ApiInstructorCmsProfile['licenses'],
    awards: profile.awards as unknown as ApiInstructorCmsProfile['awards'],
    essays: profile.essays as ApiInstructorCmsProfile['essays'],
    ...(feeGrade ? { defaultFeeGrade: feeGrade } : {}),
    ...(jaGrade ? { defaultJaGrade: jaGrade } : {}),
  }
}

/** CMS proposal DTO → OpenAPI `InstructorCmsSettlement` (pre-register·PATCH wire) */
export function toApiInstructorCmsSettlement(
  settlement: InstructorCmsSettlement
): ApiInstructorCmsSettlement {
  return {
    ...(settlement.bankName?.trim() ? { bankName: settlement.bankName.trim() } : {}),
    ...(settlement.accountNumber?.trim()
      ? { accountNumber: settlement.accountNumber.trim() }
      : {}),
    ...(settlement.accountHolder?.trim() ? { accountHolder: settlement.accountHolder.trim() } : {}),
    businessIncome: settlement.businessIncome ?? false,
  }
}

/** OpenAPI `InstructorCmsSettlement` → CMS proposal DTO */
export function normalizeInstructorCmsSettlementFromApi(
  settlement: ApiInstructorCmsSettlement | undefined
): InstructorCmsSettlement | undefined {
  if (!settlement) return undefined
  return {
    ...(settlement.bankName?.trim() ? { bankName: settlement.bankName.trim() } : {}),
    ...(settlement.accountNumber?.trim() ? { accountNumber: settlement.accountNumber.trim() } : {}),
    ...(settlement.accountHolder?.trim() ? { accountHolder: settlement.accountHolder.trim() } : {}),
    businessIncome: settlement.businessIncome ?? false,
  }
}

/** CMS `profile` → legacy flat `instructorProfile` (읽기 호환) */
export function synthesizeLegacyInstructorProfileFromCms(
  cmsProfile: InstructorCmsProfileProposal,
  cmsSettlement: InstructorCmsSettlement | undefined,
  memberId?: number
): InstructorDetailResponse {
  const flat = buildLegacyFlatFieldsFromCmsProfile(cmsProfile)
  return {
    ...(memberId != null ? { memberId } : {}),
    primaryActivityType: cmsProfile.memberType === 'SCHOOL_TEACHER' ? 'SCHOOL_TEACHER' : 'GENERAL',
    ...(cmsProfile.status?.trim() ? { status: cmsProfile.status.trim() } : {}),
    ...(flat.educationLevel ? { educationLevel: flat.educationLevel } : {}),
    ...(flat.careerText ? { careerText: flat.careerText } : {}),
    ...(flat.selfIntroduction ? { selfIntroduction: flat.selfIntroduction } : {}),
    ...(flat.oneLineIntro ? { oneLineIntro: flat.oneLineIntro } : {}),
    ...(cmsProfile.homeAddress.line?.trim()
      ? { homeAddress: cmsProfile.homeAddress.line.trim() }
      : {}),
    ...(cmsProfile.homeAddress.detail?.trim()
      ? { homeAddressDetail: cmsProfile.homeAddress.detail.trim() }
      : {}),
    ...(cmsProfile.defaultFeeGrade?.trim()
      ? { defaultFeeGrade: cmsProfile.defaultFeeGrade.trim() }
      : {}),
    ...(cmsProfile.defaultJaGrade?.trim()
      ? { defaultJaGrade: cmsProfile.defaultJaGrade.trim() }
      : {}),
    ...(cmsSettlement?.businessIncome != null
      ? { businessIncomeYn: cmsSettlement.businessIncome }
      : {}),
    ...(cmsProfile.affiliation.schoolName?.trim()
      ? { affiliatedSchoolName: cmsProfile.affiliation.schoolName.trim() }
      : {}),
    ...(cmsProfile.affiliation.employmentStatus
      ? { employmentStatus: cmsProfile.affiliation.employmentStatus }
      : {}),
  }
}

/** pre-register / PATCH — legacy flat 필드 (읽기 호환 1 release) */
export function buildLegacyFlatFieldsFromCmsProfile(profile: InstructorCmsProfileProposal): {
  educationLevel?: string
  careerText?: string
  selfIntroduction?: string
  oneLineIntro?: string
} {
  return {
    educationLevel: buildInstructorRegisterEducationLevel({
      eduSchoolType: profile.education.highestSchoolType,
      eduStatus: profile.education.highestStatus,
    }),
    careerText: trimOptional(profile.instructorCareerSummary ?? profile.career.summaryYears),
    selfIntroduction: trimOptional(profile.essays.freeWrite1),
    oneLineIntro: trimOptional(profile.oneLineIntro),
  }
}

export function mapCertificationsFromCmsLicenses(
  licenses: InstructorCmsLicenseOrAwardRow[] | undefined,
  existingCertifications?: InstructorProfileFormValues['licenseRows']
) {
  const rows =
    licenses?.map(row => ({
      title: row.title ?? '',
      issuer: row.issuer ?? '',
      acquiredYear: parseYear(row.acquiredYear),
      certificationId: existingCertifications?.find(item => item.title === row.title)?.certificationId,
    })) ?? []
  return buildInstructorRegisterCertifications(rows)
}
