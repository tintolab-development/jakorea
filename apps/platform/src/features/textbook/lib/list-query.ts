import type { TextbookCategoryFilter, TextbooksListParams } from '../model/types'
import { TEXTBOOKS_PAGE_SIZE } from './constants'

/** GET /api/public/education/textbooks `fieldCode` */
export const TEXTBOOK_BUSINESS_FIELD_CODE = {
  career: 'CAREER_EMPLOYMENT',
  economy: 'ECONOMICS_FINANCE',
  entrepreneurship: 'ENTREPRENEURSHIP',
  digital: 'DIGITAL_LITERACY',
} as const satisfies Record<Exclude<TextbookCategoryFilter, 'all'>, string>

export type TextbookBusinessFieldCode =
  (typeof TEXTBOOK_BUSINESS_FIELD_CODE)[keyof typeof TEXTBOOK_BUSINESS_FIELD_CODE]

const TEXTBOOK_API_SORT = {
  latest: 'LATEST',
  name: 'NAME',
} as const

export type PublicTextbookListQuery = {
  fieldCode?: TextbookBusinessFieldCode
  sort: 'LATEST' | 'NAME'
  /** 0-based */
  page: number
  size: number
}

/** 목록 URL 상태 → 공개 교재 목록 쿼리. `targetId`는 보내지 않는다. */
export function toPublicTextbookListQuery(
  params: TextbooksListParams,
  size = TEXTBOOKS_PAGE_SIZE
): PublicTextbookListQuery {
  const fieldCode =
    params.category === 'all' ? undefined : TEXTBOOK_BUSINESS_FIELD_CODE[params.category]

  return {
    ...(fieldCode ? { fieldCode } : {}),
    sort: TEXTBOOK_API_SORT[params.sort],
    page: Math.max(params.page, 1) - 1,
    size,
  }
}
