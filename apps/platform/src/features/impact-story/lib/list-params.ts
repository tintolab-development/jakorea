import type { ImpactStoriesListParams } from '../model/types'
import {
  DEFAULT_IMPACT_STORIES_LIST_PARAMS,
  IMPACT_STORIES_PATH,
  isImpactStoryListCategory,
} from './constants'

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readImpactStoriesListParams(
  search = window.location.search
): ImpactStoriesListParams {
  const params = new URLSearchParams(search)
  const categoryRaw = params.get('category') ?? DEFAULT_IMPACT_STORIES_LIST_PARAMS.category

  return {
    category: isImpactStoryListCategory(categoryRaw)
      ? categoryRaw
      : DEFAULT_IMPACT_STORIES_LIST_PARAMS.category,
    q: params.get('q') ?? DEFAULT_IMPACT_STORIES_LIST_PARAMS.q,
    page: parsePositiveInt(params.get('page'), DEFAULT_IMPACT_STORIES_LIST_PARAMS.page),
  }
}

export function buildImpactStoriesListPath(params: ImpactStoriesListParams) {
  const searchParams = new URLSearchParams()

  if (params.category !== DEFAULT_IMPACT_STORIES_LIST_PARAMS.category) {
    searchParams.set('category', params.category)
  }
  if (params.q) {
    searchParams.set('q', params.q)
  }
  if (params.page !== DEFAULT_IMPACT_STORIES_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${IMPACT_STORIES_PATH}?${query}` : IMPACT_STORIES_PATH
}
