import type { CareersListParams } from '../model/types'
import { CAREERS_PATH, DEFAULT_CAREERS_LIST_PARAMS } from './constants'
import { parseCareersRoute } from './routes'

export const CAREERS_LIST_RETURN_STATE_KEY = 'careersListReturnPath'

const CAREERS_LIST_RETURN_STORAGE_KEY = 'platform:careers:list-return-path'

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

export function getCareersListReturnPath() {
  return `${window.location.pathname}${window.location.search}`
}

export function isCareersListReturnPath(path: string) {
  try {
    const url = new URL(path, window.location.origin)
    if (url.origin !== window.location.origin) return false
    return parseCareersRoute(url.pathname)?.name === 'list'
  } catch {
    return false
  }
}

export function rememberCareersListReturnPath(path = getCareersListReturnPath()) {
  if (typeof window === 'undefined') return
  if (!isCareersListReturnPath(path)) return

  try {
    window.sessionStorage.setItem(CAREERS_LIST_RETURN_STORAGE_KEY, path)
  } catch {
    /* private mode 등 */
  }
}

function readStoredCareersListReturnPath() {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.sessionStorage.getItem(CAREERS_LIST_RETURN_STORAGE_KEY)
    if (stored && isCareersListReturnPath(stored)) return stored
  } catch {
    /* private mode 등 */
  }

  return null
}

function readReturnPathFromState(state: unknown) {
  if (!state || typeof state !== 'object') return ''
  if (!(CAREERS_LIST_RETURN_STATE_KEY in state)) return ''
  const value = (state as Record<string, unknown>)[CAREERS_LIST_RETURN_STATE_KEY]
  return typeof value === 'string' ? value : ''
}

export function resolveCareersListReturnPath(state?: unknown) {
  const fromState = readReturnPathFromState(state)
  if (isCareersListReturnPath(fromState)) return fromState
  return readStoredCareersListReturnPath() ?? CAREERS_PATH
}

export function canNavigateBackInApp() {
  const idx = window.history.state?.idx
  return typeof idx === 'number' && idx > 0
}
