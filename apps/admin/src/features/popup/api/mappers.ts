import type {
  Popup,
  PopupCreateInput,
  PopupListFilter,
  PopupUpdateInput,
} from '@/entities/popup/model/types'
import type { BulkDeleteRequest } from '@/shared/api/generated/main/schemas/bulkDeleteRequest'
import type { List4Params } from '@/shared/api/generated/main/schemas/list4Params'
import type { PopupCreateRequest } from '@/shared/api/generated/main/schemas/popupCreateRequest'
import type { PopupResponse } from '@/shared/api/generated/main/schemas/popupResponse'
import type { PopupUpdateRequest } from '@/shared/api/generated/main/schemas/popupUpdateRequest'
import type { ReorderRequest } from '@/shared/api/generated/main/schemas/reorderRequest'
import type { ToggleRequest } from '@/shared/api/generated/main/schemas/toggleRequest'

export function mapPopupResponseToDomain(row: PopupResponse): Popup {
  const id = row.id != null ? String(row.id) : ''
  return {
    id,
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    imageUrl: row.image?.publicUrl ?? '',
    imageFileName: row.image?.originalName,
    imageAssetId: row.image?.assetId,
    version: row.version ?? 0,
    name: row.popupName ?? '',
    altText: row.altText ?? '',
    periodStart: row.displayStartDate ?? '',
    periodEnd: row.displayEndDate ?? '',
    linkEnabled: Boolean(row.linkEnabled),
    linkUrl: row.linkUrl ?? '',
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }
}

/**
 * OpenAPI `List4Params` 서버 쿼리: `enabled` · `popupName` · `periodStart` · `periodEnd`.
 *
 * `altText`는 list GET 스펙에 없다. BE가 query를 추가하면:
 * 1. Orval 재생성 후 아래 `params.altText = …` 한 줄을 켠다
 * 2. `listRemotePopups`의 `applyClientAltTextFilter` 호출을 제거한다
 */
export function toPopupListParams(filter?: PopupListFilter): List4Params | undefined {
  if (!filter) return undefined
  const params: List4Params = {}
  if (filter.isActive === true || filter.isActive === false) {
    params.enabled = filter.isActive
  }
  if (filter.name?.trim()) params.popupName = filter.name.trim()
  if (filter.periodStart) params.periodStart = filter.periodStart
  if (filter.periodEnd) params.periodEnd = filter.periodEnd
  // BE list query `altText` 추가 시:
  // if (filter.altText?.trim()) params.altText = filter.altText.trim()
  return Object.keys(params).length > 0 ? params : undefined
}

/**
 * `List4Params.altText`가 생길 때까지 응답 후 클라이언트 보조 필터.
 * 서버 필드(`enabled`, `popupName`, 기간)는 여기서 거르지 않는다.
 */
export function applyClientAltTextFilter(rows: Popup[], filter?: PopupListFilter): Popup[] {
  const q = filter?.altText?.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(row => row.altText.toLowerCase().includes(q))
}

export function toPopupCreateRequest(
  input: PopupCreateInput,
  imageAssetId: number,
): PopupCreateRequest {
  return {
    enabled: input.isActive,
    imageAssetId,
    popupName: input.name,
    altText: input.altText,
    displayStartDate: input.periodStart,
    displayEndDate: input.periodEnd,
    linkEnabled: input.linkEnabled,
    linkUrl: input.linkEnabled ? input.linkUrl || undefined : undefined,
  }
}

export function toPopupUpdateRequest(
  current: Popup,
  patch: PopupUpdateInput,
  imageAssetId: number,
): PopupUpdateRequest {
  const next = { ...current, ...patch }
  return {
    enabled: next.isActive,
    imageAssetId,
    popupName: next.name,
    altText: next.altText,
    displayStartDate: next.periodStart,
    displayEndDate: next.periodEnd,
    linkEnabled: next.linkEnabled,
    linkUrl: next.linkEnabled ? next.linkUrl || undefined : undefined,
    version: current.version,
  }
}

export function toToggleRequest(row: Popup, enabled: boolean): ToggleRequest {
  return { enabled, version: row.version }
}

export function toBulkDeleteRequest(rows: Popup[]): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}

export function toReorderRequest(orderedRows: Popup[]): ReorderRequest {
  return {
    items: orderedRows.map((row, index) => ({
      id: Number(row.id),
      displayOrder: index + 1,
      version: row.version,
    })),
  }
}
