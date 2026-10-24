import dayjs from 'dayjs'
import { formatDateRangeDotWithWeekday } from '@/shared/utils/date'
import type { InstructorPreferredOrganizationResponse } from '@/shared/api/generated/dashboard/schemas/instructorPreferredOrganizationResponse'
import type { ApplicantInstructorPreferredSchool } from '@/features/program/shared/model/applicant-instructor'

function formatPreferredOrganizationDateRangeFromInstants(
  startAt?: string | null,
  endAt?: string | null
): string | undefined {
  const start = startAt?.trim()
  const end = endAt?.trim()
  if (!start || !end) return undefined
  const startDay = dayjs(start)
  const endDay = dayjs(end)
  if (!startDay.isValid() || !endDay.isValid()) return undefined
  const range = formatDateRangeDotWithWeekday(startDay, endDay)
  return range === '-' ? undefined : range
}

export function mapInstructorPreferredOrganizationsToPreferredSchools(
  organizations: InstructorPreferredOrganizationResponse[] | undefined | null
): ApplicantInstructorPreferredSchool[] {
  if (!organizations?.length) return []

  const rows: ApplicantInstructorPreferredSchool[] = []

  for (const [index, entry] of organizations.entries()) {
    const rank = entry.preferenceOrder ?? index + 1
    const schoolName = entry.organizationName?.trim() ?? ''
    const dateRange =
      entry.dateRangeLabel?.trim() ||
      formatPreferredOrganizationDateRangeFromInstants(entry.startAt, entry.endAt)
    if (!schoolName && !dateRange) continue

    const scheduleId = entry.scheduleId
    const schoolId =
      scheduleId != null && Number.isFinite(scheduleId) ? String(scheduleId) : `pref-${rank}`

    rows.push({
      schoolId,
      schoolName,
      rank,
      assignable: true,
      grade: entry.educationGrade?.trim() || undefined,
      dateRange,
    })
  }

  return rows
}
