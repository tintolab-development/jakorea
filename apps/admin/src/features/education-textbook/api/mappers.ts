/**
 * 교재 — OpenAPI ↔ 도메인 매핑
 */

import type {
  EducationTextbook,
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'
import { markdownToHtml } from '@/shared/rich-text'
import type { EnabledToggleRequest } from '@/shared/api/generated/education/schemas/enabledToggleRequest'
import type { List9Params } from '@/shared/api/generated/education/schemas/list9Params'
import type { TextbookBulkDeleteRequest } from '@/shared/api/generated/education/schemas/textbookBulkDeleteRequest'
import type { TextbookCreateRequest } from '@/shared/api/generated/education/schemas/textbookCreateRequest'
import type { TextbookListItem } from '@/shared/api/generated/education/schemas/textbookListItem'
import type { TextbookResponse } from '@/shared/api/generated/education/schemas/textbookResponse'
import type { TextbookUpdateRequest } from '@/shared/api/generated/education/schemas/textbookUpdateRequest'
import { DEFAULT_TEXTBOOK_THUMBNAIL } from './store'

/** list-page-size.mdc */
export const LIST_PAGE_SIZE = 20

function looksLikeHtml(value: string): boolean {
  return /^\s*</.test(value)
}

export function toApiUnitIntroHtml(content: string): string | undefined {
  const trimmed = content.trim()
  if (!trimmed) return undefined
  if (looksLikeHtml(trimmed)) return trimmed
  return markdownToHtml(trimmed)
}

function mapListOrDetailCommon(
  row: TextbookListItem | TextbookResponse,
): Omit<EducationTextbook, 'description' | 'unitCount' | 'unitSessionText' | 'unitIntroMarkdown' | 'authorName'> {
  return {
    id: row.id != null ? String(row.id) : '',
    isActive: Boolean(row.enabled),
    businessFieldId:
      row.businessField?.id != null ? String(row.businessField.id) : '',
    educationTargetIds: (row.targets ?? [])
      .map(t => (t.id != null ? String(t.id) : ''))
      .filter(Boolean),
    educationEffect: row.educationEffect ?? '',
    title: row.textbookName ?? '',
    thumbnailUrl: row.thumbnail?.publicUrl ?? DEFAULT_TEXTBOOK_THUMBNAIL,
    thumbnailFileName: row.thumbnail?.originalName,
    thumbnailAssetId: row.thumbnail?.assetId,
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function mapTextbookListItemToDomain(row: TextbookListItem): EducationTextbook {
  return {
    ...mapListOrDetailCommon(row),
    description: '',
    unitCount: 1,
    unitSessionText: '',
    unitIntroMarkdown: '',
    authorName: '',
  }
}

export function mapTextbookResponseToDomain(row: TextbookResponse): EducationTextbook {
  return {
    ...mapListOrDetailCommon(row),
    description: row.description ?? '',
    unitCount: row.unitCount ?? 1,
    unitSessionText: row.sessionDescription ?? '',
    unitIntroMarkdown: row.unitIntroHtml ?? '',
    authorName: row.creatorName ?? '',
  }
}

export function toTextbookListParams(
  filter?: EducationTextbookListFilter,
): List9Params {
  const params: List9Params = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  if (!filter) return params

  if (filter.usage === 'active') params.enabled = true
  if (filter.usage === 'inactive') params.enabled = false

  const title = filter.title?.trim()
  if (title) params.textbookName = title

  const fieldId = filter.businessFieldId?.trim()
  if (fieldId) {
    const n = Number(fieldId)
    if (Number.isFinite(n) && n > 0) params.businessFieldId = n
  }

  const targetId = filter.educationTargetId?.trim()
  if (targetId) {
    const n = Number(targetId)
    if (Number.isFinite(n) && n > 0) params.targetId = n
  }

  if (filter.createdFrom?.trim()) params.createdFrom = filter.createdFrom.trim()
  if (filter.createdTo?.trim()) params.createdTo = filter.createdTo.trim()

  return params
}

export function toTextbookCreateRequest(
  input: EducationTextbookCreateInput,
  thumbnailAssetId?: number,
): TextbookCreateRequest {
  return {
    enabled: input.isActive,
    businessFieldId: Number(input.businessFieldId),
    targetIds: input.educationTargetIds.map(Number).filter(n => Number.isFinite(n) && n > 0),
    educationEffect: input.educationEffect.trim(),
    textbookName: input.title.trim(),
    description: input.description.trim(),
    thumbnailAssetId,
    unitCount: input.unitCount,
    sessionDescription: input.unitSessionText.trim(),
    unitIntroHtml: toApiUnitIntroHtml(input.unitIntroMarkdown),
  }
}

export function toTextbookUpdateRequest(
  input: EducationTextbookUpdateInput,
  version: number,
  thumbnailAssetId?: number,
): TextbookUpdateRequest {
  return {
    ...toTextbookCreateRequest(input, thumbnailAssetId),
    version,
  }
}

export function toEnabledToggleRequest(
  row: EducationTextbook,
  enabled: boolean,
): EnabledToggleRequest {
  return {
    enabled,
    version: row.version ?? 0,
  }
}

export function toTextbookBulkDeleteRequest(
  rows: EducationTextbook[],
): TextbookBulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version ?? 0,
    })),
  }
}
