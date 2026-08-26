/**
 * 임팩트 스토리 · 카테고리 — OpenAPI ↔ 도메인 매핑
 */

import type {
  ImpactStory,
  ImpactStoryAttachment,
  ImpactStoryAttachmentMime,
  ImpactStoryCategory,
  ImpactStoryCreateInput,
  ImpactStoryListFilter,
  ImpactStoryUpdateInput,
} from '@/entities/impact-stories/model/types'
import { markdownToHtml } from '@/shared/rich-text'
import type { BulkDeleteRequest } from '@/shared/api/generated/impact-story/schemas/bulkDeleteRequest'
import type { CategoryCreateRequest } from '@/shared/api/generated/impact-story/schemas/categoryCreateRequest'
import type { CategoryResponse } from '@/shared/api/generated/impact-story/schemas/categoryResponse'
import type { CategoryUpdateRequest } from '@/shared/api/generated/impact-story/schemas/categoryUpdateRequest'
import type { List7Params } from '@/shared/api/generated/impact-story/schemas/list7Params'
import type { PublishedToggleRequest } from '@/shared/api/generated/impact-story/schemas/publishedToggleRequest'
import type { StoryCreateRequest } from '@/shared/api/generated/impact-story/schemas/storyCreateRequest'
import type { StoryListItem } from '@/shared/api/generated/impact-story/schemas/storyListItem'
import type { StoryResponse } from '@/shared/api/generated/impact-story/schemas/storyResponse'
import type { StoryUpdateRequest } from '@/shared/api/generated/impact-story/schemas/storyUpdateRequest'

/** BE default / list-page-size.mdc */
export const LIST_PAGE_SIZE = 20

function mimeFromContentType(contentType: string | undefined): ImpactStoryAttachmentMime {
  if (contentType?.toLowerCase().includes('png')) return 'image/png'
  return 'image/jpeg'
}

function looksLikeHtml(value: string): boolean {
  return /^\s*</.test(value)
}

/** FE 본문 → API body (HTML). markdown이면 변환, 이미 HTML이면 그대로. */
export function toApiStoryBody(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return trimmed
  if (looksLikeHtml(trimmed)) return trimmed
  return markdownToHtml(trimmed)
}

export function mapCategoryResponseToDomain(
  row: CategoryResponse,
  sortOrder = 0,
): ImpactStoryCategory {
  return {
    id: row.id != null ? String(row.id) : '',
    name: row.name ?? '',
    sortOrder,
    version: row.version ?? 0,
    storyCount: row.storyCount ?? 0,
  }
}

export function toCategoryCreateRequest(name: string): CategoryCreateRequest {
  return { name: name.trim() }
}

export function toCategoryUpdateRequest(
  name: string,
  version: number,
): CategoryUpdateRequest {
  return { name: name.trim(), version }
}

/** 서버에 이미 저장된 카테고리 id (numeric string) */
export function isPersistedCategoryId(id: string): boolean {
  const n = Number(id)
  return Number.isFinite(n) && n > 0 && String(n) === id.trim()
}

function mapAttachmentFromResponse(row: StoryResponse): ImpactStoryAttachment[] {
  if (row.attachment?.assetId == null) return []
  return [
    {
      id: String(row.attachment.assetId),
      name: row.attachmentOriginalName ?? row.attachment.originalName ?? 'attachment',
      mime: mimeFromContentType(row.attachment.contentType),
      dataUrl: row.attachment.publicUrl,
      assetId: row.attachment.assetId,
    },
  ]
}

export function mapStoryListItemToDomain(row: StoryListItem): ImpactStory {
  return {
    id: row.id != null ? String(row.id) : '',
    categoryId: row.categoryId != null ? String(row.categoryId) : '',
    categoryName: row.categoryName,
    title: row.title ?? '',
    contentMarkdown: '',
    isPublic: Boolean(row.published),
    isPinned: Boolean(row.pinned),
    authorName: row.authorName ?? '',
    publishedAt: row.publishAt ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
    viewCount: row.viewCount ?? 0,
    attachments: [],
    version: row.version ?? 0,
  }
}

export function mapStoryResponseToDomain(row: StoryResponse): ImpactStory {
  return {
    id: row.id != null ? String(row.id) : '',
    categoryId: row.categoryId != null ? String(row.categoryId) : '',
    categoryName: row.categoryName,
    title: row.title ?? '',
    contentMarkdown: row.body ?? '',
    isPublic: Boolean(row.published),
    isPinned: Boolean(row.pinned),
    authorName: row.authorName ?? '',
    publishedAt: row.publishAt ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
    viewCount: row.viewCount ?? 0,
    attachments: mapAttachmentFromResponse(row),
    version: row.version ?? 0,
  }
}

/**
 * applied 필터 → list GET query (list-filter-query-api.mdc)
 */
export function toStoryListParams(filter?: ImpactStoryListFilter): List7Params {
  const params: List7Params = {
    page: filter?.page ?? 0,
    size: LIST_PAGE_SIZE,
  }
  if (!filter) return params

  if (filter.visibility === 'public') params.published = true
  if (filter.visibility === 'private') params.published = false

  const categoryId = filter.categoryId?.trim()
  if (categoryId) {
    const n = Number(categoryId)
    if (Number.isFinite(n) && n > 0) params.categoryId = n
  }

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

export function resolvePrimaryAttachmentAssetId(
  attachments: ImpactStoryAttachment[],
): number | undefined {
  for (const att of attachments) {
    if (att.assetId != null && att.assetId > 0) return att.assetId
  }
  return undefined
}

export function toStoryCreateRequest(
  input: ImpactStoryCreateInput,
  attachmentAssetId?: number,
): StoryCreateRequest {
  return {
    published: input.isPublic,
    pinned: input.isPinned,
    publishAt: input.publishedAt,
    categoryId: Number(input.categoryId),
    title: input.title.trim(),
    body: toApiStoryBody(input.contentMarkdown),
    attachmentAssetId,
  }
}

export function toStoryUpdateRequest(
  input: ImpactStoryUpdateInput,
  version: number,
  attachmentAssetId?: number,
): StoryUpdateRequest {
  return {
    published: input.isPublic,
    pinned: input.isPinned,
    publishAt: input.publishedAt,
    categoryId: Number(input.categoryId),
    title: input.title.trim(),
    body: toApiStoryBody(input.contentMarkdown),
    attachmentAssetId,
    version,
  }
}

export function toPublishedToggleRequest(
  row: ImpactStory,
  published: boolean,
): PublishedToggleRequest {
  return {
    published,
    version: row.version ?? 0,
  }
}

export function toBulkDeleteRequest(rows: ImpactStory[]): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version ?? 0,
    })),
  }
}
