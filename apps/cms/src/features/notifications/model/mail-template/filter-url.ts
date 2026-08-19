import type { MailTemplatePendingFilters } from './types'

export const MAIL_FILTER_URL = {
  categoryName: 'mail_cat',
  templateName: 'mail_name',
} as const

export function pendingFiltersFromSearchParams(
  searchParams: URLSearchParams
): MailTemplatePendingFilters {
  return {
    categoryName: searchParams.get(MAIL_FILTER_URL.categoryName) ?? '',
    templateName: searchParams.get(MAIL_FILTER_URL.templateName) ?? '',
  }
}

export function applyMailFiltersToSearchParams(
  prev: URLSearchParams,
  filters: MailTemplatePendingFilters
): URLSearchParams {
  const next = new URLSearchParams(prev)
  const categoryName = filters.categoryName.trim()
  const templateName = filters.templateName.trim()
  if (categoryName) next.set(MAIL_FILTER_URL.categoryName, categoryName)
  else next.delete(MAIL_FILTER_URL.categoryName)
  if (templateName) next.set(MAIL_FILTER_URL.templateName, templateName)
  else next.delete(MAIL_FILTER_URL.templateName)
  return next
}
