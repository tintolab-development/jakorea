/**
 * UJAT 교육 진행 현황 — 빈 stub getters
 * @see apps/cms/.cursor/rules/process/program-no-fe-mock.mdc
 */

import { UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES } from '@/features/program/ujat/ui/detail-modal/application-institution/education-schedule'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type { UjatEducationProgressInstitutionRow } from '@/features/program/ujat/ui/detail-modal/progress/institutions/types'
import type { UjatEducationProgressVolunteerRow } from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'
import type {
  UjatAssignmentSessionGroup,
} from '@/features/program/ujat/ui/detail-modal/progress/assignments/types'
import type {
  UjatAttendanceSessionGroup,
  UjatAttendanceVolunteerRow,
} from '@/features/program/ujat/ui/detail-modal/progress/attendance/types'
import type {
  UjatEducationProgressRegionValues,
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from '@/features/program/ujat/ui/detail-modal/progress/progress-summary/types'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { formatAssignmentDateLabel } from '@/features/program/ujat/ui/detail-modal/progress/assignments/assignment-display'
import { buildRegionRow } from '@/features/program/ujat/ui/detail-modal/progress/progress-summary/summary-display'

function emptyRegionValues(): UjatEducationProgressRegionValues {
  return Object.fromEntries(
    listUjatEducationRegionsActive().map(region => [region.key, null])
  ) as UjatEducationProgressRegionValues
}

/** 일정 필터 옵션 — 교육 일정 상수 기반 (시드 row 아님) */
export function getUjatEducationProgressScheduleFilterOptions(half: EducationProgressHalfKey) {
  return UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES.filter(entry => entry.semester === half).map(
    ({ isoDate, title }) => ({ label: title, value: isoDate })
  )
}

export function getUjatEducationProgressInstitutions(
  _programId: string,
  _half: EducationProgressHalfKey
): UjatEducationProgressInstitutionRow[] {
  return []
}

export function getUjatEducationProgressVolunteerMockRows(
  _half: EducationProgressHalfKey
): UjatEducationProgressVolunteerRow[] {
  return []
}

export function getUjatEducationProgressSchoolSummary(): UjatEducationProgressSchoolSummary {
  const emptyRow = buildRegionRow(emptyRegionValues())
  return {
    appliedSchools: emptyRow,
    semesters: [],
  }
}

export function getUjatEducationProgressVolunteerSummary(): UjatEducationProgressVolunteerSummary {
  return { rows: [] }
}

export function getUjatEducationProgressAttendanceSessions(
  _half: EducationProgressHalfKey,
  _regionKey: UjatInstitutionApplicationRegionKey
): UjatAttendanceSessionGroup[] {
  return []
}

export function getUjatEducationProgressAttendanceDateOptions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): Array<{ label: string; value: string }> {
  return getUjatEducationProgressAttendanceSessions(half, regionKey).map(s => ({
    label: s.dateLabel,
    value: s.isoDate,
  }))
}

export function patchUjatEducationProgressAttendanceSession(
  _sessionId: string,
  _volunteers: UjatAttendanceVolunteerRow[]
): void {}

export function resetUjatEducationProgressAttendanceMockStore(): void {}

export function getUjatEducationProgressAssignmentSessions(
  _half: EducationProgressHalfKey,
  _regionKey: UjatInstitutionApplicationRegionKey
): UjatAssignmentSessionGroup[] {
  return []
}

export function getUjatEducationProgressAssignmentDateOptions(
  half: EducationProgressHalfKey
): Array<{ label: string; value: string }> {
  return UJAT_INSTITUTION_SCHEDULE_ASSIGN_DATES.filter(entry => entry.semester === half).map(
    entry => ({
      label: formatAssignmentDateLabel(entry.isoDate),
      value: entry.isoDate,
    })
  )
}

export function getUjatEducationProgressAssignmentInstitutionOptions(
  half: EducationProgressHalfKey,
  regionKey: UjatInstitutionApplicationRegionKey
): Array<{ label: string; value: string }> {
  const sessions = getUjatEducationProgressAssignmentSessions(half, regionKey)
  const names = new Set<string>()
  for (const session of sessions) {
    for (const row of session.volunteers) {
      if (row.isDropout && row.hasProgressHistory !== true) continue
      names.add(row.institutionName)
    }
  }
  return [...names].sort().map(name => ({ label: name, value: name }))
}

export function resetUjatEducationProgressAssignmentMockStore(): void {}
