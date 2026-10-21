import type { InfiniteData, QueryClient } from '@tanstack/react-query'

type InfiniteItemPage<T> = {
  items?: T[]
  totalElements?: number
}

function isArrayListCache<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

function isInfiniteItemPages<T>(value: unknown): value is InfiniteData<InfiniteItemPage<T>> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as { pages?: unknown; pageParams?: unknown }
  if (!Array.isArray(record.pages) || !Array.isArray(record.pageParams)) return false
  return record.pages.every(page => page != null && typeof page === 'object')
}

function mapInfiniteItems<T>(
  old: InfiniteData<InfiniteItemPage<T>>,
  mapItems: (items: T[], pageIndex: number) => T[]
): InfiniteData<InfiniteItemPage<T>> {
  let delta = 0
  const pages = old.pages.map((page, pageIndex) => {
    const items = page.items ?? []
    const nextItems = mapItems(items, pageIndex)
    delta += nextItems.length - items.length
    return nextItems === items ? page : { ...page, items: nextItems }
  })
  if (delta === 0 && pages.every((page, index) => page === old.pages[index])) return old
  return {
    ...old,
    pages: pages.map(page => ({
      ...page,
      totalElements:
        typeof page.totalElements === 'number'
          ? Math.max(0, page.totalElements + delta)
          : page.totalElements,
    })),
  }
}

function mapListCache<T>(
  old: unknown,
  mapArray: (rows: T[]) => T[],
  mapInfinite: (rows: T[], pageIndex: number) => T[]
): unknown {
  if (isArrayListCache<T>(old)) return mapArray(old)
  if (isInfiniteItemPages<T>(old)) return mapInfiniteItems(old, mapInfinite)
  return old
}

export function applyCreatedToArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  item: T,
  getId: (item: T) => string
): void {
  const id = String(getId(item))
  if (!id) return

  queryClient.setQueriesData({ queryKey: listPrefix }, old =>
    mapListCache<T>(
      old,
      rows => (rows.some(row => String(getId(row)) === id) ? rows : [item, ...rows]),
      (rows, pageIndex) => {
        if (pageIndex !== 0) return rows
        return rows.some(row => String(getId(row)) === id) ? rows : [item, ...rows]
      }
    )
  )
}

export function applyUpdatedToArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  item: T,
  getId: (item: T) => string
): void {
  const id = String(getId(item))
  if (!id) return

  queryClient.setQueriesData({ queryKey: listPrefix }, old =>
    mapListCache<T>(
      old,
      rows => {
        const found = rows.some(row => String(getId(row)) === id)
        return found ? rows.map(row => (String(getId(row)) === id ? item : row)) : [item, ...rows]
      },
      (rows, pageIndex) => {
        const found = rows.some(row => String(getId(row)) === id)
        if (found) return rows.map(row => (String(getId(row)) === id ? item : row))
        return pageIndex === 0 ? [item, ...rows] : rows
      }
    )
  )
}

export function applyDeletedIdsToArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  ids: readonly string[],
  getId: (item: T) => string
): void {
  const idSet = new Set(ids.map(String).filter(Boolean))
  if (idSet.size === 0) return
  queryClient.setQueriesData({ queryKey: listPrefix }, old =>
    mapListCache<T>(
      old,
      rows => rows.filter(row => !idSet.has(String(getId(row)))),
      rows => rows.filter(row => !idSet.has(String(getId(row))))
    )
  )
}

export function applyDeletedToArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  id: string,
  getId: (item: T) => string
): void {
  applyDeletedIdsToArrayLists(queryClient, listPrefix, [id], getId)
}

export async function invalidateArrayLists(
  queryClient: QueryClient,
  listPrefix: readonly unknown[]
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: listPrefix })
}

/**
 * 필터에 맞는 list 캐시에만 create prepend.
 * matchesFilter가 false인 목록은 건드리지 않음.
 */
export function applyCreatedToMatchingArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  item: T,
  getId: (item: T) => string,
  matchesFilter: (queryKey: readonly unknown[], item: T) => boolean
): void {
  const id = String(getId(item))
  if (!id) return

  for (const [queryKey, old] of queryClient.getQueriesData({ queryKey: listPrefix })) {
    if (old == null || !matchesFilter(queryKey, item)) continue
    queryClient.setQueryData(
      queryKey,
      mapListCache<T>(
        old,
        rows => (rows.some(row => String(getId(row)) === id) ? rows : [item, ...rows]),
        (rows, pageIndex) => {
          if (pageIndex !== 0) return rows
          return rows.some(row => String(getId(row)) === id) ? rows : [item, ...rows]
        }
      )
    )
  }
}

/**
 * 필터 매칭 list: upsert. 비매칭 list: 해당 id 제거 (상태·필터 변경 대응).
 */
export function applyUpdatedToMatchingArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  item: T,
  getId: (item: T) => string,
  matchesFilter: (queryKey: readonly unknown[], item: T) => boolean
): void {
  const id = String(getId(item))
  if (!id) return

  for (const [queryKey, old] of queryClient.getQueriesData({ queryKey: listPrefix })) {
    if (old == null) continue
    const matches = matchesFilter(queryKey, item)
    queryClient.setQueryData(
      queryKey,
      mapListCache<T>(
        old,
        rows => {
          const found = rows.some(row => String(getId(row)) === id)
          if (matches) {
            return found ? rows.map(row => (String(getId(row)) === id ? item : row)) : [item, ...rows]
          }
          return found ? rows.filter(row => String(getId(row)) !== id) : rows
        },
        (rows, pageIndex) => {
          const found = rows.some(row => String(getId(row)) === id)
          if (matches) {
            if (found) return rows.map(row => (String(getId(row)) === id ? item : row))
            return pageIndex === 0 ? [item, ...rows] : rows
          }
          return found ? rows.filter(row => String(getId(row)) !== id) : rows
        }
      )
    )
  }
}
