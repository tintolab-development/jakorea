import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'
import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from './adapters'

export const COMPANY_SCHOOL_PROGRAM_LIST_PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

/** 예정 위젯·목록 — Primary SCHEDULED + 레거시 RECRUITING 합집합 */
export const COMPANY_SCHOOL_SCHEDULED_PERIOD_STATUSES = ['SCHEDULED', 'RECRUITING'] as const

export type CompanySchoolOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface CompanySchoolListFilters {
  keyword?: string
  periodStatus?: string
  /**
   * 복수 periodStatus 합집합 (예정 카드와 동일).
   * API는 단일 `periodStatus`만 받으므로 서비스에서 병렬 조회 후 id 기준 병합한다.
   */
  periodStatuses?: readonly string[]
  businessYear?: number
}

function mapOverviewStatusToPeriodStatus(
  statusFilter: CompanySchoolOverviewStatusFilter | null | undefined
): string | undefined {
  if (!statusFilter) return undefined
  switch (statusFilter) {
    case 'scheduled':
      // periodStatuses 로 처리 — 단일 periodStatus 미사용
      return undefined
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
  if (statusFilter === 'scheduled') {
    return {
      keyword: tableFilters.title?.trim() || undefined,
      periodStatuses: [...COMPANY_SCHOOL_SCHEDULED_PERIOD_STATUSES],
      businessYear: tableFilters.businessYear,
    }
  }

  return {
    keyword: tableFilters.title?.trim() || undefined,
    periodStatus: mapOverviewStatusToPeriodStatus(statusFilter),
    businessYear: tableFilters.businessYear,
  }
}
