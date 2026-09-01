import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { TRAINED_TEACHER_PROGRAM_API_TYPE } from './adapters'

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
  filters: TrainedTeacherListFilters = {}
): AdminProgramsListQuery {
  return {
    programType: TRAINED_TEACHER_PROGRAM_API_TYPE,
    keyword: filters.keyword?.trim() || undefined,
    periodStatus: filters.periodStatus,
    businessYear: filters.businessYear,
    page: 0,
    size: 500,
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
