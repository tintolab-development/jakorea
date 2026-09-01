import type {
  TextbookCategoryFilter,
  TextbookSort,
  TextbooksListParams,
} from '../model/types'
import { DEFAULT_TEXTBOOKS_LIST_PARAMS, TEXTBOOKS_PATH, TEXTBOOK_THEME_ITEMS } from './constants'

const CATEGORY_VALUES = new Set<TextbookCategoryFilter>([
  'all',
  ...TEXTBOOK_THEME_ITEMS.map(item => item.key),
])

const SORT_VALUES = new Set<TextbookSort>(['latest', 'name'])

function parseCategory(value: string | null): TextbookCategoryFilter {
  if (value && CATEGORY_VALUES.has(value as TextbookCategoryFilter)) {
    return value as TextbookCategoryFilter
  }
  return DEFAULT_TEXTBOOKS_LIST_PARAMS.category
}

function parseSort(value: string | null): TextbookSort {
  if (value && SORT_VALUES.has(value as TextbookSort)) {
    return value as TextbookSort
  }
  return DEFAULT_TEXTBOOKS_LIST_PARAMS.sort
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** URL → state. 없거나 잘못된 값이면 기본값(category=all, sort=latest, page=1) */
export function readTextbooksListParams(search = window.location.search): TextbooksListParams {
  const params = new URLSearchParams(search)
  return {
    category: parseCategory(params.get('category')),
    sort: parseSort(params.get('sort')),
    page: parsePositiveInt(params.get('page'), DEFAULT_TEXTBOOKS_LIST_PARAMS.page),
  }
}

/**
 * state → URL.
 * category·sort는 기본값 포함해 항상 기록 (공유·새로고침·뒤로가기 일관성)
 * page는 1이 아닐 때만 기록
 */
export function buildTextbooksListPath(params: TextbooksListParams) {
  const searchParams = new URLSearchParams()

  searchParams.set('category', params.category)
  searchParams.set('sort', params.sort)

  if (params.page !== DEFAULT_TEXTBOOKS_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  return `${TEXTBOOKS_PATH}?${searchParams.toString()}`
}
