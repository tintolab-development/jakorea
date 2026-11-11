import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

/**
 * 희망 배정 기관 순위(`preferredSchools[].rank`) 라벨 — `N지망`.
 * 순위는 회차·차시가 아니므로 `N차시`/`N회차`로 쓰지 않는다. 순위가 없으면 지어내지 않는다.
 */
function formatPreferredSchoolRankLabel(rank: number | undefined): string | null {
  return typeof rank === 'number' && Number.isInteger(rank) && rank > 0 ? `${rank}지망` : null
}

/** 희망 배정 학교·기관 — 지망·시간 요약 */
export function getInstructorCalendarSessionSummary(
  instructor: ApplicantInstructorRow,
  schoolName: string
): string {
  const normalizedSchool = schoolName.trim()
  const pref =
    instructor.preferredSchools?.find(
      p =>
        normalizedSchool &&
        normalizedSchool !== '기관 미지정' &&
        p.schoolName?.trim() === normalizedSchool
    ) ?? instructor.preferredSchools?.[0]
  if (pref?.grade) {
    const timeMatch = pref.dateRange?.match(/(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
    if (timeMatch) {
      const rankLabel = formatPreferredSchoolRankLabel(pref.rank)
      const timeLabel = `${timeMatch[1]}~${timeMatch[2]}`
      return rankLabel ? `${rankLabel} ${timeLabel}` : timeLabel
    }
    if (pref.dateRange) {
      return `${pref.grade} (${pref.dateRange})`
    }
    return pref.grade
  }
  return '-'
}

/** 캘린더 우측 카드 — 강사명 옆 지망 라벨만 (시간·학년 제외) */
export function getInstructorCalendarRoundLabel(
  instructor: ApplicantInstructorRow,
  schoolName: string
): string {
  const normalizedSchool = schoolName.trim()
  const pref =
    instructor.preferredSchools?.find(
      p =>
        normalizedSchool &&
        normalizedSchool !== '기관 미지정' &&
        p.schoolName?.trim() === normalizedSchool
    ) ?? instructor.preferredSchools?.[0]
  if (!pref) return '-'
  return formatPreferredSchoolRankLabel(pref.rank) ?? '-'
}

/** 캘린더 우측 카드 2행 — `2지망 (09:20 ~ 11:20)`, 지망이 없으면 `09:20 ~ 11:20` */
export function getInstructorCalendarSessionCardLabel(
  instructor: ApplicantInstructorRow,
  schoolName: string
): string {
  const summary = getInstructorCalendarSessionSummary(instructor, schoolName)
  const match = summary.match(/^(\d+지망)\s+(\d{1,2}:\d{2})~(\d{1,2}:\d{2})$/)
  if (match) {
    return `${match[1]} (${match[2]} ~ ${match[3]})`
  }
  const timeOnly = summary.match(/^(\d{1,2}:\d{2})~(\d{1,2}:\d{2})$/)
  if (timeOnly) return `${timeOnly[1]} ~ ${timeOnly[2]}`
  const roundOnly = getInstructorCalendarRoundLabel(instructor, schoolName)
  return roundOnly !== '-' ? roundOnly : '-'
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
