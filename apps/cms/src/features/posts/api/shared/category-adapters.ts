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
