import { NOTICES_PATH } from './constants'

export type NoticeRouteName = 'list' | 'detail'

export type ParsedNoticeRoute =
  | { name: 'list' }
  | { name: 'detail'; noticeId: string }

export function isNoticesPath(pathname: string) {
  return pathname === NOTICES_PATH || pathname.startsWith(`${NOTICES_PATH}/`)
}

export function parseNoticeRoute(pathname: string): ParsedNoticeRoute | null {
  const detailMatch = pathname.match(/^\/notices\/([^/]+)$/)
  if (detailMatch?.[1]) {
    return { name: 'detail', noticeId: detailMatch[1] }
  }

  if (pathname === NOTICES_PATH) {
    return { name: 'list' }
  }

  return null
}

export function getNoticeIdFromPath(pathname = window.location.pathname) {
  const parsed = parseNoticeRoute(pathname)
  if (!parsed || parsed.name === 'list') {
    return null
  }

  return parsed.noticeId
}
