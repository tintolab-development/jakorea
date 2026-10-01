import type { Notice } from '@/data/mock/notices'
import { dedupeFileObjectIds } from '@/features/posts/api/notices/notice-file-ids'
import type { BuildNoticeBodyParams } from '@/features/posts/model/notice-form-mapper'
import type {
  NoticeRequest,
  NoticeResponse,
  PageResponseNoticeResponse,
} from '@/shared/api/generated/posts/schemas'
import { NoticeRequestStatus } from '@/shared/api/generated/posts/schemas/noticeRequestStatus'

/** 생성 OpenAPI NoticeRequest에는 아직 없지만, 신규 공지 claim 계약 필드다. */
export type NoticeWriteRequest = NoticeRequest & {
  fileObjectIds?: number[]
}

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

function parseCategoryId(dto: NoticeResponse): number | undefined {
  const extended = dto as NoticeResponse & { categoryId?: number | string }
  const raw = extended.categoryId
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return Number(raw.trim())
  return undefined
}

function parseResourceId(dto: NoticeResponse): number | undefined {
  // OpenAPI는 number만 선언하지만, 런타임 string id 호환을 위해 넓게 읽는다.
  const raw = (dto as { resourceId?: number | string }).resourceId
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1) return raw
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
    const parsed = Number(raw.trim())
    return parsed >= 1 ? parsed : undefined
  }
  return undefined
}

export function mapNoticeResponse(dto: NoticeResponse): Notice {
  const createdAt = dto.createdAt ?? new Date().toISOString()
  return {
    id: dto.id != null ? String(dto.id) : '',
    resourceId: parseResourceId(dto),
    title: dto.title ?? '',
    content: dto.content ?? '',
    category: dto.category ?? '',
    categoryId: parseCategoryId(dto),
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

export function toNoticeRequestFromForm(params: BuildNoticeBodyParams): NoticeWriteRequest {
  const fileObjectIds = dedupeFileObjectIds(params.fileObjectIds ?? [])
  return {
    title: params.title.trim(),
    content: params.contentMarkdown,
    categoryId: params.categoryId,
    isImportant: params.pinToTop,
    author: params.author,
    status:
      params.visibility === 'public' ? NoticeRequestStatus.published : NoticeRequestStatus.임시저장,
    ...(fileObjectIds.length > 0 ? { fileObjectIds } : {}),
  }
}

export function toNoticeRequestFromNotice(notice: Notice): NoticeRequest {
  return {
    title: notice.title,
    content: notice.content,
    categoryId: notice.categoryId,
    isImportant: notice.isImportant,
    author: notice.author,
    hasAttachment: notice.hasAttachment,
    status: toNoticeRequestStatus(notice.status),
  }
}
