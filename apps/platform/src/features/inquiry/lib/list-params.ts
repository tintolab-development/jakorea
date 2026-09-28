import type { InquiryListParams, InquiryTab } from '../model/types'
import { DEFAULT_INQUIRY_LIST_PARAMS, MYPAGE_INQUIRIES_BASE_PATH } from './constants'

const VALID_TABS = new Set<InquiryTab>(['faq', 'inquiry'])

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseTab(value: string | null): InquiryTab {
  if (value && VALID_TABS.has(value as InquiryTab)) {
    return value as InquiryTab
  }

  return DEFAULT_INQUIRY_LIST_PARAMS.tab
}

function parseCategory(value: string | null): string {
  const trimmed = value?.trim()
  if (trimmed) return trimmed
  return DEFAULT_INQUIRY_LIST_PARAMS.category
}

export function readInquiryListParams(search = window.location.search): InquiryListParams {
  const params = new URLSearchParams(search)

  return {
    tab: parseTab(params.get('tab')),
    category: parseCategory(params.get('category')),
    page: parsePositiveInt(params.get('page'), DEFAULT_INQUIRY_LIST_PARAMS.page),
  }
}

export function buildInquiryListPath(params: InquiryListParams) {
  const searchParams = new URLSearchParams()

  if (params.tab !== DEFAULT_INQUIRY_LIST_PARAMS.tab) {
    searchParams.set('tab', params.tab)
  }
  if (params.category !== DEFAULT_INQUIRY_LIST_PARAMS.category) {
    searchParams.set('category', params.category)
  }
  if (params.page !== DEFAULT_INQUIRY_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${MYPAGE_INQUIRIES_BASE_PATH}?${query}` : MYPAGE_INQUIRIES_BASE_PATH
}
