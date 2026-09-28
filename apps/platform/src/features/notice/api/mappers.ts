import type { NoticeDetail, NoticeListItem } from '../model/types'
import { formatNoticePublishedAtLabel } from '../lib/format'
import { mapPublicNoticeDetailToView } from '../lib/map-detail'
import type { PublicNoticeDetail, PublicNoticeListItem } from './types'

export function parsePublicNoticeId(id: string | null | undefined): number | null {
  if (id == null || id === '') return null
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return null
  return n
}

export function mapPublicNoticeListItem(
  row: PublicNoticeListItem,
  no: number,
): NoticeListItem | null {
  const id = row.id
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  if (id == null || !Number.isFinite(id) || !title) return null

  const publishedAt =
    typeof row.publishAt === 'string' && row.publishAt.trim() ? row.publishAt.trim() : ''

  return {
    id: String(id),
    no,
    title,
    isPinned: Boolean(row.pinned),
    publishedAt,
    publishedAtLabel: formatNoticePublishedAtLabel(publishedAt),
  }
}

/** 목록 번호: 전체 건수 기준 내림차순 (1페이지 첫 행 = totalCount) */
export function mapPublicNoticeListItems(
  rows: readonly PublicNoticeListItem[] | undefined,
  totalCount: number,
  pageIndex: number,
  pageSize: number,
): NoticeListItem[] {
  const items = rows ?? []
  return items
    .map((row, index) =>
      mapPublicNoticeListItem(row, Math.max(1, totalCount - (pageIndex * pageSize + index))),
    )
    .filter((item): item is NoticeListItem => item != null)
}

export function mapPublicNoticeDetail(row: PublicNoticeDetail): NoticeDetail | null {
  if (row.id == null || !Number.isFinite(row.id)) return null
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  if (!title) return null
  return mapPublicNoticeDetailToView(row, { no: 0, contentFormat: 'html' })
}
