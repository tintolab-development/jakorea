import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'
import { isProgramProgressPhaseFilter } from '@/features/program/general/ui/constants/program-list-constants'
import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from './adapters'

export const COMPANY_SCHOOL_PROGRAM_LIST_PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

export type CompanySchoolOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

export interface CompanySchoolListFilters {
  keyword?: string
  periodStatus?: string
  businessYear?: number
  /** 전체 탭「프로그램 진행 현황」— `scheduled` | `in_progress` | `completed` */
  progressPhase?: string
  /** 「교육 대상」— `elementary` | `middle` | `high` | `university` | `adult` */
  targetLevel?: string
  /** 예정 탭「사업 운영 기간」overlap (YYYY-MM-DD) */
  operationStartDate?: string
  operationEndDate?: string
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
    progressPhase: filters.progressPhase,
    targetLevel: filters.targetLevel,
    operationStartDate: filters.operationStartDate,
    operationEndDate: filters.operationEndDate,
    page: pageParam,
    size: COMPANY_SCHOOL_PROGRAM_LIST_PAGE_SIZE,
  }
}

export interface CompanySchoolListTableFilters {
  title?: string
  businessYear?: number
  lifecycleStatus?: string
  targetLevel?: string
  operationStartDate?: string
  operationEndDate?: string
}

function readTrimmedParam(searchParams: URLSearchParams, key: string): string | undefined {
  return searchParams.get(key)?.trim() || undefined
}

/** URL 검색 파라미터 → 목록 테이블 필터 (목록 페이지·상단 위젯 프리페치가 같은 쿼리 키를 쓰도록 공용) */
export function readCompanySchoolTableFilters(
  searchParams: URLSearchParams
): CompanySchoolListTableFilters {
  const title = searchParams.get('title') ?? undefined
  const yearRaw = searchParams.get('businessYear')
  const businessYear =
    yearRaw && /^\d{4}$/.test(yearRaw) ? Number.parseInt(yearRaw, 10) : undefined
  return {
    title,
    businessYear,
    lifecycleStatus: readTrimmedParam(searchParams, 'lifecycleStatus'),
    targetLevel: readTrimmedParam(searchParams, 'targetLevel'),
    operationStartDate: readTrimmedParam(searchParams, 'operationStartDate'),
    operationEndDate: readTrimmedParam(searchParams, 'operationEndDate'),
  }
}

/**
 * URL 위젯 status + 목록 필터 → GET /api/admin/programs 쿼리 (서버 필터 — 「총 N건」= 필터 결과).
 * 화면에 있는 필터만 보낸다: 진행 현황은 전체 탭, 사업 운영 기간은 예정 탭, 교육 대상은 전 탭.
 */
export function companySchoolListParamsFromOverviewStatus(
  statusFilter: CompanySchoolOverviewStatusFilter | null | undefined,
  tableFilters: CompanySchoolListTableFilters = {}
): CompanySchoolListFilters {
  const lifecycleStatus = tableFilters.lifecycleStatus ?? ''
  const isScheduledTab = statusFilter === 'scheduled'
  return {
    keyword: tableFilters.title?.trim() || undefined,
    periodStatus: mapOverviewStatusToPeriodStatus(statusFilter),
    businessYear: tableFilters.businessYear,
    progressPhase:
      !statusFilter && isProgramProgressPhaseFilter(lifecycleStatus) ? lifecycleStatus : undefined,
    targetLevel: tableFilters.targetLevel || undefined,
    operationStartDate: isScheduledTab ? tableFilters.operationStartDate : undefined,
    operationEndDate: isScheduledTab ? tableFilters.operationEndDate : undefined,
  }
}
