import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'

/** 희망 배정 학교·기관 sessions mock 기반 회차·시간 요약 */
export function getInstructorCalendarSessionSummary(
  instructor: ApplicantInstructorRow,
  schoolName: string
): string {
  const pref =
    instructor.preferredSchools?.find(p => p.schoolName === schoolName) ??
    instructor.preferredSchools?.[0]
  if (pref?.grade) {
    const timeMatch = pref.dateRange?.match(/(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
    if (timeMatch) {
      const roundLabel = pref.rank ? `${pref.rank}차시` : '1차시'
      return `${roundLabel} ${timeMatch[1]}~${timeMatch[2]}`
    }
    if (pref.dateRange) {
      return `${pref.grade} (${pref.dateRange})`
    }
    return pref.grade
  }
  return '-'
}

export function getInstructorTooltipSessionLabel(
  item: Record<string, unknown> | null | undefined
): string | null {
  if (!item) return null
  const schoolName = typeof item.schoolName === 'string' ? item.schoolName : ''
  const instructors = item.calendarInstitutionInstructors as ApplicantInstructorRow[] | undefined
  const target =
    instructors?.[0] ??
    (typeof item.instructorName === 'string' ? (item as unknown as ApplicantInstructorRow) : null)
  if (!target || typeof target !== 'object') return null
  const summary = getInstructorCalendarSessionSummary(target as unknown as ApplicantInstructorRow, schoolName)
  return summary !== '-' ? summary : null
}
