import type { GeminiApprovedTrainingRow } from './types'

export type ApprovedTrainingListQueryView = {
  rows: GeminiApprovedTrainingRow[]
  fetchStatus: 'fetching' | 'paused' | 'idle'
  status: 'pending' | 'error' | 'success'
}

/** 승인 연수 상세는 별도 GET이 없어, 이미 받은 목록 캐시에서 같은 id 행을 찾는다. */
export function resolveApprovedTrainingRowFromListQueries(
  id: string,
  queries: ApprovedTrainingListQueryView[]
): GeminiApprovedTrainingRow | 'loading' | 'missing' {
  const trimmed = id.trim()
  if (!trimmed) return 'missing'

  for (const query of queries) {
    const row = query.rows.find(item => item.id === trimmed)
    if (row) return row
  }

  const stillLoading =
    queries.length === 0 ||
    queries.some(query => query.status === 'pending' || query.fetchStatus === 'fetching')
  return stillLoading ? 'loading' : 'missing'
}
