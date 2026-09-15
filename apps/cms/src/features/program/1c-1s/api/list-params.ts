import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'
import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from './adapters'

export const COMPANY_SCHOOL_PROGRAM_LIST_PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

export type CompanySchoolOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface CompanySchoolListFilters {
  keyword?: string
  periodStatus?: string
  businessYear?: number
}

function mapOverviewStatusToPeriodStatus(
  statusFilter: CompanySchoolOverviewStatusFilter | null | undefined
): string | undefined {
  if (!statusFilter) return undefined
  switch (statusFilter) {
    case 'scheduled':
      // Primary ONE-01 = SCHEDULED (레거시 CS는 RECRUITING일 수 있음 → overview는 합산)
      return 'SCHEDULED'
    case 'in_progress':
      return 'IN_PROGRESS'
    case 'completed':
      return 'COMPLETED'
    default:
      return undefined
  }
}

export function companySchoolListParams(
  filters: CompanySchoolListFilters = {},
  pageParam = 0
): AdminProgramsListQuery {
  return {
    programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
    keyword: filters.keyword?.trim() || undefined,
    periodStatus: filters.periodStatus,
    businessYear: filters.businessYear,
    page: pageParam,
    size: COMPANY_SCHOOL_PROGRAM_LIST_PAGE_SIZE,
  }
}

/** URL 위젯 status → GET /api/admin/programs 쿼리 */
export function companySchoolListParamsFromOverviewStatus(
  statusFilter: CompanySchoolOverviewStatusFilter | null | undefined,
  tableFilters: { title?: string; businessYear?: number } = {}
): CompanySchoolListFilters {
  return {
    keyword: tableFilters.title?.trim() || undefined,
    periodStatus: mapOverviewStatusToPeriodStatus(statusFilter),
    businessYear: tableFilters.businessYear,
  }
}
