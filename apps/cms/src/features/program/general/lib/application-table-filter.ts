import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'

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
