import type { NoticesListParams } from '../model/types'
import { DEFAULT_NOTICES_LIST_PARAMS, NOTICES_PATH } from './constants'

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readNoticesListParams(search = window.location.search): NoticesListParams {
  const params = new URLSearchParams(search)

  return {
    q: params.get('q') ?? DEFAULT_NOTICES_LIST_PARAMS.q,
    page: parsePositiveInt(params.get('page'), DEFAULT_NOTICES_LIST_PARAMS.page),
  }
}

export function buildNoticesListPath(params: NoticesListParams) {
  const searchParams = new URLSearchParams()

  if (params.q) {
    searchParams.set('q', params.q)
  }
  if (params.page !== DEFAULT_NOTICES_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${NOTICES_PATH}?${query}` : NOTICES_PATH
}

export function getNoticesListReturnPath() {
  return `${window.location.pathname}${window.location.search}`
}
