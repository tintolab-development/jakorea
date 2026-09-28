import type { NoticesListParams } from '../model/types'
import { DEFAULT_NOTICES_LIST_PARAMS, NOTICES_PATH } from './constants'
import { parseNoticeRoute } from './routes'

export const NOTICES_LIST_RETURN_STATE_KEY = 'noticesListReturnPath'

const NOTICES_LIST_RETURN_STORAGE_KEY = 'platform:notices:list-return-path'

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

export function isNoticesListReturnPath(path: string) {
  try {
    const url = new URL(path, window.location.origin)
    if (url.origin !== window.location.origin) return false
    return parseNoticeRoute(url.pathname)?.name === 'list'
  } catch {
    return false
  }
}

export function rememberNoticesListReturnPath(path = getNoticesListReturnPath()) {
  if (typeof window === 'undefined') return
  if (!isNoticesListReturnPath(path)) return

  try {
    window.sessionStorage.setItem(NOTICES_LIST_RETURN_STORAGE_KEY, path)
  } catch {
    /* private mode 등 */
  }
}

function readStoredNoticesListReturnPath() {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.sessionStorage.getItem(NOTICES_LIST_RETURN_STORAGE_KEY)
    if (stored && isNoticesListReturnPath(stored)) return stored
  } catch {
    /* private mode 등 */
  }

  return null
}

function readReturnPathFromState(state: unknown) {
  if (!state || typeof state !== 'object') return ''
  if (!(NOTICES_LIST_RETURN_STATE_KEY in state)) return ''
  const value = (state as Record<string, unknown>)[NOTICES_LIST_RETURN_STATE_KEY]
  return typeof value === 'string' ? value : ''
}

export function resolveNoticesListReturnPath(state?: unknown) {
  const fromState = readReturnPathFromState(state)
  if (isNoticesListReturnPath(fromState)) return fromState
  return readStoredNoticesListReturnPath() ?? NOTICES_PATH
}

export function canNavigateBackInApp() {
  const idx = window.history.state?.idx
  return typeof idx === 'number' && idx > 0
}
