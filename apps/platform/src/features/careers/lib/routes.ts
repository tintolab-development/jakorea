import { CAREERS_PATH } from './constants'

export type CareersRouteName = 'list' | 'detail'

export type ParsedCareersRoute =
  | { name: 'list' }
  | { name: 'detail'; postingId: string }

export function isCareersPath(pathname: string) {
  return pathname === CAREERS_PATH || pathname.startsWith(`${CAREERS_PATH}/`)
}

export function parseCareersRoute(pathname: string): ParsedCareersRoute | null {
  const detailMatch = pathname.match(/^\/about\/careers\/([^/]+)$/)
  if (detailMatch?.[1]) {
    return { name: 'detail', postingId: decodeURIComponent(detailMatch[1]) }
  }

  if (pathname === CAREERS_PATH) {
    return { name: 'list' }
  }

  return null
}

export function getCareerPostingIdFromPath(pathname = window.location.pathname) {
  const parsed = parseCareersRoute(pathname)
  if (!parsed || parsed.name === 'list') {
    return null
  }

  return parsed.postingId
}
