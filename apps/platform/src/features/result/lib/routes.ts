import { RESULTS_PATH } from './constants'

export type ResultRouteName = 'list' | 'detail'

export type ParsedResultRoute =
  | { name: 'list' }
  | { name: 'detail'; resultId: string }

export function isResultsPath(pathname: string) {
  return pathname === RESULTS_PATH || pathname.startsWith(`${RESULTS_PATH}/`)
}

export function parseResultRoute(pathname: string): ParsedResultRoute | null {
  const detailMatch = pathname.match(/^\/results\/([^/]+)$/)
  if (detailMatch?.[1]) {
    return { name: 'detail', resultId: detailMatch[1] }
  }

  if (pathname === RESULTS_PATH) {
    return { name: 'list' }
  }

  return null
}

export function getResultIdFromPath(pathname = window.location.pathname) {
  const parsed = parseResultRoute(pathname)
  if (!parsed || parsed.name === 'list') {
    return null
  }

  return parsed.resultId
}
