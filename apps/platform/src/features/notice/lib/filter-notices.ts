import type { NoticeListItem, NoticesListParams } from '../model/types'

type SearchableNotice = NoticeListItem & {
  content?: string
}

/**
 * 제목·내용 검색, 핀(isPinned) 상단 고정, 게시일 내림차순.
 */
export function filterAndSortNotices(
  items: readonly SearchableNotice[],
  params: Pick<NoticesListParams, 'q'>
): NoticeListItem[] {
  let next = [...items]

  if (params.q.trim()) {
    const query = params.q.trim().toLowerCase()
    next = next.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        (item.content?.toLowerCase().includes(query) ?? false)
    )
  }

  next.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1
    }

    const timeA = Date.parse(a.publishedAt)
    const timeB = Date.parse(b.publishedAt)
    const safeA = Number.isNaN(timeA) ? 0 : timeA
    const safeB = Number.isNaN(timeB) ? 0 : timeB
    return safeB - safeA
  })

  return next.map(({ id, no, title, isPinned, publishedAt, publishedAtLabel }) => ({
    id,
    no,
    title,
    isPinned,
    publishedAt,
    publishedAtLabel,
  }))
}
