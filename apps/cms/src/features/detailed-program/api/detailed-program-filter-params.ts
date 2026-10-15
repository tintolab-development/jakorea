import type { DetailedProgramsParams } from '@/shared/api/generated/data-management/schemas'

function parseUsage(raw: string | null): 'active' | 'inactive' {
  return raw === 'inactive' ? 'inactive' : 'active'
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

  const usage = parseUsage(searchParams.get('dp_use'))
  params.useYn = usage === 'active'

  const nameQ = (searchParams.get('dp_name') ?? '').trim()
  if (nameQ) params.keyword = nameQ

  return params
}

/** 목록 캐시 키 — 필터 파라미터만. URL 부가 값이 있어도 같은 조회면 같은 키. */
export function serializeDetailedProgramListFilters(searchParams: URLSearchParams): string {
  const next = new URLSearchParams()
  next.set('dp_use', parseUsage(searchParams.get('dp_use')))
  const nameQ = (searchParams.get('dp_name') ?? '').trim()
  if (nameQ) next.set('dp_name', nameQ)
  return next.toString()
}
