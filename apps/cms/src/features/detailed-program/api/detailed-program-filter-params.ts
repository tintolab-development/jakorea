import type { DetailedProgramsParams } from '@/shared/api/generated/data-management/schemas'

function parseUsage(raw: string | null): 'active' | 'inactive' {
  return raw === 'inactive' ? 'inactive' : 'active'
}

/** 목록 UI에 페이지네이션이 없어 충분히 큰 size로 전체 조회 */
export const DETAILED_PROGRAM_LIST_PAGE_SIZE = 500

export function detailedProgramsParamsFromSearchParams(
  searchParams: URLSearchParams
): DetailedProgramsParams {
  const params: DetailedProgramsParams = {
    page: 0,
    size: DETAILED_PROGRAM_LIST_PAGE_SIZE,
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
