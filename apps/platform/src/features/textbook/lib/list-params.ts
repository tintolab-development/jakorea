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

/** 교육 콘텐츠 안내 모달 — 목록 필터와 함께 쓰는 상세 id 쿼리 키 */
export const TEXTBOOK_DETAIL_ID_PARAM = 'id'

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

function parseDetailId(value: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** URL → 목록 필터. 없거나 잘못된 값이면 기본값(category=all, sort=latest, page=1) */
export function readTextbooksListParams(search = window.location.search): TextbooksListParams {
  const params = new URLSearchParams(search)
  return {
    category: parseCategory(params.get('category')),
    sort: parseSort(params.get('sort')),
    page: parsePositiveInt(params.get('page'), DEFAULT_TEXTBOOKS_LIST_PARAMS.page),
  }
}

/**
 * 브라우저 URL에서 상세 모달 id를 동기로 읽는다.
 * (react-router searchParams 지연으로 모달이 닫히는 것 방지)
 */
export function readTextbookDetailIdFromLocation(search = window.location.search): string | null {
  return parseDetailId(new URLSearchParams(search).get(TEXTBOOK_DETAIL_ID_PARAM))
}

export type BuildTextbooksListPathOptions = {
  /** 있으면 `id` 기록. `null`/`undefined`면 목록만 */
  detailId?: string | null
}

/**
 * state → URL.
 * category·sort는 기본값 포함해 항상 기록 (공유·새로고침·뒤로가기 일관성)
 * page는 1이 아닐 때만 기록
 * detailId는 모달 열림일 때만 기록
 */
export function buildTextbooksListPath(
  params: TextbooksListParams,
  options: BuildTextbooksListPathOptions = {},
) {
  const searchParams = new URLSearchParams()

  searchParams.set('category', params.category)
  searchParams.set('sort', params.sort)

  if (params.page !== DEFAULT_TEXTBOOKS_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const detailId = options.detailId?.trim()
  if (detailId) {
    searchParams.set(TEXTBOOK_DETAIL_ID_PARAM, detailId)
  }

  return `${TEXTBOOKS_PATH}?${searchParams.toString()}`
}
