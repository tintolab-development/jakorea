import type { NoticeAttachment, NoticeContentFormat, NoticeDetail } from '../model/types'
import {
  formatNoticePublishedAtDetailLabel,
  formatNoticePublishedAtLabel,
} from './format'

/**
 * GET /api/public/ja-korea/notices/{id} — attachments[] 만 사용.
 */
export type PublicNoticeDetailSource = {
  id?: number | string
  pinned?: boolean
  publishAt?: string
  title?: string
  body?: string
  authorName?: string
  viewCount?: number
  attachments?: Array<{
    assetId?: number
    originalName?: string
    publicUrl?: string
  }>
}

function mapAttachments(source: PublicNoticeDetailSource): NoticeAttachment[] {
  return (source.attachments ?? []).flatMap((file, index) => {
    const name = file.originalName?.trim()
    const fileUrl = file.publicUrl?.trim()
    if (!name && !fileUrl) return []
    return [
      {
        id: file.assetId != null ? String(file.assetId) : `attachment-${index + 1}`,
        name: name || 'attachment',
        fileUrl,
      },
    ]
  })
}

export function toNoticeDetailView(detail: NoticeDetail): NoticeDetail {
  return {
    ...detail,
    attachments: detail.attachments.map(file => ({ ...file })),
  }
}

/** 공개 API `PublicNoticeDetail` → 화면 모델 */
export function mapPublicNoticeDetailToView(
  source: PublicNoticeDetailSource,
  extras?: { no?: number; contentFormat?: NoticeContentFormat }
): NoticeDetail {
  const publishedAt = source.publishAt ?? ''

  return {
    id: source.id != null ? String(source.id) : '',
    no: extras?.no ?? 0,
    title: source.title ?? '',
    isPinned: Boolean(source.pinned),
    publishedAt,
    publishedAtLabel: formatNoticePublishedAtLabel(publishedAt),
    publishedAtDetailLabel: formatNoticePublishedAtDetailLabel(publishedAt),
    content: source.body ?? '',
    contentFormat: extras?.contentFormat ?? 'html',
    author: source.authorName ?? '',
    viewCount: source.viewCount ?? 0,
    attachments: mapAttachments(source),
  }
}
