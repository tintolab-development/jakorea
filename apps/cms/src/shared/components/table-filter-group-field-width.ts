import type { CSSProperties } from 'react'
import type { FilterFieldConfig } from './table-filter-group'

/** `selectPair` 이중 셀렉트 칸 내부 gap — `filter-field-gap`과 동일 */
export const FILTER_FIELD_PAIR_GAP_PX = 12

/** `addressRegion`(시/도·시/군/구) 하위 셀렉트 사이 gap */
export const FILTER_ADDRESS_REGION_PAIR_GAP_PX = 6

/** `addressRegion` 하위 셀렉트 각 폭 */
export const FILTER_ADDRESS_REGION_SEGMENT_WIDTH_PX = 114.75

/** `addressRegion` 열 전체: 2×114.75 + 6 = 235.5 */
export const FILTER_ADDRESS_REGION_FIELD_WIDTH_PX =
  FILTER_ADDRESS_REGION_SEGMENT_WIDTH_PX * 2 + FILTER_ADDRESS_REGION_PAIR_GAP_PX

/** 단일 검색·셀렉트 최소 폭 — `--filter-control-min-width` · `--table-filter-field-min-width` */
export const FILTER_CONTROL_MIN_WIDTH_PX = 240

/**
 * 단일 검색·셀렉트 기본 폭 — `filter-controls-common.css`
 * `--filter-control-width`·`--filter-control-max-width` 와 동일(260px)
 */
export const FILTER_CONTROL_MAX_WIDTH_PX = 260

/** 분리형 `dateRange`·`selectPair` 열: 2×260 + 구분 gap(20px) = 540 */
export const FILTER_CONTROL_WIDE_FIELD_WIDTH_PX =
  FILTER_CONTROL_MAX_WIDTH_PX * 2 + 20

export function isCompactSelectPairField(field: FilterFieldConfig): boolean {
  return field.type === 'selectPair' && field.selectPair?.compact === true
}

/** 시/도·시/군/구와 같은 콤팩트 50:50 이중 셀렉트 열 */
export function isAddressRegionLayoutField(field: FilterFieldConfig): boolean {
  return field.type === 'addressRegion' || isCompactSelectPairField(field)
}

export function resolveFilterFieldPairGapPx(field: FilterFieldConfig): number {
  if (isAddressRegionLayoutField(field)) return FILTER_ADDRESS_REGION_PAIR_GAP_PX
  if (field.type === 'selectPair') return FILTER_FIELD_PAIR_GAP_PX
  return FILTER_FIELD_PAIR_GAP_PX
}

export function resolveFilterFieldWidthCss(field: FilterFieldConfig): string | undefined {
  if (field.width == null) return undefined
  if (typeof field.width === 'number') return `${field.width}px`
  const trimmed = field.width.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function resolveFilterFieldPairSegmentWidthCss(field: FilterFieldConfig): string | undefined {
  if (isAddressRegionLayoutField(field)) {
    if (typeof field.width === 'number') {
      const gap = FILTER_ADDRESS_REGION_PAIR_GAP_PX
      return `${Math.max(0, (field.width - gap) / 2)}px`
    }
    return `${FILTER_ADDRESS_REGION_SEGMENT_WIDTH_PX}px`
  }
  if (field.type !== 'selectPair') return undefined
  if (typeof field.width !== 'number') return undefined
  const segment = Math.max(0, (field.width - FILTER_FIELD_PAIR_GAP_PX) / 2)
  return `${segment}px`
}

export function buildFilterFieldWidthStyle(field: FilterFieldConfig): CSSProperties | undefined {
  // 라디오는 콘텐츠 허그 — --filter-field-width로 Col/grid-cell을 키우지 않음
  if (field.type === 'radio') return undefined

  const width = resolveFilterFieldWidthCss(field)
  if (width == null) return undefined

  const style: CSSProperties &
    Partial<
      Record<
        '--filter-field-width' | '--filter-field-pair-segment-width' | '--filter-field-pair-gap',
        string
      >
    > = {
    '--filter-field-width': width,
  }

  const segment = resolveFilterFieldPairSegmentWidthCss(field)
  if (segment != null) {
    style['--filter-field-pair-segment-width'] = segment
    style['--filter-field-pair-gap'] = `${resolveFilterFieldPairGapPx(field)}px`
  }

  return style
}

export function isFilterFieldPairType(field: FilterFieldConfig): boolean {
  return field.type === 'addressRegion' || field.type === 'selectPair'
}

/** `FilterFieldConfig.width`가 행 대비 비율(`'25%'` 등)인지 */
export function isFilterFieldPctWidth(field: FilterFieldConfig): boolean {
  return typeof field.width === 'string' && field.width.trim().endsWith('%')
}

export function filterFieldGridCellClassName(field: FilterFieldConfig): string {
  const parts = ['table-filter-group__grid-cell']
  if (field.type === 'radio') {
    parts.push('table-filter-group__grid-cell--radio')
    return parts.join(' ')
  }
  if (field.width != null) {
    parts.push('table-filter-group__grid-cell--explicit-width')
    if (isFilterFieldPctWidth(field)) {
      parts.push('table-filter-group__grid-cell--pct-width')
    }
  }
  if (isFilterFieldPairType(field)) {
    parts.push('table-filter-group__grid-cell--pair-field')
  }
  if (field.type === 'dateRange') {
    parts.push('table-filter-group__grid-cell--date-range')
  }
  if (isAddressRegionLayoutField(field)) {
    parts.push('table-filter-group__grid-cell--address-region-field')
    parts.push('table-filter-group__grid-cell--address-region')
  }
  return parts.join(' ')
}
