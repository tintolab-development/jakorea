import type { AlimtalkTemplatePendingFilters } from './types'

export const ALIMTALK_FILTER_URL = {
  categoryName: 'kat_cat',
  templateName: 'kat_name',
} as const

export function pendingFiltersFromSearchParams(
  searchParams: URLSearchParams
): AlimtalkTemplatePendingFilters {
  return {
    categoryName: searchParams.get(ALIMTALK_FILTER_URL.categoryName) ?? '',
    templateName: searchParams.get(ALIMTALK_FILTER_URL.templateName) ?? '',
  }
}

export function applyAlimtalkFiltersToSearchParams(
  prev: URLSearchParams,
  filters: AlimtalkTemplatePendingFilters
): URLSearchParams {
  const next = new URLSearchParams(prev)
  const categoryName = filters.categoryName.trim()
  const templateName = filters.templateName.trim()
  if (categoryName) next.set(ALIMTALK_FILTER_URL.categoryName, categoryName)
  else next.delete(ALIMTALK_FILTER_URL.categoryName)
  if (templateName) next.set(ALIMTALK_FILTER_URL.templateName, templateName)
  else next.delete(ALIMTALK_FILTER_URL.templateName)
  return next
}
