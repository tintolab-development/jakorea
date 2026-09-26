import type { NoticeListItem } from '../model/types'

export type AdjacentNotices = {
  previous: NoticeListItem | null
  next: NoticeListItem | null
}

/**
 * 핀 상단 + 게시일 desc 가 이미 반영된 목록 기준 인접 글.
 * - previous(이전글): 목록에서 아래(더 오래된) 글
 * - next(다음글): 목록에서 위(더 최근) 글
 */
export function getAdjacentFromNotices(
  notices: readonly NoticeListItem[],
  id: string,
): AdjacentNotices {
  const index = notices.findIndex(item => item.id === id)
  if (index < 0) {
    return { previous: null, next: null }
  }
  return {
    next: index > 0 ? (notices[index - 1] ?? null) : null,
    previous: index < notices.length - 1 ? (notices[index + 1] ?? null) : null,
  }
}
