import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { GENERAL_PROGRAM_LIST_PAGE_SIZE } from '@/features/program/general/api/general-program-list-filter-params'
import { TRAINED_TEACHER_PROGRAM_API_TYPE } from './adapters'

export const TRAINED_TEACHER_PROGRAM_LIST_PAGE_SIZE = GENERAL_PROGRAM_LIST_PAGE_SIZE

export type TrainedTeacherOverviewStatusFilter = 'scheduled' | 'in_progress' | 'completed'

const PROGRESS_PHASES = new Set<TrainedTeacherOverviewStatusFilter>([
  'scheduled',
  'in_progress',
  'completed',
])

const TARGET_LEVEL_QUERY_CODES = new Set([
  'elementary',
  'middle',
  'high',
  'university',
  'adult',
  'college',
])

export interface TrainedTeacherListFilters {
  keyword?: string
  periodStatus?: string
  businessYear?: number
  targetLevel?: string
  /** 전체 탭만. `periodStatus`와 같이 보내지 않음 */
  progressPhase?: string
  operationStartDate?: string
  operationEndDate?: string
}

export interface TrainedTeacherListTableFilters {
  title?: string
  businessYear?: number
  targetLevel?: string
  /** URL `lifecycleStatus` — 전체 탭 진행 현황 3버킷 */
  lifecycleStatus?: string
  operationStartDate?: string
  operationEndDate?: string
}

/** URL 쿼리 값 → 목록 테이블 필터 (목록 훅·상단 위젯 프리페치가 같은 쿼리 키를 쓰도록 공용) */
export function readTrainedTeacherTableFilters(
  getParam: (key: string) => string | null | undefined
): TrainedTeacherListTableFilters {
  const yearRaw = getParam('businessYear')
  return {
    title: getParam('title')?.trim() || undefined,
    businessYear: yearRaw && /^\d{4}$/.test(yearRaw) ? Number.parseInt(yearRaw, 10) : undefined,
    targetLevel: getParam('targetLevel')?.trim() || undefined,
    lifecycleStatus: getParam('lifecycleStatus')?.trim() || undefined,
    operationStartDate: getParam('operationStartDate')?.trim() || undefined,
    operationEndDate: getParam('operationEndDate')?.trim() || undefined,
  }
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

function normalizeTargetLevelQuery(value: string | undefined): string | undefined {
  const code = value?.trim()
  if (!code || !TARGET_LEVEL_QUERY_CODES.has(code)) return undefined
  return code === 'college' ? 'university' : code
}

function normalizeProgressPhase(value: string | undefined): string | undefined {
  const phase = value?.trim()
  if (!phase || !PROGRESS_PHASES.has(phase as TrainedTeacherOverviewStatusFilter)) {
    return undefined
  }
  return phase
}

/** BE TRAINED_TEACHER Primary: SCHEDULED | IN_PROGRESS | COMPLETED (RECRUITING 아님) */
function mapOverviewStatusToPeriodStatus(
  statusFilter: TrainedTeacherOverviewStatusFilter | null | undefined
): string | undefined {
  if (!statusFilter) return undefined
  switch (statusFilter) {
    case 'scheduled':
      return 'SCHEDULED'
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
    targetLevel: filters.targetLevel?.trim() || undefined,
    progressPhase: filters.progressPhase,
    operationStartDate: filters.operationStartDate,
    operationEndDate: filters.operationEndDate,
    page: pageParam,
    size: TRAINED_TEACHER_PROGRAM_LIST_PAGE_SIZE,
  }
}

/** URL 위젯 status → GET /api/admin/programs 쿼리 */
export function trainedTeacherListParamsFromOverviewStatus(
  statusFilter: TrainedTeacherOverviewStatusFilter | null | undefined,
  tableFilters: TrainedTeacherListTableFilters = {}
): TrainedTeacherListFilters {
  const isAllTab = statusFilter == null
  const isScheduled = statusFilter === 'scheduled'
  return {
    keyword: tableFilters.title?.trim() || undefined,
    periodStatus: mapOverviewStatusToPeriodStatus(statusFilter),
    businessYear: tableFilters.businessYear,
    targetLevel: normalizeTargetLevelQuery(tableFilters.targetLevel),
    progressPhase: isAllTab ? normalizeProgressPhase(tableFilters.lifecycleStatus) : undefined,
    operationStartDate:
      isScheduled && isIsoDate(tableFilters.operationStartDate)
        ? tableFilters.operationStartDate
        : undefined,
    operationEndDate:
      isScheduled && isIsoDate(tableFilters.operationEndDate)
        ? tableFilters.operationEndDate
        : undefined,
  }
}
