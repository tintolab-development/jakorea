import {
  POSTS_LIST_PAGE_SIZE,
  type PostsListPage,
} from '@/features/posts/api/posts-list-page'

function readFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function unwrapListItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload != null && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>
    for (const key of ['items', 'content', 'rows', 'data'] as const) {
      const value = rec[key]
      if (Array.isArray(value)) return value
    }
  }
  return []
}

export function mapPostsListPage<TDto, TItem>(
  payload: unknown,
  mapItem: (dto: TDto) => TItem
): PostsListPage<TItem> {
  const rawItems = unwrapListItems(payload)
  const items = rawItems
    .filter((item): item is TDto => item != null && typeof item === 'object')
    .map(mapItem)

  if (Array.isArray(payload)) {
    return {
      items,
      page: 0,
      size: items.length || POSTS_LIST_PAGE_SIZE,
      totalElements: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      hasNext: false,
    }
  }

  const rec =
    payload != null && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {}
  const page = readFiniteNumber(rec.page, 0)
  const size = readFiniteNumber(rec.size, POSTS_LIST_PAGE_SIZE)
  const totalElements = readFiniteNumber(rec.totalElements, items.length)
  const totalPages = readFiniteNumber(
    rec.totalPages,
    size > 0 ? Math.ceil(totalElements / size) : 0
  )
  const hasNext =
    typeof rec.hasNext === 'boolean' ? rec.hasNext : page + 1 < totalPages

  return { items, page, size, totalElements, totalPages, hasNext }
}
