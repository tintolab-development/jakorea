import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'

const ACTIVE_APPROVAL_STATUSES = new Set<ApplicantSchoolRow['approvalStatus']>(['approved', 'pending'])

/**
 * 동일 프로그램·동일 학교명의 다른 학년 신청 목록 (합반 대상 lookup)
 */
export function getSameSchoolApplicantGrades(
  rows: ApplicantSchoolRow[],
  programId: string,
  schoolName: string,
  excludeApplicantId: string
): ApplicantSchoolRow[] {
  const normalizedSchoolName = schoolName.trim()
  if (!normalizedSchoolName || !programId) return []

  return rows.filter(row => {
    if (row.id === excludeApplicantId) return false
    if (row.programId !== programId) return false
    if (row.schoolName.trim() !== normalizedSchoolName) return false
    if (!ACTIVE_APPROVAL_STATUSES.has(row.approvalStatus)) return false
    return true
  })
}
