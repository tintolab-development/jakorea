import type { UjatEducationRegion } from '@/features/program/ujat/model/education-region.types'
import type { UjatEducationRegionResponse } from '@/shared/api/generated/forms-surveys/schemas/ujatEducationRegionResponse'
import type { UjatEducationRegionUpdateRequest } from '@/shared/api/generated/forms-surveys/schemas/ujatEducationRegionUpdateRequest'
import type { UjatEducationRegionReorderRequest } from '@/shared/api/generated/forms-surveys/schemas/ujatEducationRegionReorderRequest'

export function mapEducationRegionResponse(
  dto: UjatEducationRegionResponse
): UjatEducationRegion {
  const id = dto.id != null ? String(dto.id) : ''
  const regionKey = dto.code?.trim() || (id ? `region_${id}` : `region_${Date.now()}`)
  const name =
    dto.nameKo?.trim() || dto.displayName?.trim() || regionKey
  return {
    id,
    regionKey,
    sortOrder: dto.displayOrder ?? 0,
    active: dto.activeYn !== false,
    name,
    createdByName: '',
    createdAt: dto.createdAt ?? new Date().toISOString(),
    hasUsageHistory: false,
  }
}

export function mapEducationRegionUpdateRequest(patch: {
  name?: string
  active?: boolean
  sortOrder?: number
}): UjatEducationRegionUpdateRequest {
  return {
    nameKo: patch.name?.trim(),
    displayName: patch.name?.trim(),
    activeYn: patch.active,
    displayOrder: patch.sortOrder,
  }
}

export function mapEducationRegionReorderRequest(
  items: UjatEducationRegion[]
): UjatEducationRegionReorderRequest {
  return {
    items: items.map((row, index) => {
      const numericId = Number(row.id)
      return {
        id: Number.isFinite(numericId) ? numericId : undefined,
        code: row.regionKey,
        displayOrder: index + 1,
      }
    }),
  }
}

export function normalizeEducationRegionSort(
  items: UjatEducationRegion[]
): UjatEducationRegion[] {
  return [...items]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ko'))
    .map((row, index) => ({ ...row, sortOrder: index + 1 }))
}
