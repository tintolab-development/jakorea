import type {
  SponsorProgramHistoryFilters,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'

/** 필터 UI의 “전체” 값 — 빈 문자열과 동일하게 취급합니다. */
export const SPONSOR_PROGRAM_HISTORY_FILTER_ALL = '' as const

/** UI 프로그램 진행 현황 필터 값 → 허용되는 `lifecycleStatus` 목록 */
export const LIFECYCLE_STATUS_MAP: Record<
  string,
  Array<SponsorProgramHistoryRow['lifecycleStatus']>
> = {
  planned: [
    'planned',
    'instructor_recruitment_planned',
    'volunteer_recruitment_planned',
    'participant_instructor_recruitment_planned',
  ],
  education_in_progress: [
    'education_in_progress',
    'education_before_textbook',
    'education_after_textbook',
    'matching_completed',
  ],
  education_completed: [
    'education_completed',
    'document_processing_completed',
    'participant_instructor_recruitment_completed',
  ],
}

/**
 * Returns whether a single program history row satisfies all active filters.
 * Lifecycle filtering uses {@link LIFECYCLE_STATUS_MAP}; unknown filter keys do not exclude rows.
 */
export function matchesProgramHistoryFilter(
  row: SponsorProgramHistoryRow,
  filters: SponsorProgramHistoryFilters
): boolean {
  const titleQuery = filters.title.trim().toLowerCase()
  const managerQuery = filters.managerName.trim().toLowerCase()

  if (titleQuery && !row.title.toLowerCase().includes(titleQuery)) {
    return false
  }

  if (filters.year !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL && String(row.year) !== filters.year) {
    return false
  }

  if (filters.lifecycleStatus !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL) {
    const allowed = LIFECYCLE_STATUS_MAP[filters.lifecycleStatus]
    if (allowed !== undefined && !allowed.includes(row.lifecycleStatus)) {
      return false
    }
  }

  if (
    filters.educationTarget !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL &&
    row.educationTarget !== filters.educationTarget
  ) {
    return false
  }

  if (
    filters.participantType !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL &&
    row.participantType !== filters.participantType
  ) {
    return false
  }

  if (managerQuery && !row.managerName.toLowerCase().includes(managerQuery)) {
    return false
  }

  return true
}
