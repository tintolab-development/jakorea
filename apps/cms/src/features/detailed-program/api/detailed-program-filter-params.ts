import type { DetailedProgramsParams } from '@/shared/api/generated/data-management/schemas'

function parseUsage(raw: string | null): 'ALL' | 'active' | 'inactive' {
  if (raw === 'active' || raw === 'inactive') return raw
  return 'ALL'
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
  if (usage === 'active') params.useYn = true
  if (usage === 'inactive') params.useYn = false

  return params
}

/** 서버 keyword 없음 — programName(dp_name)은 클라이언트 필터 유지 */
export function clientFilterDetailedProgramsByName(
  rows: import('@/features/detailed-program/model/detailed-program-management.types').DetailedProgramManagementRow[],
  searchParams: URLSearchParams
) {
  const nameQ = (searchParams.get('dp_name') ?? '').trim().toLowerCase()
  if (!nameQ) return rows
  return rows.filter(row => row.name.toLowerCase().includes(nameQ))
}
