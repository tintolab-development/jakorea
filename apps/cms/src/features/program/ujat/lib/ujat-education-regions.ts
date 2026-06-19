/**
 * UJAT 교육 지역 — 교육 지역 관리(localStorage) 순서·라벨을 CMS 전역에서 사용
 */

import {
  readActiveUjatEducationRegionsOrdered,
  readUjatEducationRegions,
} from '@/features/program/ujat/lib/education-region-store'

export const UJAT_DEFAULT_EDUCATION_REGIONS = [
  { key: 'seoul', label: '서울' },
  { key: 'gyeonggi_south', label: '경기(남부)' },
  { key: 'incheon', label: '인천' },
  { key: 'daejeon', label: '대전' },
  { key: 'daegu', label: '대구' },
  { key: 'busan', label: '부산' },
  { key: 'gwangju', label: '광주' },
  { key: 'jeonbuk_jeonju', label: '전북(전주)' },
] as const

export type UjatDefaultEducationRegionKey =
  (typeof UJAT_DEFAULT_EDUCATION_REGIONS)[number]['key']

export type UjatEducationRegionOption = {
  key: string
  label: string
}

/** @deprecated `UJAT_DEFAULT_EDUCATION_REGIONS` 사용 */
export const UJAT_INSTITUTION_APPLICATION_REGIONS = UJAT_DEFAULT_EDUCATION_REGIONS

export type UjatInstitutionApplicationRegionKey = UjatDefaultEducationRegionKey

function mapDefaultRegions(): UjatEducationRegionOption[] {
  return UJAT_DEFAULT_EDUCATION_REGIONS.map(row => ({
    key: row.key,
    label: row.label,
  }))
}

/** 사용 중(active) 교육 지역 — 교육 지역 관리 sortOrder 순 */
export function listUjatEducationRegionsActive(): UjatEducationRegionOption[] {
  const rows = readActiveUjatEducationRegionsOrdered()
  if (rows.length === 0) return mapDefaultRegions()
  return rows.map(row => ({ key: row.regionKey, label: row.name }))
}

/** @deprecated `listUjatEducationRegionsActive` — 기관 신청·탭·셀렉트 공통 */
export function listUjatInstitutionApplicationRegions(): UjatEducationRegionOption[] {
  return listUjatEducationRegionsActive()
}

/** regionKey → 표시 라벨 (비활성·삭제된 지역은 전체 목록에서 조회) */
export function getUjatEducationRegionLabel(
  regionKey: string,
  fallback: string = regionKey
): string {
  const fromActive = listUjatEducationRegionsActive().find(row => row.key === regionKey)
  if (fromActive) return fromActive.label

  const fromAll = readUjatEducationRegions().find(row => row.regionKey === regionKey)
  if (fromAll) return fromAll.name

  const fromDefault = UJAT_DEFAULT_EDUCATION_REGIONS.find(row => row.key === regionKey)
  return fromDefault?.label ?? fallback
}

/** 희망 교육 활동 지역 셀렉트·정렬용 라벨 목록 */
export function getUjatVolunteerPreferredRegionLabels(): string[] {
  return listUjatEducationRegionsActive().map(row => row.label)
}

/** regionKey·라벨 모두 sortOrder 인덱스로 매핑 */
export function getUjatEducationRegionSortOrderMap(): Record<string, number> {
  const map: Record<string, number> = {}
  listUjatEducationRegionsActive().forEach((row, index) => {
    map[row.key] = index
    map[row.label] = index
  })
  return map
}

export function compareUjatEducationRegionByKey(a: string, b: string): number {
  const order = getUjatEducationRegionSortOrderMap()
  return (order[a] ?? 999) - (order[b] ?? 999)
}

export function compareUjatEducationRegionByLabel(a: string, b: string): number {
  const order = getUjatEducationRegionSortOrderMap()
  return (order[a] ?? 999) - (order[b] ?? 999)
}

/** 지역 별 학급·봉사단 수 폼 — 2열 페어 */
export function buildUjatRegionCapacityPairRows(): Array<{ left: string; right: string }> {
  const labels = getUjatVolunteerPreferredRegionLabels()
  const pairs: Array<{ left: string; right: string }> = []
  for (let i = 0; i < labels.length; i += 2) {
    const left = labels[i]
    const right = labels[i + 1] ?? ''
    if (left) pairs.push({ left, right })
  }
  return pairs
}

export function isUjatInstitutionApplicationRegionKey(
  value: string
): value is UjatInstitutionApplicationRegionKey {
  if (UJAT_DEFAULT_EDUCATION_REGIONS.some(row => row.key === value)) return true
  return readUjatEducationRegions().some(row => row.regionKey === value)
}

export function findUjatEducationRegionKeyByLabel(label: string): string | undefined {
  const trimmed = label.trim()
  const fromActive = listUjatEducationRegionsActive().find(row => row.label === trimmed)
  if (fromActive) return fromActive.key
  const fromDefault = UJAT_DEFAULT_EDUCATION_REGIONS.find(row => row.label === trimmed)
  return fromDefault?.key
}

/** 탭·필터 기본 선택 — 교육 지역 관리 sortOrder 1번째 active 지역 */
export function getDefaultUjatEducationRegionKey(): UjatDefaultEducationRegionKey {
  const first = listUjatEducationRegionsActive()[0]?.key
  if (first && isUjatInstitutionApplicationRegionKey(first)) return first
  return 'seoul'
}
