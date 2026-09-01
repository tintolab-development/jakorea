/**
 * CMS 필터 영역 열 폭 상수
 * @see apps/cms/src/shared/components/table-filter-group-field-width.ts
 * @see apps/cms/.cursor/rules/design/filter-area-layout.mdc
 */

/** 단일 검색·셀렉트 필터 열 폭 (px) */
export const FILTER_CONTROL_MAX_WIDTH_PX = 240

/** dateRange·selectPair 열: 2×240 + 구분 gap 20px */
export const FILTER_CONTROL_WIDE_FIELD_WIDTH_PX = FILTER_CONTROL_MAX_WIDTH_PX * 2 + 20

/** 조회 버튼 폭 (px) — 높이 44는 CmsButton large */
export const FILTER_SEARCH_BUTTON_WIDTH_PX = 160
