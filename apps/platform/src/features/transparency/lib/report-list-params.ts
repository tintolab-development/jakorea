import type { TransparencyReportsListParams } from '../model/types'

export const DEFAULT_REPORTS_LIST_PARAMS: TransparencyReportsListParams = {
  q: '',
  page: 1,
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readReportsListParams(
  search = window.location.search
): TransparencyReportsListParams {
  const params = new URLSearchParams(search)

  return {
    q: params.get('q') ?? DEFAULT_REPORTS_LIST_PARAMS.q,
    page: parsePositiveInt(params.get('page'), DEFAULT_REPORTS_LIST_PARAMS.page),
  }
}

export function buildReportsListPath(
  basePath: string,
  params: TransparencyReportsListParams
) {
  const searchParams = new URLSearchParams()

  if (params.q) {
    searchParams.set('q', params.q)
  }
  if (params.page !== DEFAULT_REPORTS_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${basePath}?${query}` : basePath
}
