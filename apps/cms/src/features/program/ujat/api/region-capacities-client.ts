/**
 * GET/PUT /api/admin/program-execution/programs/{id}/ujat/region-capacities
 * OpenAPI 스키마에 없는 필드는 Record fallback으로 읽는다.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import {
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
  type UjatRegionCapacityBySemesterState,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import customInstance from '@/shared/api/orval-mutator'

export type UjatRegionCapacityDto = {
  id?: number | string
  regionKey?: string
  regionCode?: string
  regionName?: string
  regionLabel?: string
  semester?: string
  semesterType?: string
  educationRegionCode?: string
  educationRegionName?: string
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

export type UjatRegionCapacityUpsert = {
  semesterType: 'FIRST_HALF' | 'SECOND_HALF'
  educationRegionCode: string
  maxClassCount: number
  maxVolunteerCount: number
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

export async function replaceUjatRegionCapacitiesRemote(
  programId: string,
  capacities: UjatRegionCapacityUpsert[]
): Promise<UjatRegionCapacityDto[]> {
  const body = await unwrapApiBody<UjatRegionCapacitiesResponse | UjatRegionCapacityDto[]>(
    await customInstance({
      url: `/api/admin/program-execution/programs/${encodeURIComponent(programId)}/ujat/region-capacities`,
      method: 'PUT',
      data: { capacities },
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

/** 지역 정원 조회 응답을 RHF/프로그램 화면 상태로 변환한다. */
export function regionCapacityStateFromRows(
  rows: UjatRegionCapacityDto[]
): UjatRegionCapacityBySemesterState {
  const result: UjatRegionCapacityBySemesterState = { h1: {}, h2: {} }
  const regions = listUjatEducationRegionsActive()

  for (const row of rows) {
    const semester = String(row.semesterType ?? row.semester ?? '').toUpperCase()
    const half = semester === 'FIRST_HALF' ? 'h1' : semester === 'SECOND_HALF' ? 'h2' : null
    if (!half) continue

    const code = String(
      row.educationRegionCode ?? row.regionKey ?? row.regionCode ?? ''
    ).trim()
    const region = regions.find(item => item.key.toLowerCase() === code.toLowerCase())
    const label = region?.label ?? row.educationRegionName ?? row.regionName ?? row.regionLabel ?? code
    if (!label) continue

    const classCount = row.maxClassCount ?? row.maxClass
    const volunteerCount = row.maxVolunteerCount ?? row.maxVolunteer
    result[half][label] = {
      classCount: typeof classCount === 'number' ? String(classCount) : '',
      volunteerCount: typeof volunteerCount === 'number' ? String(volunteerCount) : '',
    }
  }

  return result
}

/** @deprecated Overlay 주입 경로. 화면 상태는 `regionCapacityStateFromRows`를 쓴다. */
export function buildUjatRegionCapacityOverlay(
  rows: UjatRegionCapacityDto[]
): Record<string, unknown> {
  return { [UJAT_REGION_CAPACITY_OVERLAY_KEY]: regionCapacityStateFromRows(rows) }
}
