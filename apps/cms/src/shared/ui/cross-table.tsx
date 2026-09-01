import type { CSSProperties, ReactNode } from 'react'
import './cross-table.css'

export type CrossTableRow = {
  /** 행 키 — 생략 시 `rowHeader`(문자열) 또는 인덱스 */
  id?: string
  rowHeader: ReactNode
  cells: readonly ReactNode[]
}

export type CrossTableProps = {
  /** 1행 1열 — 행·열 교차 라벨 */
  corner: ReactNode
  /** 1행 열 헤더 (corner 제외) */
  columnHeaders: ReactNode[]
  /** 본문 행 — 행 헤더 + 데이터 셀 */
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

function getColumnHeaderKey(header: ReactNode, index: number): string {
  if (typeof header === 'string' || typeof header === 'number') return String(header)
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

  return (
    <div className={rootClass} style={style}>
      <table className="cross-table__table" aria-label={ariaLabel}>
        <colgroup>
          <col className="cross-table__label-col" />
          {columnHeaders.map((_, index) => (
            <col key={index} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="cross-table__cell cross-table__cell--corner">{corner}</th>
            {columnHeaders.map((header, index) => (
              <th
                key={getColumnHeaderKey(header, index)}
                className="cross-table__cell cross-table__cell--column-header"
                scope="col"
              >
                {header}
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
