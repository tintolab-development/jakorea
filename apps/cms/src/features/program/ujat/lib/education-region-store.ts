/**
 * UJAT 교육 지역 — localStorage mock (API 연동 전)
 * 프로그램 상세·신청 폼의 지역 목록 순서·노출에 사용한다.
 */

import type {
  UjatEducationRegion,
  UjatEducationRegionCreateInput,
  UjatEducationRegionUpdateInput,
} from '@/features/program/ujat/model/education-region.types'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'

const STORAGE_KEY = 'cms.jakorea.ujatEducationRegions.v1'

export const UJAT_EDUCATION_REGIONS_CHANGED_EVENT = 'jakorea:ujat-education-regions-changed' as const

type RegionFile = {
  version: 1
  items: UjatEducationRegion[]
}

const SEED_REGIONS: readonly {
  regionKey: UjatInstitutionApplicationRegionKey
  name: string
  hasUsageHistory?: boolean
}[] = [
  { regionKey: 'seoul', name: '서울', hasUsageHistory: true },
  { regionKey: 'gyeonggi_south', name: '경기(남부)' },
  { regionKey: 'incheon', name: '인천' },
  { regionKey: 'daejeon', name: '대전' },
  { regionKey: 'daegu', name: '대구' },
  { regionKey: 'busan', name: '부산' },
  { regionKey: 'gwangju', name: '광주' },
  { regionKey: 'jeonbuk_jeonju', name: '전북(전주)' },
]

function buildSeedRegions(): UjatEducationRegion[] {
  const base = new Date('2026-03-30T01:10:32.000Z')
  return SEED_REGIONS.map((row, index) => ({
    id: `ujat-region-${row.regionKey}`,
    regionKey: row.regionKey,
    sortOrder: index + 1,
    active: true,
    name: row.name,
    createdByName: '홍길동',
    createdAt: new Date(base.getTime() + index * 60_000).toISOString(),
    hasUsageHistory: row.hasUsageHistory ?? false,
  }))
}

function readFile(): RegionFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedRegions() }
    }
    const parsed = JSON.parse(raw) as RegionFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedRegions() }
    }
    return parsed
  } catch {
    return { version: 1, items: buildSeedRegions() }
  }
}

function writeFile(file: RegionFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(UJAT_EDUCATION_REGIONS_CHANGED_EVENT))
}

function assignSortOrders(items: UjatEducationRegion[]): UjatEducationRegion[] {
  return items.map((row, index) => ({ ...row, sortOrder: index + 1 }))
}

function normalizeSortOrders(items: UjatEducationRegion[]): UjatEducationRegion[] {
  return assignSortOrders([...items].sort((a, b) => a.sortOrder - b.sortOrder))
}

export function readUjatEducationRegions(): UjatEducationRegion[] {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return normalizeSortOrders(file.items)
}

export function readActiveUjatEducationRegionsOrdered(): UjatEducationRegion[] {
  return readUjatEducationRegions().filter(row => row.active)
}

export function createUjatEducationRegion(input: UjatEducationRegionCreateInput): UjatEducationRegion {
  const file = readFile()
  const trimmed = input.name.trim()
  const now = new Date().toISOString()
  const regionKey = `custom_${Date.now()}`
  const next: UjatEducationRegion = {
    id: `ujat-region-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
    regionKey,
    sortOrder: file.items.length + 1,
    active: input.active,
    name: trimmed,
    createdByName: input.createdByName?.trim() || '홍길동',
    createdAt: now,
    hasUsageHistory: false,
  }
  writeFile({ version: 1, items: [...file.items, next] })
  return next
}

export function updateUjatEducationRegion(
  id: string,
  patch: UjatEducationRegionUpdateInput
): UjatEducationRegion | undefined {
  const file = readFile()
  const index = file.items.findIndex(row => row.id === id)
  if (index < 0) return undefined
  const current = file.items[index]
  const nextRow: UjatEducationRegion = {
    ...current,
    ...(patch.active !== undefined ? { active: patch.active } : null),
    ...(patch.name !== undefined ? { name: patch.name.trim() } : null),
    ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : null),
  }
  const nextItems = [...file.items]
  nextItems[index] = nextRow
  writeFile({ version: 1, items: normalizeSortOrders(nextItems) })
  return nextRow
}

export function reorderUjatEducationRegions(orderedIds: readonly string[]): UjatEducationRegion[] {
  const file = readFile()
  const byId = new Map(file.items.map(row => [row.id, row]))
  const reordered: UjatEducationRegion[] = []
  orderedIds.forEach(id => {
    const row = byId.get(id)
    if (row) reordered.push(row)
  })
  file.items.forEach(row => {
    if (!orderedIds.includes(row.id)) reordered.push(row)
  })
  const normalized = assignSortOrders(reordered)
  writeFile({ version: 1, items: normalized })
  return normalized
}

export function deleteUjatEducationRegion(id: string): { ok: true } | { ok: false; reason: 'not_found' | 'has_usage' } {
  const file = readFile()
  const target = file.items.find(row => row.id === id)
  if (!target) return { ok: false, reason: 'not_found' }
  if (target.hasUsageHistory) return { ok: false, reason: 'has_usage' }
  const next = file.items.filter(row => row.id !== id)
  writeFile({ version: 1, items: normalizeSortOrders(next) })
  return { ok: true }
}
