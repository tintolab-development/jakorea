import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import { matchesInstructorJaExperienceYears } from '@/features/program/general/lib/instructor-application-filter-options'
import type { InstructorCalendarFilterPreset } from '@/features/program/shared/ui/program-detail/applicant-list/applicant-list-menu'

function matchesAddressRegion(
  address: string,
  sido: unknown,
  sigungu: unknown
): boolean {
  const sidoStr = typeof sido === 'string' ? sido.trim() : ''
  const sigunguStr = typeof sigungu === 'string' ? sigungu.trim() : ''
  if (sidoStr && !address.includes(sidoStr)) return false
  if (sigunguStr && !address.includes(sigunguStr)) return false
  return true
}

/** 일반 상세 — 기관 신청 목록 필터 */
export function filterGeneralOrganizationApplications(
  rows: ApplicantSchoolRow[],
  appliedFilters: Record<string, unknown>
): ApplicantSchoolRow[] {
  const organizationName = String(appliedFilters.organizationName ?? '').trim()
  const teacherName = String(appliedFilters.teacherName ?? '').trim()
  const grade = appliedFilters.grade
  const approvalStatus = appliedFilters.approvalStatus
  const institutionSido = appliedFilters.institutionSido
  const institutionSigungu = appliedFilters.institutionSigungu

  return rows.filter(item => {
    if (organizationName && !item.schoolName.includes(organizationName)) return false
    if (
      !matchesAddressRegion(item.region, institutionSido, institutionSigungu)
    ) {
      return false
    }
    if (grade && grade !== 'all' && item.educationGrade !== grade) return false
    if (teacherName && !item.teacherName.includes(teacherName)) return false
    if (
      approvalStatus &&
      approvalStatus !== 'all' &&
      item.approvalStatus !== approvalStatus
    ) {
      return false
    }
    return true
  })
}

/** 일반 상세 — 개인(참여자) 신청 목록 필터 */
export function filterGeneralIndividualApplications(
  rows: GeneralIndividualApplicantRow[],
  appliedFilters: Record<string, unknown>
): GeneralIndividualApplicantRow[] {
  const applicantName = String(appliedFilters.applicantName ?? '').trim()
  const affiliation = String(appliedFilters.affiliation ?? '').trim()
  const grade = appliedFilters.grade
  const approvalStatus = appliedFilters.approvalStatus
  const homeSido = appliedFilters.homeSido
  const homeSigungu = appliedFilters.homeSigungu

  return rows.filter(item => {
    if (applicantName && !item.applicantName.includes(applicantName)) return false
    if (affiliation && !item.affiliation.includes(affiliation)) return false
    if (grade && grade !== 'all' && item.educationGrade !== grade) return false
    if (!matchesAddressRegion(item.homeAddress, homeSido, homeSigungu)) return false
    if (
      approvalStatus &&
      approvalStatus !== 'all' &&
      item.approvalStatus !== approvalStatus
    ) {
      return false
    }
    return true
  })
}

/** 일반 상세 — 강사 신청 목록 필터 */
export function filterGeneralInstructorApplications(
  rows: ApplicantInstructorRow[],
  appliedFilters: Record<string, unknown>
): ApplicantInstructorRow[] {
  const instructorName = String(appliedFilters.instructorName ?? '').trim()
  const experienceYears = appliedFilters.experienceYears
  const evaluationGrade = appliedFilters.evaluationGrade
  const approvalStatus = appliedFilters.approvalStatus
  const homeSido = appliedFilters.homeSido
  const homeSigungu = appliedFilters.homeSigungu

  return rows.filter(item => {
    if (instructorName && !item.instructorName.includes(instructorName)) return false
    if (!matchesAddressRegion(item.address, homeSido, homeSigungu)) return false
    if (!matchesInstructorJaExperienceYears(item.lectureExperienceYears, experienceYears)) return false
    if (
      evaluationGrade &&
      evaluationGrade !== 'all' &&
      item.evaluationGrade !== evaluationGrade
    ) {
      return false
    }
    if (
      approvalStatus &&
      approvalStatus !== 'all' &&
      item.approvalStatus !== approvalStatus
    ) {
      return false
    }
    return true
  })
}

function instructorMatchesGrade(
  item: ApplicantInstructorRow,
  grade: unknown
): boolean {
  if (!grade || grade === 'all') return true
  const grades = item.preferredSchools?.map(p => p.grade).filter(Boolean) ?? []
  if (grades.length === 0) return false
  return grades.some(g => g === grade)
}

/** 일반 상세 — 강사 신청 목록 캘린더 뷰 필터 */
export function filterGeneralInstructorCalendarApplications(
  rows: ApplicantInstructorRow[],
  appliedFilters: Record<string, unknown>
): ApplicantInstructorRow[] {
  const organizationName = String(appliedFilters.organizationName ?? '').trim()
  const instructorName = String(appliedFilters.instructorName ?? '').trim()
  const grade = appliedFilters.grade
  const approvalStatus = appliedFilters.approvalStatus
  const homeSido = appliedFilters.homeSido
  const homeSigungu = appliedFilters.homeSigungu

  return rows.filter(item => {
    if (organizationName && !item.schoolName.includes(organizationName)) return false
    if (instructorName && !item.instructorName.includes(instructorName)) return false
    if (!matchesAddressRegion(item.address, homeSido, homeSigungu)) return false
    if (!instructorMatchesGrade(item, grade)) return false
    if (
      approvalStatus &&
      approvalStatus !== 'all' &&
      item.approvalStatus !== approvalStatus
    ) {
      return false
    }
    return true
  })
}

const GENERAL_INSTRUCTOR_LIST_ONLY_FILTER_KEYS = ['experienceYears', 'evaluationGrade'] as const
const GENERAL_INSTRUCTOR_CALENDAR_ONLY_FILTER_KEYS = ['organizationName', 'grade'] as const

/**
 * 강사 신청 리스트↔캘린더 전환 시 뷰에 없는 필터 키만 제거 (승인·주소·강사명 등 공통 키 유지).
 * `list-parity`(일반 기관형)는 두 뷰 필터가 같아 리스트 키를 캘린더로 그대로 넘긴다.
 */
export function mergeGeneralInstructorFiltersOnViewModeChange(
  filters: Record<string, unknown>,
  targetViewMode: 'table' | 'calendar',
  calendarFilterPreset: InstructorCalendarFilterPreset = 'calendar-only'
): Record<string, unknown> {
  const dropKeys =
    targetViewMode === 'calendar'
      ? calendarFilterPreset === 'list-parity'
        ? []
        : GENERAL_INSTRUCTOR_LIST_ONLY_FILTER_KEYS
      : GENERAL_INSTRUCTOR_CALENDAR_ONLY_FILTER_KEYS
  const next = { ...filters }
  for (const key of dropKeys) {
    delete next[key]
  }
  return next
}
