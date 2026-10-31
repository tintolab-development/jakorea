import type { CSSProperties, ReactNode } from 'react'
import './cross-table.css'

export type CrossTableRow = {
  /** 행 키 — 생략 시 `rowHeader`(문자열) 또는 인덱스 */
  id?: string
  rowHeader: ReactNode
  cells: readonly ReactNode[]
}

/** 열 헤더 — `colSpan`으로 동일 날짜 등 그룹 헤더를 표현 */
export type CrossTableColumnHeader = {
  content: ReactNode
  colSpan?: number
}

export type CrossTableProps = {
  /** 1행 1열 — 행·열 교차 라벨 */
  corner: ReactNode
  /**
   * 1행 열 헤더 (corner 제외).
   * 문자열/노드 배열 또는 `{ content, colSpan }` — colSpan 합 = 본문 leaf 열 수.
   */
  columnHeaders: ReadonlyArray<ReactNode | CrossTableColumnHeader>
  /** 본문 행 — 행 헤더 + 데이터 셀 (leaf 열 수와 동일) */
  rows: CrossTableRow[]
  className?: string
  /**
   * 첫 열 240px — `DetailInfoForm.Field` `labelWidth={240}` 과 동일.
   * 기본은 200px 고정.
   */
  wide?: boolean
  /** 루트 스타일 — `--cross-table-label-w` 등으로 첫 열만 확장할 때 사용 */
  style?: CSSProperties
  'aria-label'?: string
}

function getRowKey(row: CrossTableRow, index: number): string {
  if (row.id != null) return row.id
  if (typeof row.rowHeader === 'string') return row.rowHeader
  return String(index)
}

function normalizeColumnHeader(header: ReactNode | CrossTableColumnHeader): CrossTableColumnHeader {
  if (
    header != null &&
    typeof header === 'object' &&
    !Array.isArray(header) &&
    'content' in header
  ) {
    const colSpan = header.colSpan != null && header.colSpan > 0 ? Math.trunc(header.colSpan) : 1
    return { content: header.content, colSpan }
  }
  return { content: header as ReactNode, colSpan: 1 }
}

function getColumnHeaderKey(header: CrossTableColumnHeader, index: number): string {
  if (typeof header.content === 'string' || typeof header.content === 'number') {
    return `${String(header.content)}-${index}`
  }
  return String(index)
}

export function CrossTable({
  corner,
  columnHeaders,
  rows,
  className,
  wide = false,
  style,
  'aria-label': ariaLabel,
}: CrossTableProps) {
  const rootClass = ['cross-table', wide ? 'cross-table--wide' : '', className]
    .filter(Boolean)
    .join(' ')

  const normalizedHeaders = columnHeaders.map(normalizeColumnHeader)
  const leafColumnCount = normalizedHeaders.reduce((sum, header) => sum + (header.colSpan ?? 1), 0)

  return (
    <div className={rootClass} style={style}>
      <table className="cross-table__table" aria-label={ariaLabel}>
        <colgroup>
          <col className="cross-table__label-col" />
          {Array.from({ length: leafColumnCount }, (_, index) => (
            <col key={index} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="cross-table__cell cross-table__cell--corner">{corner}</th>
            {normalizedHeaders.map((header, index) => (
              <th
                key={getColumnHeaderKey(header, index)}
                className="cross-table__cell cross-table__cell--column-header"
                scope="col"
                {...((header.colSpan ?? 1) > 1 ? { colSpan: header.colSpan } : {})}
              >
                {header.content}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey(row, rowIndex)}>
              <th className="cross-table__cell cross-table__cell--row-header" scope="row">
                {row.rowHeader}
              </th>
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={`${getRowKey(row, rowIndex)}-${cellIndex}`}
                  className="cross-table__cell cross-table__cell--data"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
