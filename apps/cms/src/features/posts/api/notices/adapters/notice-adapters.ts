import type { Notice } from '@/data/mock/notices'
import type { BuildNoticeBodyParams } from '@/features/posts/model/notice-form-mapper'
import type {
  NoticeRequest,
  NoticeResponse,
  PageResponseNoticeResponse,
} from '@/shared/api/generated/posts/schemas'
import { NoticeRequestStatus } from '@/shared/api/generated/posts/schemas/noticeRequestStatus'

function parseNoticeStatus(value: string | undefined): Notice['status'] {
  if (value === 'published' || value === 'archived') return value
  if (value === 'draft' || value === NoticeRequestStatus.임시저장) return 'draft'
  return 'draft'
}

function toNoticeRequestStatus(status: Notice['status'] | undefined): NoticeRequest['status'] {
  if (status == null) return undefined
  if (status === 'published') return NoticeRequestStatus.published
  if (status === 'archived') return NoticeRequestStatus.archived
  return NoticeRequestStatus.임시저장
}

export function mapNoticeResponse(dto: NoticeResponse): Notice {
  const createdAt = dto.createdAt ?? new Date().toISOString()
  return {
    id: dto.id != null ? String(dto.id) : '',
    title: dto.title ?? '',
    content: dto.content ?? '',
    category: dto.category ?? '',
    createdAt,
    updatedAt: dto.updatedAt ?? createdAt,
    isImportant: Boolean(dto.isImportant),
    viewCount: dto.viewCount ?? 0,
    hasAttachment: Boolean(dto.hasAttachment),
    author: dto.author ?? '',
    status: parseNoticeStatus(dto.status),
    attachments: dto.hasAttachment ? [] : undefined,
  }
}

function noticeListItems(
  dto: PageResponseNoticeResponse | NoticeResponse[] | { content?: NoticeResponse[] } | null | undefined
): NoticeResponse[] {
  if (Array.isArray(dto)) return dto
  if (dto == null || typeof dto !== 'object') return []
  const record = dto as { items?: NoticeResponse[]; content?: NoticeResponse[] }
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.content)) return record.content
  return []
}

export function mapNoticeListResponse(
  dto: PageResponseNoticeResponse | NoticeResponse[] | { content?: NoticeResponse[] } | null | undefined
): Notice[] {
  return noticeListItems(dto)
    .map(mapNoticeResponse)
    .filter(row => row.id.length > 0)
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
    status:
      params.visibility === 'public' ? NoticeRequestStatus.published : NoticeRequestStatus.임시저장,
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
    status: toNoticeRequestStatus(notice.status),
  }
}
