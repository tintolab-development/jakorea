import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'
import { TRAINED_TEACHER_PROGRAM_API_TYPE } from './adapters'

export const TRAINED_TEACHER_PROGRAM_LIST_PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

export type TrainedTeacherOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface TrainedTeacherListFilters {
  keyword?: string
  periodStatus?: string
  businessYear?: number
}

function mapOverviewStatusToPeriodStatus(
  statusFilter: TrainedTeacherOverviewStatusFilter | null | undefined
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

export function trainedTeacherListParams(
  filters: TrainedTeacherListFilters = {},
  pageParam = 0
): AdminProgramsListQuery {
  return {
    programType: TRAINED_TEACHER_PROGRAM_API_TYPE,
    keyword: filters.keyword?.trim() || undefined,
    periodStatus: filters.periodStatus,
    businessYear: filters.businessYear,
    page: pageParam,
    size: TRAINED_TEACHER_PROGRAM_LIST_PAGE_SIZE,
  }
}

/** URL 위젯 status → GET /api/admin/programs 쿼리 */
export function trainedTeacherListParamsFromOverviewStatus(
  statusFilter: TrainedTeacherOverviewStatusFilter | null | undefined,
  tableFilters: { title?: string; businessYear?: number } = {}
): TrainedTeacherListFilters {
  return {
    keyword: tableFilters.title?.trim() || undefined,
    periodStatus: mapOverviewStatusToPeriodStatus(statusFilter),
    businessYear: tableFilters.businessYear,
  }
}
