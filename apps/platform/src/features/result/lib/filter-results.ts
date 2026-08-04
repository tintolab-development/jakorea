import type { ResultListItem, ResultsListParams } from '../model/types'
import { DEFAULT_RESULTS_LIST_PARAMS } from './constants'
import { resolveResultCategoryFilterId } from './mock-notice-categories'

/**
 * 검색·카테고리·정렬 pure 함수.
 * UI state 변경 시 네트워크 재요청 없이 클라이언트에서 적용한다.
 */
export function filterAndSortResults(
  items: readonly ResultListItem[],
  params: Pick<ResultsListParams, 'category' | 'q' | 'sort'>
): ResultListItem[] {
  let next = [...items]

  const categoryId = resolveResultCategoryFilterId(params.category)
  if (categoryId !== DEFAULT_RESULTS_LIST_PARAMS.category) {
    next = next.filter(item => item.categoryId === categoryId)
  }

  if (params.q.trim()) {
    const query = params.q.trim().toLowerCase()
    next = next.filter(item => item.title.toLowerCase().includes(query))
  }

  if (params.sort === 'title') {
    next.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
    return next
  }

  next.sort((a, b) => {
    const timeA = Date.parse(a.announcedAt)
    const timeB = Date.parse(b.announcedAt)
    const safeA = Number.isNaN(timeA) ? 0 : timeA
    const safeB = Number.isNaN(timeB) ? 0 : timeB
    return safeB - safeA
  })

  return next
}
