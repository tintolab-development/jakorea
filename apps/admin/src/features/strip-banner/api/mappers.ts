import type {
  StripBanner,
  StripBannerCreateInput,
  StripBannerListFilter,
  StripBannerUpdateInput,
} from '@/entities/strip-banner/model/types'
import type { BulkDeleteRequest } from '@/shared/api/generated/main/schemas/bulkDeleteRequest'
import type { List3Params } from '@/shared/api/generated/main/schemas/list3Params'
import type { ReorderRequest } from '@/shared/api/generated/main/schemas/reorderRequest'
import type { StripCreateRequest } from '@/shared/api/generated/main/schemas/stripCreateRequest'
import type { StripResponse } from '@/shared/api/generated/main/schemas/stripResponse'
import type { StripUpdateRequest } from '@/shared/api/generated/main/schemas/stripUpdateRequest'
import type { ToggleRequest } from '@/shared/api/generated/main/schemas/toggleRequest'

export function mapStripResponseToDomain(row: StripResponse): StripBanner {
  const id = row.id != null ? String(row.id) : ''
  return {
    id,
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    version: row.version ?? 0,
    text: row.bannerText ?? '',
    periodStart: row.displayStartDate ?? '',
    periodEnd: row.displayEndDate ?? '',
    linkEnabled: Boolean(row.linkEnabled),
    linkUrl: row.linkUrl ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }
}

export function toStripListParams(filter?: StripBannerListFilter): List3Params | undefined {
  if (!filter) return undefined
  const params: List3Params = {}
  if (filter.isActive === true || filter.isActive === false) {
    params.enabled = filter.isActive
  }
  if (filter.text?.trim()) params.text = filter.text.trim()
  if (filter.periodStart) params.periodStart = filter.periodStart
  if (filter.periodEnd) params.periodEnd = filter.periodEnd
  return Object.keys(params).length > 0 ? params : undefined
}

export function toStripCreateRequest(input: StripBannerCreateInput): StripCreateRequest {
  return {
    enabled: input.isActive,
    bannerText: input.text,
    displayStartDate: input.periodStart,
    displayEndDate: input.periodEnd,
    linkEnabled: input.linkEnabled,
    linkUrl: input.linkEnabled ? input.linkUrl || undefined : undefined,
  }
}

export function toStripUpdateRequest(
  current: StripBanner,
  patch: StripBannerUpdateInput,
): StripUpdateRequest {
  const next = { ...current, ...patch }
  return {
    enabled: next.isActive,
    bannerText: next.text,
    displayStartDate: next.periodStart,
    displayEndDate: next.periodEnd,
    linkEnabled: next.linkEnabled,
    linkUrl: next.linkEnabled ? next.linkUrl || undefined : undefined,
    version: current.version,
  }
}

export function toToggleRequest(row: StripBanner, enabled: boolean): ToggleRequest {
  return { enabled, version: row.version }
}

export function toBulkDeleteRequest(rows: StripBanner[]): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}

export function toReorderRequest(orderedRows: StripBanner[]): ReorderRequest {
  return {
    items: orderedRows.map((row, index) => ({
      id: Number(row.id),
      displayOrder: index + 1,
      version: row.version,
    })),
  }
}
