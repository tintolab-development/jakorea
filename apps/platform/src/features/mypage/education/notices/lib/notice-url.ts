/** 안내사항 상세 팝업 — `?noticeId=` 로 열린 게시글을 공유·새로고침·뒤로가기와 맞춘다. */
export const NOTICE_ID_QUERY_KEY = 'noticeId'
export const COMMENT_ID_QUERY_KEY = 'commentId'

/** 브라우저 URL 이 SSOT — router params 는 한 커밋 늦을 수 있다. */
export function readNoticeIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get(NOTICE_ID_QUERY_KEY)?.trim()
  return value || null
}

/** 댓글 알림에서 특정 댓글을 강조할 때 사용하는 식별자. */
export function readCommentIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get(COMMENT_ID_QUERY_KEY)?.trim()
  return value || null
}

function buildLocationWithNoticeId(noticeId: string | null): string {
  const params = new URLSearchParams(window.location.search)
  if (noticeId) params.set(NOTICE_ID_QUERY_KEY, noticeId)
  else params.delete(NOTICE_ID_QUERY_KEY)
  const search = params.toString()
  return `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
}

/**
 * 팝업 오픈 1회당 push 1회, 게시글 이동·정리는 replace.
 * replace 는 결과가 현재 URL 과 같으면 쓰지 않는다.
 */
export function writeNoticeIdToLocation(noticeId: string | null, mode: 'push' | 'replace') {
  if (typeof window === 'undefined') return
  const next = buildLocationWithNoticeId(noticeId)
  if (mode === 'push') {
    window.history.pushState(null, '', next)
    return
  }
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(null, '', next)
}
