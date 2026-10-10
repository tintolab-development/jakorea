/** CMS 목록 표(cms-data-table) empty — 기본 문구 */

export type CmsTableEmptyVariant = 'no-data' | 'no-search'

export const CMS_TABLE_EMPTY_COPY = {
  'no-data': {
    title: '등록된 데이터가 없습니다',
    description: '데이터가 등록되면 이곳에 목록이 표시됩니다.',
  },
  'no-search': {
    title: '검색 결과가 없습니다',
    description: '검색 조건 및 검색어를 확인한 후 다시 시도해 주세요.',
  },
} as const satisfies Record<CmsTableEmptyVariant, { title: string; description: string }>

/** 목록 필터·검색 적용 여부 → empty variant */
export function resolveCmsTableEmptyVariant(hasActiveFilters: boolean): CmsTableEmptyVariant {
  return hasActiveFilters ? 'no-search' : 'no-data'
}
