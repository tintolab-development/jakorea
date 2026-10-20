import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'

const ACTIVE_APPROVAL_STATUSES = new Set<ParticipatingSchoolRow['approvalStatus']>(['approved'])

/**
 * 동일 기관명·다른 학년 참여 기관 목록 (합반 대상 lookup)
 */
export function getSameSchoolParticipatingGrades(
  rows: ParticipatingSchoolRow[],
  schoolName: string,
  excludeSchoolId: string,
  leadGrade?: string
): ParticipatingSchoolRow[] {
  const normalizedSchoolName = schoolName.trim()
  const normalizedLeadGrade = leadGrade?.trim() ?? ''
  if (!normalizedSchoolName) return []

  return rows.filter(row => {
    if (row.id === excludeSchoolId) return false
    if (row.schoolName.trim() !== normalizedSchoolName) return false
    if (!ACTIVE_APPROVAL_STATUSES.has(row.approvalStatus)) return false
    if (normalizedLeadGrade && row.educationGrade.trim() === normalizedLeadGrade) return false
    return true
  })
}
