import type { GeneralProgramOverviewStatusFilter } from '@/features/program/general/lib/list-status-filter'
import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import type { Program } from '@/types/domain'
import dayjs from 'dayjs'

const GENERAL_PROGRAM_API_TYPE = 'GENERAL'

export type GeneralProgramListTableFilters = {
  title?: string
  lifecycleStatus?: string
  targetLevel?: string
  participantRecruitment?: string
  operationStartDate?: string
  operationEndDate?: string
}

function mapOverviewStatusToPeriodStatus(
  statusFilter: GeneralProgramOverviewStatusFilter | null
): string | undefined {
  if (!statusFilter) return undefined
  switch (statusFilter) {
    case 'scheduled':
      return 'RECRUITING'
    case 'in_progress':
      return 'IN_PROGRESS'
    case 'completed':
      return 'COMPLETED'
    default:
      return undefined
  }
}

/** URL·테이블 pending 필터 → GET /api/admin/programs 쿼리 */
export function generalProgramListParamsFromFilters(
  statusFilter: GeneralProgramOverviewStatusFilter | null,
  tableFilters: GeneralProgramListTableFilters = {}
): AdminProgramsListQuery {
  return {
    programType: GENERAL_PROGRAM_API_TYPE,
    keyword: tableFilters.title?.trim() || undefined,
    periodStatus: mapOverviewStatusToPeriodStatus(statusFilter),
    page: 0,
    size: 500,
  }
}

function matchesParticipantRecruitment(program: Program, filter: string): boolean {
  const lifecycle = program.lifecycleStatus ?? ''
  switch (filter) {
    case 'scheduled':
      return [
        'recruiting_students',
        'recruiting_instructors',
        'matching_completed',
        'education_before_textbook',
      ].includes(lifecycle)
    case 'recruiting':
      return ['recruiting_students', 'recruiting_instructors'].includes(lifecycle)
    case 'closed':
      return !['recruiting_students', 'recruiting_instructors'].includes(lifecycle)
    default:
      return true
  }
}

/** API가 아직 지원하지 않는 테이블 필터 — 클라이언트 보조 필터 */
export function clientFilterGeneralPrograms(
  programs: Program[],
  tableFilters: GeneralProgramListTableFilters
): Program[] {
  return programs.filter(program => {
    if (tableFilters.lifecycleStatus && program.lifecycleStatus !== tableFilters.lifecycleStatus) {
      return false
    }
    if (tableFilters.targetLevel) {
      const levels = program.targetLevels?.length
        ? program.targetLevels
        : program.targetLevel
          ? [program.targetLevel]
          : []
      const filterLevel = tableFilters.targetLevel as NonNullable<Program['targetLevel']>
      if (!levels.includes(filterLevel)) {
        return false
      }
    }
    if (
      tableFilters.participantRecruitment &&
      !matchesParticipantRecruitment(program, tableFilters.participantRecruitment)
    ) {
      return false
    }
    if (tableFilters.operationStartDate || tableFilters.operationEndDate) {
      const start = program.startDate ? dayjs(program.startDate) : null
      const end = program.endDate ? dayjs(program.endDate) : null
      const filterStart = tableFilters.operationStartDate
        ? dayjs(tableFilters.operationStartDate)
        : null
      const filterEnd = tableFilters.operationEndDate
        ? dayjs(tableFilters.operationEndDate)
        : null
      if (filterStart && end && end.isBefore(filterStart, 'day')) return false
      if (filterEnd && start && start.isAfter(filterEnd, 'day')) return false
    }
    return true
  })
}
