/**
 * 공지사항 — OpenAPI ↔ 도메인 매핑
 */

import type {
  Notice,
  NoticeAttachment,
  NoticeAttachmentMime,
  NoticeCreateInput,
  NoticeListFilter,
  NoticeUpdateInput,
} from '@/entities/notices/model/types'
import { markdownToHtml } from '@/shared/rich-text'
import type { BulkDeleteRequest } from '@/shared/api/generated/ja-korea/schemas/bulkDeleteRequest'
import type { List6Params } from '@/shared/api/generated/ja-korea/schemas/list6Params'
import type { NoticeCreateRequest } from '@/shared/api/generated/ja-korea/schemas/noticeCreateRequest'
import type { NoticeResponse } from '@/shared/api/generated/ja-korea/schemas/noticeResponse'
import type { NoticeUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/noticeUpdateRequest'
import type { PublishedToggleRequest } from '@/shared/api/generated/ja-korea/schemas/publishedToggleRequest'

function mimeFromContentType(contentType: string | undefined): NoticeAttachmentMime {
  if (contentType?.toLowerCase().includes('png')) return 'image/png'
  return 'image/jpeg'
}

function looksLikeHtml(value: string): boolean {
  return /^\s*</.test(value)
}

/** FE 본문 → API body (HTML). markdown이면 변환, 이미 HTML이면 그대로. */
export function toApiNoticeBody(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return trimmed
  if (looksLikeHtml(trimmed)) return trimmed
  return markdownToHtml(trimmed)
}

export function mapNoticeResponseToDomain(row: NoticeResponse): Notice {
  const id = row.id != null ? String(row.id) : ''
  const attachments: NoticeAttachment[] = []
  if (row.attachment?.assetId != null) {
    attachments.push({
      id: String(row.attachment.assetId),
      name: row.attachmentFileName ?? row.attachment.originalName ?? 'attachment',
      mime: mimeFromContentType(row.attachment.contentType),
      dataUrl: row.attachment.publicUrl,
      assetId: row.attachment.assetId,
    })
  }

  return {
    id,
    title: row.title ?? '',
    contentMarkdown: row.body ?? '',
    isPublic: Boolean(row.published),
    isPinned: Boolean(row.pinned),
    authorName: row.authorName ?? '',
    publishedAt: row.publishAt ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
    viewCount: row.viewCount ?? 0,
    attachments,
    version: row.version ?? 0,
  }
}

export function toNoticeListParams(filter?: NoticeListFilter): List6Params {
  const params: List6Params = {
    page: 0,
    // BE: size must be between 1 and 100
    size: 100,
  }
  if (!filter) return params

  if (filter.visibility === 'public') params.published = true
  if (filter.visibility === 'private') params.published = false

  const title = filter.title?.trim()
  if (title) params.title = title

  const authorName = filter.authorName?.trim()
  if (authorName) params.authorName = authorName

  if (filter.publishedFrom?.trim()) params.publishFrom = filter.publishedFrom.trim()
  if (filter.publishedTo?.trim()) params.publishTo = filter.publishedTo.trim()
  if (filter.createdFrom?.trim()) params.createdFrom = filter.createdFrom.trim()
  if (filter.createdTo?.trim()) params.createdTo = filter.createdTo.trim()

  return params
}

/** API는 첨부 1건만 지원 — 첫 번째 유효 asset/file 기준 */
export function resolvePrimaryAttachmentAssetId(
  attachments: NoticeAttachment[],
): number | undefined {
  for (const att of attachments) {
    if (att.assetId != null && att.assetId > 0) return att.assetId
  }
  return undefined
}

export function toNoticeCreateRequest(
  input: NoticeCreateInput,
  attachmentAssetId?: number,
): NoticeCreateRequest {
  return {
    published: input.isPublic,
    pinned: input.isPinned,
    publishAt: input.publishedAt,
    title: input.title.trim(),
    body: toApiNoticeBody(input.contentMarkdown),
    attachmentAssetId,
  }
}

export function toNoticeUpdateRequest(
  input: NoticeUpdateInput,
  version: number,
  attachmentAssetId?: number,
): NoticeUpdateRequest {
  return {
    published: input.isPublic,
    pinned: input.isPinned,
    publishAt: input.publishedAt,
    title: input.title.trim(),
    body: toApiNoticeBody(input.contentMarkdown),
    attachmentAssetId,
    version,
  }
}

export function toPublishedToggleRequest(
  row: Notice,
  published: boolean,
): PublishedToggleRequest {
  return {
    published,
    version: row.version,
  }
}

export function toBulkDeleteRequest(rows: Notice[]): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}
