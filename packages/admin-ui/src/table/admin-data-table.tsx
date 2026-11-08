import { Table } from 'antd'
import type { TableProps } from 'antd/es/table'
import type { TableRef } from 'antd/es/table'
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { mergeAdminDataTableClassName } from './table-class.js'
import {
  ADMIN_DATA_TABLE_MIN_WIDTH_FLOOR,
  ADMIN_DATA_TABLE_SELECTION_COLUMN_WIDTH,
  distributeAdminDataTableSurplusWidth,
  resolveAdminDataTableColumnsWidth,
} from './table-min-width.js'
import './admin-data-table.css'

export type AdminDataTableProps<RecordType extends object = object> = TableProps<RecordType> & {
  emptyText?: ReactNode
  /**
   * 좁은 화면 최소 폭 하한(px). 기본 1080 — 모달·드로어 안에서는 자동으로 0(열 합만).
   * `0`이면 하한 없이 열 합만 사용한다.
   */
  minTableWidthFloor?: number
}

export { mergeAdminDataTableClassName } from './table-class.js'

const OVERFLOW_CLASS = 'cms-data-table--overflow'
const MIN_WIDTH_VAR = '--admin-data-table-min-width'

/**
 * 좁은 화면 공통 규칙 (CMS·Admin `cms-data-table`)
 * - 래퍼 ≥ 최소 폭: 기존과 동일 (변경 없음)
 * - 래퍼 < 최소 폭: 테이블은 최소 폭 = max(열 합, 1080)에서 멈추고 가로 스크롤, 열은 코드 지정 폭 유지
 * - `--fluid`·`scroll.x`가 숫자가 아닌 화면(max-content 등)은 화면 자체 처리 유지
 */
export function AdminDataTable<RecordType extends object = object>({
  className,
  locale,
  emptyText,
  minTableWidthFloor = ADMIN_DATA_TABLE_MIN_WIDTH_FLOOR,
  scroll,
  style,
  ...rest
}: AdminDataTableProps<RecordType>) {
  const mergedLocale = emptyText !== undefined ? { ...locale, emptyText } : locale

  const tableRef = useRef<TableRef>(null)
  const mergedClassName = mergeAdminDataTableClassName(className)
  const isFluid = mergedClassName.split(/\s+/).includes('cms-data-table--fluid')
  const explicitScrollX = typeof scroll?.x === 'number' ? scroll.x : undefined
  const managed = !isFluid && (scroll?.x === undefined || explicitScrollX !== undefined)

  const { columns, rowSelection } = rest
  const selectionWidth = rowSelection
    ? typeof rowSelection.columnWidth === 'number'
      ? Math.max(rowSelection.columnWidth, ADMIN_DATA_TABLE_SELECTION_COLUMN_WIDTH)
      : ADMIN_DATA_TABLE_SELECTION_COLUMN_WIDTH
    : null
  const columnsWidth = useMemo(
    () =>
      resolveAdminDataTableColumnsWidth(
        columns as Parameters<typeof resolveAdminDataTableColumnsWidth>[0],
        selectionWidth
      ),
    [columns, selectionWidth]
  )

  const [overflowMinWidth, setOverflowMinWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = tableRef.current?.nativeElement
    if (!managed || !el) {
      setOverflowMinWidth(null)
      return
    }
    const inOverlay = el.closest('.ant-modal, .ant-drawer') != null
    const floor = inOverlay ? 0 : Math.max(0, minTableWidthFloor)
    const minWidth = Math.max(columnsWidth, explicitScrollX ?? 0, floor)
    const update = () => {
      const width = Math.floor(el.clientWidth)
      if (width <= 0) return
      setOverflowMinWidth(width < minWidth ? minWidth : null)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [managed, columnsWidth, explicitScrollX, minTableWidthFloor])

  const overflow = overflowMinWidth != null
  /** 좁은 화면: 열은 코드 폭 그대로, 최소 폭 여유분(하한·scroll.x)은 유연 열/본문 열에 배분 */
  const mergedColumns = useMemo(
    () =>
      overflow && columns
        ? distributeAdminDataTableSurplusWidth(columns, overflowMinWidth - columnsWidth)
        : columns,
    [overflow, columns, overflowMinWidth, columnsWidth]
  )
  const mergedScroll = overflow ? { ...scroll, x: overflowMinWidth } : scroll
  const mergedStyle = overflow
    ? ({ ...style, [MIN_WIDTH_VAR]: `${overflowMinWidth}px` } as CSSProperties)
    : style

  return (
    <Table<RecordType>
      {...rest}
      ref={tableRef}
      columns={mergedColumns}
      scroll={mergedScroll}
      style={mergedStyle}
      className={overflow ? `${mergedClassName} ${OVERFLOW_CLASS}` : mergedClassName}
      locale={mergedLocale}
    />
  )
}

AdminDataTable.Summary = Table.Summary
