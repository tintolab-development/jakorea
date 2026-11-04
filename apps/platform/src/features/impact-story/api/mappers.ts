import { IMPACT_STORY_PIN_MAX } from '../lib/pin-max.ts'
import {
  categoryKeyFromName,
  IMPACT_STORY_CATEGORY_LABEL,
  IMPACT_STORY_PLACEHOLDER_COLORS,
} from '../lib/category.ts'
import { detectStoryBodyFormat, formatPublishedAtDetailLabel, formatPublishedAtLabel } from '../lib/format.ts'
import type { ImpactStoryDetail, ImpactStoryListItem } from '../model/types.ts'
import type { PublicCategoryResponse, PublicStoryDetail, PublicStoryListItem } from './types.ts'

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readPublicImageUrl(value: unknown): string | undefined {
  const url = readString(value)
  if (!url) return undefined
  if (/impact-story-placeholder/i.test(url)) return undefined
  return url
}

export type MappedCategory = {
  id: number
  name: string
}

export function mapPublicCategories(rows: readonly PublicCategoryResponse[]): MappedCategory[] {
  return rows
    .filter((row): row is PublicCategoryResponse & { id: number; name: string } => {
      return (
        typeof row.id === 'number' &&
        Number.isFinite(row.id) &&
        row.id > 0 &&
        Boolean(readString(row.name))
      )
    })
    .map(row => ({ id: row.id, name: row.name.trim() }))
}

export function mapPublicStoryListItem(row: PublicStoryListItem): ImpactStoryListItem | null {
  const id = row.id
  const title = readString(row.title)
  if (id == null || !Number.isFinite(id) || !title) return null

  const category = categoryKeyFromName(row.categoryName)
  const publishedAt = readString(row.publishAt) ?? ''

  return {
    id: String(id),
    category,
    categoryLabel: readString(row.categoryName) ?? IMPACT_STORY_CATEGORY_LABEL[category],
    title,
    summary: readString(row.summary) ?? '',
    publishedAtLabel: publishedAt ? formatPublishedAtLabel(publishedAt) : '',
    publishedAt,
    isFeatured: row.pinned === true,
    placeholderColor: IMPACT_STORY_PLACEHOLDER_COLORS[category],
    imageUrl: readPublicImageUrl(row.imageUrl),
    featuredImageUrl: readPublicImageUrl(row.imageUrl),
  }
}

export function mapPublicStoryListItems(
  rows: readonly PublicStoryListItem[] | undefined
): ImpactStoryListItem[] {
  if (!rows) return []
  return rows
    .map(mapPublicStoryListItem)
    .filter((item): item is ImpactStoryListItem => item != null)
}

export function mapPublicStoryDetail(row: PublicStoryDetail): ImpactStoryDetail | null {
  const list = mapPublicStoryListItem(row)
  if (!list) return null

  const body = typeof row.body === 'string' ? row.body : ''
  const publishedAt = list.publishedAt

  return {
    ...list,
    publishedAtDetailLabel: publishedAt ? formatPublishedAtDetailLabel(publishedAt) : '-',
    viewCount: typeof row.viewCount === 'number' && Number.isFinite(row.viewCount) ? row.viewCount : 0,
    blocks: body ? [] : [{ type: 'image', heightPx: 5000 }],
    body,
    bodyFormat: body ? detectStoryBodyFormat(body) : undefined,
    attachments: (row.attachments ?? []).flatMap((file, index) => {
      const name = readString(file.originalName)
      const fileUrl = readString(file.publicUrl)
      if (!name && !fileUrl) return []
      return [
        {
          id: file.assetId != null ? String(file.assetId) : `attachment-${index + 1}`,
          name: name ?? 'attachment',
          fileUrl,
        },
      ]
    }),
  }
}

/** 서버 배열 순서의 pinned만. 클라에서 다시 정렬하지 않는다. */
export function featuredFromPreview(
  items: readonly ImpactStoryListItem[],
  count = IMPACT_STORY_PIN_MAX
): ImpactStoryListItem[] {
  return items.filter(item => item.isFeatured).slice(0, count)
}

export function latestExcluding(
  items: readonly ImpactStoryListItem[],
  excludeId: string | null,
  count: number
): ImpactStoryListItem[] {
  return [...items]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter(item => item.id !== excludeId)
    .slice(0, count)
}
