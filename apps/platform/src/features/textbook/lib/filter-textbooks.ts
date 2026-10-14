import type { TextbookCategoryFilter, TextbookContent, TextbooksListParams } from '../model/types'

export function filterTextbooksByCategory(
  items: TextbookContent[],
  category: TextbookCategoryFilter,
): TextbookContent[] {
  if (category === 'all') return items
  return items.filter(item => item.theme === category)
}

export function filterAndSortTextbooks(
  items: TextbookContent[],
  params: Pick<TextbooksListParams, 'category' | 'sort'>,
): TextbookContent[] {
  const filtered = filterTextbooksByCategory(items, params.category)
  if (params.sort === 'name') {
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  }
  return filtered
}
