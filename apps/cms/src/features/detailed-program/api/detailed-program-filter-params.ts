import type { DetailedProgramsParams } from '@/shared/api/generated/data-management/schemas'
import type { DetailedProgramUsageFilter } from '@/features/detailed-program/model/detailed-program-management.types'

/** URL `dp_use` → 사용 여부 필터. 없거나 알 수 없는 값이면 전체(`ALL`) */
export function parseDetailedProgramUsageFilter(
  raw: string | null | undefined
): DetailedProgramUsageFilter {
  if (raw === 'active' || raw === 'inactive') return raw
  return 'ALL'
}

/** 세부 프로그램 목록·셀렉트 API 페이지 크기 (한 요청 payload 상한) */
export const DETAILED_PROGRAM_API_PAGE_SIZE = 20

/** @deprecated `DETAILED_PROGRAM_API_PAGE_SIZE` 사용 */
export const DETAILED_PROGRAM_LIST_PAGE_SIZE = DETAILED_PROGRAM_API_PAGE_SIZE

/** 필터만 유지한 전수 조회 시 페이지 순회 상한 (20 × N건) */
export const DETAILED_PROGRAM_LIST_MAX_PAGES = 50

export function detailedProgramsParamsFromSearchParams(
  searchParams: URLSearchParams,
  page = 0
): DetailedProgramsParams {
  const params: DetailedProgramsParams = {
    page,
    size: DETAILED_PROGRAM_API_PAGE_SIZE,
  }

  const usage = parseDetailedProgramUsageFilter(searchParams.get('dp_use'))
  if (usage !== 'ALL') params.useYn = usage === 'active'

  const nameQ = (searchParams.get('dp_name') ?? '').trim()
  if (nameQ) params.keyword = nameQ

  return params
}

/** 목록 캐시 키 — 필터 파라미터만. URL 부가 값이 있어도 같은 조회면 같은 키. */
export function serializeDetailedProgramListFilters(searchParams: URLSearchParams): string {
  const next = new URLSearchParams()
  const usage = parseDetailedProgramUsageFilter(searchParams.get('dp_use'))
  if (usage !== 'ALL') next.set('dp_use', usage)
  const nameQ = (searchParams.get('dp_name') ?? '').trim()
  if (nameQ) next.set('dp_name', nameQ)
  return next.toString()
}
