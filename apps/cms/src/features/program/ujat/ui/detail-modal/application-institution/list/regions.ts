/** UJAT 기관 신청 목록 — 지역 탭 */

import { readActiveUjatEducationRegionsOrdered } from '@/features/program/ujat/lib/education-region-store'

export const UJAT_INSTITUTION_APPLICATION_REGIONS = [
  { key: 'seoul', label: '서울' },
  { key: 'gyeonggi_south', label: '경기(남부)' },
  { key: 'incheon', label: '인천' },
  { key: 'daejeon', label: '대전' },
  { key: 'daegu', label: '대구' },
  { key: 'busan', label: '부산' },
  { key: 'gwangju', label: '광주' },
  { key: 'jeonbuk_jeonju', label: '전북(전주)' },
] as const

export type UjatInstitutionApplicationRegionKey =
  (typeof UJAT_INSTITUTION_APPLICATION_REGIONS)[number]['key']

/** 교육 지역 관리에서 설정한 순서·라벨(사용 중만). API 연동 전 localStorage. */
export function listUjatInstitutionApplicationRegions(): Array<{
  key: string
  label: string
}> {
  const rows = readActiveUjatEducationRegionsOrdered()
  if (rows.length === 0) {
    return UJAT_INSTITUTION_APPLICATION_REGIONS.map(row => ({
      key: row.key,
      label: row.label,
    }))
  }
  return rows.map(row => ({ key: row.regionKey, label: row.name }))
}

export function isUjatInstitutionApplicationRegionKey(
  value: string
): value is UjatInstitutionApplicationRegionKey {
  return UJAT_INSTITUTION_APPLICATION_REGIONS.some(r => r.key === value)
}
