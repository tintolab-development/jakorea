/**
 * CMS 필터 영역 열 폭 상수
 * @see apps/cms/src/shared/components/table-filter-group-field-width.ts
 * @see apps/cms/.cursor/rules/design/filter-area-layout.mdc
 */

/** 단일 검색·셀렉트 필터 열 폭 (px) */
export const FILTER_CONTROL_MAX_WIDTH_PX = 240

/** dateRange·selectPair 열: 2×240 + 구분 gap 20px */
export const FILTER_CONTROL_WIDE_FIELD_WIDTH_PX = FILTER_CONTROL_MAX_WIDTH_PX * 2 + 20

/** addressRegion(시/도·시/군/구, 연혁년도/월) 하위 셀렉트 사이 gap */
export const FILTER_ADDRESS_REGION_PAIR_GAP_PX = 6

/** addressRegion 하위 셀렉트 각 폭 */
export const FILTER_ADDRESS_REGION_SEGMENT_WIDTH_PX = 114.75

/** addressRegion 열 전체: 2×114.75 + 6 = 235.5 */
export const FILTER_ADDRESS_REGION_FIELD_WIDTH_PX =
  FILTER_ADDRESS_REGION_SEGMENT_WIDTH_PX * 2 + FILTER_ADDRESS_REGION_PAIR_GAP_PX
