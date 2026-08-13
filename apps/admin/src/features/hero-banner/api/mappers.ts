import type {
  HeroBanner,
  HeroBannerCreateInput,
  HeroBannerUpdateInput,
} from '@/entities/hero-banner/model/types'
import type { BulkDeleteRequest } from '@/shared/api/generated/main/schemas/bulkDeleteRequest'
import type { HeroCreateRequest } from '@/shared/api/generated/main/schemas/heroCreateRequest'
import type { HeroResponse } from '@/shared/api/generated/main/schemas/heroResponse'
import type { HeroUpdateRequest } from '@/shared/api/generated/main/schemas/heroUpdateRequest'
import type { ReorderRequest } from '@/shared/api/generated/main/schemas/reorderRequest'
import type { ToggleRequest } from '@/shared/api/generated/main/schemas/toggleRequest'

export function mapHeroResponseToDomain(row: HeroResponse): HeroBanner {
  const id = row.id != null ? String(row.id) : ''
  return {
    id,
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    imageUrl: row.image?.publicUrl ?? '',
    imageFileName: row.image?.originalName,
    imageAssetId: row.image?.assetId,
    version: row.version ?? 0,
    topText: row.topText ?? '',
    mainTitle: row.mainTitle ?? '',
    bottomText: row.bottomText ?? '',
    linkUrl: row.linkUrl ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }
}

export function toHeroCreateRequest(
  input: HeroBannerCreateInput,
  imageAssetId: number,
): HeroCreateRequest {
  return {
    enabled: input.isActive,
    imageAssetId,
    topText: input.topText.trim() || undefined,
    mainTitle: input.mainTitle.trim() || undefined,
    bottomText: input.bottomText.trim() || undefined,
    linkUrl: input.linkUrl.trim() || undefined,
  }
}

export function toHeroUpdateRequest(
  current: HeroBanner,
  patch: HeroBannerUpdateInput,
  imageAssetId: number,
): HeroUpdateRequest {
  const next = { ...current, ...patch }
  return {
    enabled: next.isActive,
    imageAssetId,
    topText: next.topText.trim() || undefined,
    mainTitle: next.mainTitle.trim() || undefined,
    bottomText: next.bottomText.trim() || undefined,
    linkUrl: next.linkUrl.trim() || undefined,
    version: current.version,
  }
}

export function toToggleRequest(row: HeroBanner, enabled: boolean): ToggleRequest {
  return { enabled, version: row.version }
}

export function toBulkDeleteRequest(rows: HeroBanner[]): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}

export function toReorderRequest(orderedRows: HeroBanner[]): ReorderRequest {
  return {
    items: orderedRows.map((row, index) => ({
      id: Number(row.id),
      displayOrder: index + 1,
      version: row.version,
    })),
  }
}
