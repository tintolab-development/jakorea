import type { CSSProperties } from 'react'
import type { FilterFieldConfig } from './table-filter-group'

/** `addressRegion`·`selectPair` 이중 셀렉트 칸 내부 gap — `filter-field-gap`과 동일 */
export const FILTER_FIELD_PAIR_GAP_PX = 12

export function resolveFilterFieldWidthCss(field: FilterFieldConfig): string | undefined {
  if (field.width == null) return undefined
  if (typeof field.width === 'number') return `${field.width}px`
  const trimmed = field.width.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function resolveFilterFieldPairSegmentWidthCss(field: FilterFieldConfig): string | undefined {
  if (field.type !== 'addressRegion' && field.type !== 'selectPair') return undefined
  if (typeof field.width !== 'number') return undefined
  const segment = Math.max(0, (field.width - FILTER_FIELD_PAIR_GAP_PX) / 2)
  return `${segment}px`
}

export function buildFilterFieldWidthStyle(field: FilterFieldConfig): CSSProperties | undefined {
  const width = resolveFilterFieldWidthCss(field)
  if (width == null) return undefined

  const style: CSSProperties &
    Partial<Record<'--filter-field-width' | '--filter-field-pair-segment-width', string>> = {
    '--filter-field-width': width,
  }

  const segment = resolveFilterFieldPairSegmentWidthCss(field)
  if (segment != null) {
    style['--filter-field-pair-segment-width'] = segment
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
  if (field.width != null) {
    parts.push('table-filter-group__grid-cell--explicit-width')
    if (isFilterFieldPctWidth(field)) {
      parts.push('table-filter-group__grid-cell--pct-width')
    }
  }
  if (isFilterFieldPairType(field)) {
    parts.push('table-filter-group__grid-cell--pair-field')
  }
  return parts.join(' ')
}
