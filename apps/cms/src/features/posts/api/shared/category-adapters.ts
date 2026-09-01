import type { PageResponseMapStringObjectItemsItem } from '@/shared/api/generated/posts/schemas'

export type CategoryRow = {
  id: string
  name: string
}

export function mapCategoryItem(item: PageResponseMapStringObjectItemsItem): CategoryRow | null {
  const rawId = item.id ?? item.categoryId
  const rawName = item.categoryName ?? item.name
  if (rawId == null || rawName == null) return null
  const name = String(rawName).trim()
  if (!name) return null
  return { id: String(rawId), name }
}

export function mapCategoryItems(
  items: PageResponseMapStringObjectItemsItem[] | undefined
): CategoryRow[] {
  return (items ?? []).map(mapCategoryItem).filter((row): row is CategoryRow => row != null)
}

/**
 * POST 카테고리 응답은 OpenAPI상 단건 Map이고, 구현에 따라 페이지 items를 줄 수도 있다.
 * 어느 쪽이든 생성된 행을 꺼내 캐시에 심을 수 있게 한다.
 */
export function mapCreatedCategory(dto: unknown, fallbackName?: string): CategoryRow | null {
  if (dto == null || typeof dto !== 'object') return null
  const record = dto as Record<string, unknown>

  if (Array.isArray(record.items)) {
    const items = mapCategoryItems(record.items as PageResponseMapStringObjectItemsItem[])
    if (fallbackName) {
      const match = items.find(row => row.name === fallbackName)
      if (match) return match
    }
    return items[0] ?? null
  }

  const mapped = mapCategoryItem(record as PageResponseMapStringObjectItemsItem)
  if (mapped) return mapped

  const rawId = record.id ?? record.categoryId
  const trimmedFallback = fallbackName?.trim()
  if (rawId != null && trimmedFallback) {
    return { id: String(rawId), name: trimmedFallback }
  }
  return null
}

export function withCreatedCategory(
  old: readonly CategoryRow[] | undefined,
  created: CategoryRow
): CategoryRow[] {
  if (!old) return [created]
  if (old.some(row => row.id === created.id)) return [...old]
  return [...old, created]
}

export function withRenamedCategory(
  old: readonly CategoryRow[] | undefined,
  id: string,
  name: string
): CategoryRow[] | undefined {
  if (!old) return old
  return old.map(row => (row.id === id ? { ...row, name } : row))
}

export function withoutCategory(
  old: readonly CategoryRow[] | undefined,
  id: string
): CategoryRow[] | undefined {
  if (!old) return old
  return old.filter(row => row.id !== id)
}
