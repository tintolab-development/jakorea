/**
 * GET /api/admin/program-execution/programs/{id}/ujat/region-capacities
 * OpenAPI 스키마에 없는 필드는 Record fallback으로 읽는다.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

export type UjatRegionCapacityDto = {
  id?: number | string
  regionKey?: string
  regionCode?: string
  regionName?: string
  regionLabel?: string
  semester?: string
  half?: 'H1' | 'H2' | 'h1' | 'h2'
  maxClass?: number
  maxClassCount?: number
  maxVolunteer?: number
  maxVolunteerCount?: number
  assignedClassCount?: number
  assignedVolunteerCount?: number
  [key: string]: unknown
}

export type UjatRegionCapacitiesResponse = {
  items?: UjatRegionCapacityDto[]
  content?: UjatRegionCapacityDto[]
  capacities?: UjatRegionCapacityDto[]
}

function asList(payload: UjatRegionCapacitiesResponse | UjatRegionCapacityDto[]): UjatRegionCapacityDto[] {
  if (Array.isArray(payload)) return payload
  return payload.items ?? payload.content ?? payload.capacities ?? []
}

export async function fetchUjatRegionCapacitiesRemote(
  programId: string
): Promise<UjatRegionCapacityDto[]> {
  const body = await unwrapApiBody<UjatRegionCapacitiesResponse | UjatRegionCapacityDto[]>(
    await customInstance({
      url: `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/ujat/region-capacities`,
      method: 'GET',
    })
  )
  return asList(body)
}

export function resolveUjatRegionCapacityMaxClass(row: UjatRegionCapacityDto): number {
  const value = row.maxClass ?? row.maxClassCount
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/** 전북 maxClass=2 등 — 0도 유효값(null/"-"로 위장 금지) */
export function buildUjatRegionCapacityMaxClassMap(
  rows: UjatRegionCapacityDto[]
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const row of rows) {
    const key = String(row.regionKey ?? row.regionCode ?? row.regionName ?? row.regionLabel ?? '')
    if (!key) continue
    map[key] = resolveUjatRegionCapacityMaxClass(row)
  }
  return map
}
