import type { ResultSort, ResultsListParams } from '../model/types'
import { DEFAULT_RESULTS_LIST_PARAMS, RESULTS_PATH } from './constants'

const RESULT_SORTS = new Set<ResultSort>(['latest', 'title'])

function parseSort(value: string | null): ResultSort {
  if (value && RESULT_SORTS.has(value as ResultSort)) {
    return value as ResultSort
  }

  return DEFAULT_RESULTS_LIST_PARAMS.sort
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readResultsListParams(search = window.location.search): ResultsListParams {
  const params = new URLSearchParams(search)

  return {
    category: params.get('category') ?? DEFAULT_RESULTS_LIST_PARAMS.category,
    q: params.get('q') ?? DEFAULT_RESULTS_LIST_PARAMS.q,
    sort: parseSort(params.get('sort')),
    page: parsePositiveInt(params.get('page'), DEFAULT_RESULTS_LIST_PARAMS.page),
  }
}

export function buildResultsListPath(params: ResultsListParams) {
  const searchParams = new URLSearchParams()

  if (params.category !== DEFAULT_RESULTS_LIST_PARAMS.category) {
    searchParams.set('category', params.category)
  }
  if (params.q) {
    searchParams.set('q', params.q)
  }
  if (params.sort !== DEFAULT_RESULTS_LIST_PARAMS.sort) {
    searchParams.set('sort', params.sort)
  }
  if (params.page !== DEFAULT_RESULTS_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${RESULTS_PATH}?${query}` : RESULTS_PATH
}

export function getResultsListReturnPath() {
  return `${window.location.pathname}${window.location.search}`
}
