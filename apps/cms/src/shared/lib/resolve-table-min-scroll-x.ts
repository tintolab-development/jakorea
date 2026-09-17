import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { ColumnsType, ColumnType } from 'antd/es/table'

const DEFAULT_SELECTION_COLUMN_WIDTH = 68
const FLEX_COLUMN_FALLBACK_WIDTH = 120

function columnWidthPx(column: ColumnType<unknown>): number {
  const width = column.width
  if (typeof width === 'number' && Number.isFinite(width)) return width
  if (typeof width === 'string') {
    const px = Number.parseFloat(width)
    if (Number.isFinite(px)) return px
  }
  const minWidth = (column as { minWidth?: number }).minWidth
  if (typeof minWidth === 'number' && Number.isFinite(minWidth)) return minWidth
  return FLEX_COLUMN_FALLBACK_WIDTH
}

/**
 * Ant Table `scroll.x` 최소값 — (선택 열) + 본문 열 폭 합.
 * 래퍼가 이보다 크면 scroll.x를 생략해 불필요 가로스크롤을 막는다.
 */
export function resolveTableMinScrollX(
  columns: ColumnsType<unknown> | undefined,
  options?: { includeSelection?: boolean; selectionWidth?: number }
): number {
  const includeSelection = options?.includeSelection !== false
  const selectionWidth = options?.selectionWidth ?? DEFAULT_SELECTION_COLUMN_WIDTH
  let sum = includeSelection ? selectionWidth : 0
  for (const column of columns ?? []) {
    if (!column || typeof column !== 'object') continue
    if ('children' in column && Array.isArray(column.children)) {
      for (const child of column.children) {
        sum += columnWidthPx(child as ColumnType<unknown>)
      }
      continue
    }
    sum += columnWidthPx(column as ColumnType<unknown>)
  }
  return Math.max(sum, includeSelection ? selectionWidth + 80 : 80)
}

/** @deprecated {@link resolveTableMinScrollX} */
export function resolveApplicantListTableMinScrollX(
  columns: ColumnsType<unknown> | undefined,
  options?: { includeSelection?: boolean; selectionWidth?: number }
): number {
  return resolveTableMinScrollX(columns, options)
}

/**
 * 래퍼 너비와 열 합을 비교해 `scroll.x`를 맞춘다.
 * - 열 합 ≤ 래퍼: `undefined` (scroll.x 미지정 → Ant 가로스크롤 비활성)
 * - 열 합 > 래퍼: 열 합(필요 시만 가로스크롤)
 */
export function useContainerFitTableScrollX(
  columns: ColumnsType<unknown> | undefined,
  options?: {
    enabled?: boolean
    includeSelection?: boolean
    selectionWidth?: number
    initialScrollX?: number
  }
): {
  tableWrapRef: RefObject<HTMLDivElement | null>
  /** 열이 래퍼보다 넓을 때만 숫자. 그 외 `undefined` — `scroll={x != null ? { x } : undefined}` */
  tableScrollX: number | undefined
} {
  const enabled = options?.enabled !== false
  const includeSelection = options?.includeSelection
  const selectionWidth = options?.selectionWidth
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState<number | undefined>(
    options?.initialScrollX
  )

  useLayoutEffect(() => {
    if (!enabled) {
      setTableScrollX(undefined)
      return
    }
    const el = tableWrapRef.current
    if (!el) return
    const minW = resolveTableMinScrollX(columns, { includeSelection, selectionWidth })
    const update = () => {
      const w = Math.floor(el.getBoundingClientRect().width)
      if (w <= 0) return
      // 열 합이 래퍼 이하면 scroll.x를 끄지 않으면 Ant가 항상 가로 스크롤 포트를 만든다
      setTableScrollX(minW > w ? minW : undefined)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [columns, enabled, includeSelection, selectionWidth])

  return { tableWrapRef, tableScrollX }
}
