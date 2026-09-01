/** 로그 목록 공통 페이지네이션 — BE `LogListPageResponse`와 동일 */

export const LOG_LIST_PAGE_SIZE = 20
export const LOG_LIST_MAX_PAGE_SIZE = 100

export type LogListPage<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export function clampLogListPageSize(size = LOG_LIST_PAGE_SIZE): number {
  if (!Number.isFinite(size)) return LOG_LIST_PAGE_SIZE
  return Math.min(Math.max(Math.trunc(size), 1), LOG_LIST_MAX_PAGE_SIZE)
}

export function paginateLogList<T>(
  items: readonly T[],
  page = 0,
  size = LOG_LIST_PAGE_SIZE
): LogListPage<T> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 0
  const safeSize = clampLogListPageSize(size)
  const totalElements = items.length
  const totalPages = safeSize > 0 ? Math.ceil(totalElements / safeSize) : 0
  const start = safePage * safeSize
  const pageItems = items.slice(start, start + safeSize)
  return {
    items: pageItems,
    page: safePage,
    size: safeSize,
    totalElements,
    totalPages,
    hasNext: safePage + 1 < totalPages,
  }
}
