/** Admin·CMS 목록 API 공통 page size (BE 상한 20) */
export const API_LIST_PAGE_SIZE = 20

export type ApiPagedResult<T> = {
  items?: T[]
  totalPages?: number
}

export async function fetchAllApiPages<T>(
  fetchPage: (page: number, size: number) => Promise<ApiPagedResult<T>>,
  options?: { pageSize?: number; maxPages?: number }
): Promise<T[]> {
  const pageSize = options?.pageSize ?? API_LIST_PAGE_SIZE
  const maxPages = options?.maxPages ?? 500
  const collected: T[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages && page < maxPages) {
    const result = await fetchPage(page, pageSize)
    const batch = result.items ?? []
    collected.push(...batch)

    if (result.totalPages != null) {
      totalPages = result.totalPages
    } else if (batch.length < pageSize) {
      break
    } else {
      totalPages = page + 2
    }

    if (batch.length === 0) break
    page += 1
  }

  return collected
}
