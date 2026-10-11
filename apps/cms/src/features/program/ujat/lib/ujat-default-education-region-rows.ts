/** UJAT 기본 8개 교육 지역 — import 순환 없이 공유 */
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
