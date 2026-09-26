import type { NoticeAttachment, NoticeContentFormat, NoticeDetail } from '../model/types'
import {
  formatNoticePublishedAtDetailLabel,
  formatNoticePublishedAtLabel,
} from './format'

/**
 * 홈페이지 어드민 공개 공지 응답 형태.
 * `apps/admin` PublicNoticeDetail 을 참고한 화면 매퍼 입력 — 백엔드 계약을 확정하지 않음.
 */
export type PublicNoticeDetailSource = {
  id?: number | string
  pinned?: boolean
  publishAt?: string
  title?: string
  body?: string
  attachmentFileName?: string
  attachmentUrl?: string
  authorName?: string
  viewCount?: number
  attachments?: Array<{
    id?: number | string
    name?: string
    fileName?: string
    url?: string
    fileUrl?: string
    mime?: string
    contentType?: string
    size?: number
  }>
}

function mapAttachments(source: PublicNoticeDetailSource): NoticeAttachment[] {
  if (source.attachments && source.attachments.length > 0) {
    return source.attachments.map((file, index) => ({
      id: String(file.id ?? `attachment-${index + 1}`),
      name: (file.name ?? file.fileName ?? 'attachment').trim() || 'attachment',
      fileUrl: file.fileUrl ?? file.url,
      mime: file.mime ?? file.contentType,
      size: file.size,
    }))
  }

  if (source.attachmentFileName || source.attachmentUrl) {
    return [
      {
        id: 'attachment-1',
        name: source.attachmentFileName?.trim() || 'attachment',
        fileUrl: source.attachmentUrl,
      },
    ]
  }

  return []
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
