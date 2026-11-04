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
import type { AssetResponse } from '@/shared/api/generated/ja-korea/schemas/assetResponse'
import type { BulkDeleteRequest } from '@/shared/api/generated/ja-korea/schemas/bulkDeleteRequest'
import type { List5Params } from '@/shared/api/generated/ja-korea/schemas/list5Params'
import type { NoticeCreateRequest } from '@/shared/api/generated/ja-korea/schemas/noticeCreateRequest'
import type { NoticeResponse } from '@/shared/api/generated/ja-korea/schemas/noticeResponse'
import type { NoticeUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/noticeUpdateRequest'
import type { PublishedToggleRequest } from '@/shared/api/generated/ja-korea/schemas/publishedToggleRequest'
import { generalAttachmentMimeFromContentType } from '@/shared/lib/attachment-policy'

function mimeFromContentType(contentType: string | undefined): NoticeAttachmentMime {
  return generalAttachmentMimeFromContentType(contentType)
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

function mapAssetAttachments(assets: AssetResponse[] | undefined): NoticeAttachment[] {
  if (!assets?.length) return []
  return assets.flatMap(asset => {
    if (asset.assetId == null) return []
    return [
      {
        id: String(asset.assetId),
        name: asset.originalName ?? 'attachment',
        mime: mimeFromContentType(asset.contentType),
        dataUrl: asset.publicUrl,
        assetId: asset.assetId,
      },
    ]
  })
}

export function mapNoticeResponseToDomain(row: NoticeResponse): Notice {
  const id = row.id != null ? String(row.id) : ''
  const attachments = mapAssetAttachments(row.attachments)

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

export function toNoticeListParams(
  filter?: NoticeListFilter,
  page = 0,
  size = 20
): List5Params {
  const params: List5Params = {
    page,
    size,
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

export function toNoticeCreateRequest(
  input: NoticeCreateInput,
  attachmentAssetIds: number[],
): NoticeCreateRequest {
  return {
    published: input.isPublic,
    pinned: input.isPinned,
    publishAt: input.publishedAt,
    title: input.title.trim(),
    body: toApiNoticeBody(input.contentMarkdown),
    attachmentAssetIds,
  }
}

export function toNoticeUpdateRequest(
  input: NoticeUpdateInput,
  version: number,
  attachmentAssetIds: number[],
): NoticeUpdateRequest {
  return {
    published: input.isPublic,
    pinned: input.isPinned,
    publishAt: input.publishedAt,
    title: input.title.trim(),
    body: toApiNoticeBody(input.contentMarkdown),
    attachmentAssetIds,
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
