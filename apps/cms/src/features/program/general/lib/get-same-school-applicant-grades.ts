import { canMergeCombinedClassByEducationDate } from '@/features/program/general/lib/combined-class-education-dates'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'

const ACTIVE_APPROVAL_STATUSES = new Set<ApplicantSchoolRow['approvalStatus']>(['approved'])

/**
 * 동일 프로그램·동일 학교명의 다른 학년 신청 목록 (합반 대상 lookup)
 * 리드와 교육일 집합이 완전히 같은 건만 남긴다.
 */
export function getSameSchoolApplicantGrades(
  rows: ApplicantSchoolRow[],
  programId: string,
  schoolName: string,
  excludeApplicantId: string,
  leadGrade?: string
): ApplicantSchoolRow[] {
  const normalizedSchoolName = schoolName.trim()
  const normalizedLeadGrade = leadGrade?.trim() ?? ''
  if (!normalizedSchoolName || !programId) return []

  const lead = rows.find(row => row.id === excludeApplicantId)
  if (!lead) return []

  return rows.filter(row => {
    if (row.id === excludeApplicantId) return false
    if (row.programId !== programId) return false
    if (row.schoolName.trim() !== normalizedSchoolName) return false
    if (!ACTIVE_APPROVAL_STATUSES.has(row.approvalStatus)) return false
    if (normalizedLeadGrade && row.educationGrade.trim() === normalizedLeadGrade) return false
    return canMergeCombinedClassByEducationDate(lead, row)
  })
}
