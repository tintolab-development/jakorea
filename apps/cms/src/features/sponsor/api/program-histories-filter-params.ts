import type { ProgramHistoriesParams } from '@/shared/api/generated/data-management/schemas'
import type { SponsorProgramHistoryFilters } from '@/features/sponsor/model/sponsor-management.types'
import { SPONSOR_PROGRAM_HISTORY_FILTER_ALL } from '@/features/sponsor/utils/match-program-history-filter'

export function programHistoriesParamsFromFilters(
  filters: SponsorProgramHistoryFilters,
  page = 0,
  size = 50
): ProgramHistoriesParams {
  const params: ProgramHistoriesParams = { page, size }
  const title = filters.title.trim()
  if (title) {
    params.programName = title
  }
  if (filters.year !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL) {
    const year = Number(filters.year)
    if (Number.isFinite(year)) params.year = year
  }
  if (filters.lifecycleStatus !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL) {
    params.lifecycleStatus = filters.lifecycleStatus
  }
  if (filters.educationTarget !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL) {
    params.educationTarget = filters.educationTarget
  }
  const managerName = filters.managerName.trim()
  if (managerName) {
    params.managerName = managerName
  }
  return params
}
