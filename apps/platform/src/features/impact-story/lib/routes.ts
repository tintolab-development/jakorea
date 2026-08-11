import { IMPACT_STORIES_PATH } from './constants'

export type ImpactStoryRouteName = 'list' | 'detail'

export type ParsedImpactStoryRoute =
  | { name: 'list' }
  | { name: 'detail'; storyId: string }

export function isImpactStoriesPath(pathname: string) {
  return pathname === IMPACT_STORIES_PATH || pathname.startsWith(`${IMPACT_STORIES_PATH}/`)
}

export function parseImpactStoryRoute(pathname: string): ParsedImpactStoryRoute | null {
  const detailMatch = pathname.match(/^\/impact\/([^/]+)$/)
  if (detailMatch?.[1]) {
    return { name: 'detail', storyId: detailMatch[1] }
  }

  if (pathname === IMPACT_STORIES_PATH) {
    return { name: 'list' }
  }

  return null
}

export function getImpactStoryIdFromPath(pathname = window.location.pathname) {
  const parsed = parseImpactStoryRoute(pathname)
  if (!parsed || parsed.name === 'list') {
    return null
  }

  return parsed.storyId
}
