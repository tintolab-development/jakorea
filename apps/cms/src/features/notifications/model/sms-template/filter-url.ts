import type { SmsTemplatePendingFilters } from './types'

export const SMS_FILTER_URL = {
  categoryName: 'sms_cat',
  templateName: 'sms_name',
} as const

export function pendingFiltersFromSearchParams(
  searchParams: URLSearchParams
): SmsTemplatePendingFilters {
  return {
    categoryName: searchParams.get(SMS_FILTER_URL.categoryName) ?? '',
    templateName: searchParams.get(SMS_FILTER_URL.templateName) ?? '',
  }
}

export function applySmsFiltersToSearchParams(
  prev: URLSearchParams,
  filters: SmsTemplatePendingFilters
): URLSearchParams {
  const next = new URLSearchParams(prev)
  const categoryName = filters.categoryName.trim()
  const templateName = filters.templateName.trim()
  if (categoryName) next.set(SMS_FILTER_URL.categoryName, categoryName)
  else next.delete(SMS_FILTER_URL.categoryName)
  if (templateName) next.set(SMS_FILTER_URL.templateName, templateName)
  else next.delete(SMS_FILTER_URL.templateName)
  return next
}
