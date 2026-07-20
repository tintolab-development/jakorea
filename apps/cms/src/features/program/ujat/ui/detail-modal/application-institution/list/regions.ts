/** UJAT 기관 신청 목록 — 지역 탭 (교육 지역 관리 순서·라벨 연동) */

export {
  UJAT_DEFAULT_EDUCATION_REGIONS,
  UJAT_INSTITUTION_APPLICATION_REGIONS,
  listUjatEducationRegionsActive,
  listUjatInstitutionApplicationRegions,
  getUjatEducationRegionLabel,
  getUjatVolunteerPreferredRegionLabels,
  getUjatEducationRegionSortOrderMap,
  compareUjatEducationRegionByKey,
  compareUjatEducationRegionByLabel,
  buildUjatRegionCapacityPairRows,
  findUjatEducationRegionKeyByLabel,
  isUjatInstitutionApplicationRegionKey,
  type UjatDefaultEducationRegionKey,
  type UjatEducationRegionOption,
  type UjatInstitutionApplicationRegionKey,
} from '@/features/program/ujat/lib/ujat-education-regions'
