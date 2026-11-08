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
      // BE 목록 필터는 레거시 RECRUITING을 SCHEDULED(예정) 버킷 별칭으로 처리한다 — 합집합 조회 불필요.
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

export interface CompanySchoolListTableFilters {
  title?: string
  businessYear?: number
}

/** URL 검색 파라미터 → 목록 테이블 필터 (목록 페이지·상단 위젯 프리페치가 같은 쿼리 키를 쓰도록 공용) */
export function readCompanySchoolTableFilters(
  searchParams: URLSearchParams
): CompanySchoolListTableFilters {
  const title = searchParams.get('title') ?? undefined
  const yearRaw = searchParams.get('businessYear')
  const businessYear =
    yearRaw && /^\d{4}$/.test(yearRaw) ? Number.parseInt(yearRaw, 10) : undefined
  return { title, businessYear }
}

/** URL 위젯 status → GET /api/admin/programs 쿼리 */
export function companySchoolListParamsFromOverviewStatus(
  statusFilter: CompanySchoolOverviewStatusFilter | null | undefined,
  tableFilters: CompanySchoolListTableFilters = {}
): CompanySchoolListFilters {
  return {
    keyword: tableFilters.title?.trim() || undefined,
    periodStatus: mapOverviewStatusToPeriodStatus(statusFilter),
    businessYear: tableFilters.businessYear,
  }
}
