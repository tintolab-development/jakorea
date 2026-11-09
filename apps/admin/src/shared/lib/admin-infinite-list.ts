/**
 * Admin 목록 무한 스크롤 — TanStack Query InfiniteData 헬퍼
 * size=20 SSOT: list-page-size.mdc
 */

import type { InfiniteData, QueryClient } from '@tanstack/react-query'

export const ADMIN_LIST_PAGE_SIZE = 20

export type AdminListPage<T> = {
  items: T[]
  page: number
  totalPages: number
  totalCount: number
}

export function paginateLocalRows<T>(
  rows: readonly T[],
  page: number,
  size = ADMIN_LIST_PAGE_SIZE,
): AdminListPage<T> {
  const totalCount = rows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / size) || 1)
  const start = page * size
  return {
    items: rows.slice(start, start + size),
    page,
    totalPages,
    totalCount,
  }
}

export function nextAdminListPageParam(lastPage: AdminListPage<unknown>): number | undefined {
  if (Number.isFinite(lastPage.totalPages) && lastPage.totalPages > 0) {
    return lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined
  }
  if (lastPage.items.length < ADMIN_LIST_PAGE_SIZE) return undefined
  return lastPage.page + 1
}

export function toAdminListPage<T>(
  items: T[],
  page: number,
  meta?: { page?: number; totalPages?: number; totalCount?: number },
): AdminListPage<T> {
  const totalCount = meta?.totalCount ?? items.length
  const totalPages =
    meta?.totalPages != null && meta.totalPages > 0
      ? meta.totalPages
      : Math.max(1, Math.ceil(totalCount / ADMIN_LIST_PAGE_SIZE) || 1)
  return {
    items,
    page: meta?.page ?? page,
    totalPages,
    totalCount,
  }
}

export function flattenAdminListPages<T>(
  data: InfiniteData<AdminListPage<T>> | undefined,
): T[] {
  return data?.pages.flatMap(page => page.items) ?? []
}

/** 캐시 미스 시 bulk 액션용 — page size 20으로 전 페이지 순회 */
export async function fetchAllAdminListPages<T>(
  fetchPage: (page: number) => Promise<AdminListPage<T>>,
): Promise<T[]> {
  const rows: T[] = []
  let page = 0
  for (;;) {
    const result = await fetchPage(page)
    rows.push(...result.items)
    const hasMore =
      Number.isFinite(result.totalPages) && result.totalPages > 0
        ? page + 1 < result.totalPages
        : result.items.length >= ADMIN_LIST_PAGE_SIZE
    if (!hasMore) break
    page += 1
  }
  return rows
}

export function keepFirstInfiniteQueryPage<T>(
  data: InfiniteData<T> | undefined,
): InfiniteData<T> | undefined {
  if (!data || data.pages.length <= 1) return data
  return {
    ...data,
    pages: data.pages.slice(0, 1),
    pageParams: data.pageParams.slice(0, 1),
  }
}

/** 페이지 단위 캐시(`useQuery` 한 장) 판별 — 무한 캐시(`pages`)와 구분 */
export function isSingleAdminListPage<T>(
  data: InfiniteData<AdminListPage<T>> | AdminListPage<T> | T[],
): data is AdminListPage<T> {
  return !Array.isArray(data) && 'items' in data && !('pages' in data)
}

export function flattenAdminListCache<T extends { id: string }>(data: unknown): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data as T[]
  if (typeof data === 'object' && data !== null && 'pages' in data) {
    return flattenAdminListPages(data as InfiniteData<AdminListPage<T>>)
  }
  if (typeof data === 'object' && data !== null && 'items' in data) {
    const items = (data as AdminListPage<T>).items
    return Array.isArray(items) ? items : []
  }
  return []
}

/** 캐시(무한 또는 페이지 한 장)가 알고 있는 서버 전체 건수 */
export function readAdminListCacheTotalCount(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined
  if ('pages' in data) {
    const first = (data as InfiniteData<AdminListPage<unknown>>).pages[0]
    return typeof first?.totalCount === 'number' ? first.totalCount : undefined
  }
  if ('totalCount' in data) {
    const total = (data as AdminListPage<unknown>).totalCount
    return typeof total === 'number' ? total : undefined
  }
  return undefined
}

export function collectInfiniteCachedRows<T extends { id: string }>(
  qc: QueryClient,
  listsKey: readonly unknown[],
): T[] | undefined {
  const merged = new Map<string, T>()
  for (const [, data] of qc.getQueriesData({ queryKey: listsKey })) {
    for (const row of flattenAdminListCache<T>(data)) merged.set(row.id, row)
  }
  return merged.size > 0 ? [...merged.values()] : undefined
}

export function patchInfiniteListRow<T extends { id: string }>(
  qc: QueryClient,
  listsKey: readonly unknown[],
  row: T,
) {
  qc.setQueriesData<InfiniteData<AdminListPage<T>> | AdminListPage<T> | T[]>(
    { queryKey: listsKey },
    old => {
    if (!old) return old
    if (Array.isArray(old)) {
      const idx = old.findIndex(item => item.id === row.id)
      if (idx < 0) return old
      const next = [...old]
      next[idx] = row
      return next
    }
    if (isSingleAdminListPage(old)) {
      return { ...old, items: old.items.map(item => (item.id === row.id ? row : item)) }
    }
    return {
      ...old,
      pages: old.pages.map(page => ({
        ...page,
        items: page.items.map(item => (item.id === row.id ? row : item)),
      })),
    }
    },
  )
}

export function removeInfiniteListRows(
  qc: QueryClient,
  listsKey: readonly unknown[],
  ids: string[],
) {
  const idSet = new Set(ids)
  qc.setQueriesData<
    InfiniteData<AdminListPage<{ id: string }>> | AdminListPage<{ id: string }> | { id: string }[]
  >(
    { queryKey: listsKey },
    old => {
      if (!old) return old
      if (Array.isArray(old)) return old.filter(row => !idSet.has(row.id))
      if (isSingleAdminListPage(old)) {
        return {
          ...old,
          items: old.items.filter(row => !idSet.has(row.id)),
          totalCount: Math.max(0, old.totalCount - ids.length),
        }
      }
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          items: page.items.filter(row => !idSet.has(row.id)),
          totalCount: Math.max(0, page.totalCount - ids.length),
        })),
      }
    },
  )
}
