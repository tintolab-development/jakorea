import type { CareersListParams } from '../model/types'
import { CAREERS_PATH, DEFAULT_CAREERS_LIST_PARAMS } from './constants'

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseTab(value: string | null): CareersListParams['tab'] {
  if (value === 'talent') {
    return 'talent'
  }
  return DEFAULT_CAREERS_LIST_PARAMS.tab
}

export function readCareersListParams(search = window.location.search): CareersListParams {
  const params = new URLSearchParams(search)

  return {
    tab: parseTab(params.get('tab')),
    q: params.get('q') ?? DEFAULT_CAREERS_LIST_PARAMS.q,
    page: parsePositiveInt(params.get('page'), DEFAULT_CAREERS_LIST_PARAMS.page),
  }
}

export function buildCareersListPath(params: CareersListParams) {
  const searchParams = new URLSearchParams()

  if (params.tab !== DEFAULT_CAREERS_LIST_PARAMS.tab) {
    searchParams.set('tab', params.tab)
  }
  if (params.q) {
    searchParams.set('q', params.q)
  }
  if (params.page !== DEFAULT_CAREERS_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${CAREERS_PATH}?${query}` : CAREERS_PATH
}
