import type { ProgramHistoriesParams } from '@/shared/api/generated/data-management/schemas'
import type { SponsorProgramHistoryFilters } from '@/features/sponsor/model/sponsor-management.types'
import { SPONSOR_PROGRAM_HISTORY_FILTER_ALL } from '@/features/sponsor/utils/match-program-history-filter'

/** OpenAPI ProgramHistoriesParams에 participantType 없음 — FE 확장 전송 + BE 갭 */
export type ProgramHistoriesQueryParams = ProgramHistoriesParams & {
  participantType?: string
}

export function programHistoriesParamsFromFilters(
  filters: SponsorProgramHistoryFilters,
  page = 0,
  size = 50
): ProgramHistoriesQueryParams {
  const params: ProgramHistoriesQueryParams = { page, size }
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
  if (filters.participantType !== SPONSOR_PROGRAM_HISTORY_FILTER_ALL) {
    params.participantType = filters.participantType
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
