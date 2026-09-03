import type { QueryClient } from '@tanstack/react-query'

function isArrayListCache<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

export function applyCreatedToArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  item: T,
  getId: (item: T) => string
): void {
  const id = getId(item)
  if (!id) return

  for (const [queryKey, old] of queryClient.getQueriesData<T[]>({ queryKey: listPrefix })) {
    if (!isArrayListCache<T>(old)) continue
    if (old.some(row => getId(row) === id)) continue
    queryClient.setQueryData<T[]>(queryKey, [item, ...old])
  }
}

export function applyUpdatedToArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  item: T,
  getId: (item: T) => string
): void {
  const id = getId(item)
  if (!id) return

  for (const [queryKey, old] of queryClient.getQueriesData<T[]>({ queryKey: listPrefix })) {
    if (!isArrayListCache<T>(old)) continue
    const found = old.some(row => getId(row) === id)
    queryClient.setQueryData<T[]>(
      queryKey,
      found ? old.map(row => (getId(row) === id ? item : row)) : [item, ...old]
    )
  }
}

export function applyDeletedToArrayLists<T>(
  queryClient: QueryClient,
  listPrefix: readonly unknown[],
  id: string,
  getId: (item: T) => string
): void {
  if (!id) return
  queryClient.setQueriesData<T[]>({ queryKey: listPrefix }, old => {
    if (!isArrayListCache<T>(old)) return old
    return old.filter(row => getId(row) !== id)
  })
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
  const id = getId(item)
  if (!id) return

  for (const [queryKey, old] of queryClient.getQueriesData<T[]>({ queryKey: listPrefix })) {
    if (!isArrayListCache<T>(old)) continue
    if (!matchesFilter(queryKey, item)) continue
    if (old.some(row => getId(row) === id)) continue
    queryClient.setQueryData<T[]>(queryKey, [item, ...old])
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
  const id = getId(item)
  if (!id) return

  for (const [queryKey, old] of queryClient.getQueriesData<T[]>({ queryKey: listPrefix })) {
    if (!isArrayListCache<T>(old)) continue
    const found = old.some(row => getId(row) === id)
    if (matchesFilter(queryKey, item)) {
      queryClient.setQueryData<T[]>(
        queryKey,
        found ? old.map(row => (getId(row) === id ? item : row)) : [item, ...old]
      )
      continue
    }
    if (found) {
      queryClient.setQueryData<T[]>(
        queryKey,
        old.filter(row => getId(row) !== id)
      )
    }
  }
}
