import type { Notice } from '@/data/mock/notices'
import type { BuildNoticeBodyParams } from '@/features/posts/model/notice-form-mapper'
import type {
  NoticeRequest,
  NoticeResponse,
  PageResponseNoticeResponse,
} from '@/shared/api/generated/posts/schemas'

function parseNoticeStatus(value: string | undefined): Notice['status'] {
  if (value === 'published' || value === 'draft' || value === 'archived') return value
  return 'draft'
}

export function mapNoticeResponse(dto: NoticeResponse): Notice {
  return {
    id: dto.id ?? '',
    title: dto.title ?? '',
    content: dto.content ?? '',
    category: dto.category ?? '',
    createdAt: dto.createdAt ?? new Date().toISOString(),
    isImportant: Boolean(dto.isImportant),
    viewCount: dto.viewCount ?? 0,
    hasAttachment: Boolean(dto.hasAttachment),
    author: dto.author ?? '',
    status: parseNoticeStatus(dto.status),
    attachments: dto.hasAttachment ? [] : undefined,
  }
}

export function mapNoticeListResponse(dto: PageResponseNoticeResponse): Notice[] {
  return (dto.items ?? []).map(mapNoticeResponse)
}

export function toNoticeRequestFromForm(params: BuildNoticeBodyParams): NoticeRequest {
  const attachmentNames = params.attachmentNames.map(n => n.trim()).filter(Boolean)
  return {
    title: params.title.trim(),
    content: params.contentMarkdown,
    category: params.category,
    isImportant: params.pinToTop,
    author: params.author,
    hasAttachment: attachmentNames.length > 0,
    status: params.visibility === 'public' ? 'published' : 'draft',
  }
}

export function toNoticeRequestFromNotice(notice: Notice): NoticeRequest {
  return {
    title: notice.title,
    content: notice.content,
    category: notice.category,
    isImportant: notice.isImportant,
    author: notice.author,
    hasAttachment: notice.hasAttachment,
    status: notice.status,
  }
}
