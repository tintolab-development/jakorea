import type { ReactNode } from 'react'
import styles from './consent-form.module.css'

function pairStartIndex(cellIndex: number): number {
  return Math.floor(cellIndex / 2) * 2
}

function isEmptyPair(row: readonly string[], pairStart: number): boolean {
  const serial = row[pairStart]?.trim() ?? ''
  const name = row[pairStart + 1]?.trim() ?? ''
  return serial === '' && name === ''
}

function shouldRenderCell(
  row: readonly string[],
  cellIndex: number,
  hideEmptyPairs: boolean,
): boolean {
  if (!hideEmptyPairs) return true
  return !isEmptyPair(row, pairStartIndex(cellIndex))
}

function rowHasVisiblePair(row: readonly string[], colCount: number): boolean {
  for (let pairStart = 0; pairStart < colCount; pairStart += 2) {
    if (!isEmptyPair(row, pairStart)) return true
  }
  return false
}

function renderCellContent(
  cell: string,
  cellIndex: number,
  emphasizedColumns: readonly number[]
): ReactNode {
  const className = emphasizedColumns.includes(cellIndex)
    ? styles.cellTextEmphasized
    : styles.cellText
  return <span className={className}>{cell}</span>
}

export function ConsentInfoTable({
  headers,
  rows,
  emphasizedColumns = [],
  hideEmptyPairs = false,
  blankEmptyCells = false,
}: {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  emphasizedColumns?: readonly number[]
  /** 행정정보 공동이용 표 — 완전 빈 행 숨김, 빈 셀은 `-` 대신 공백(테두리 유지) */
  hideEmptyPairs?: boolean
  /** A4 미리보기 — 빈 셀을 시안처럼 공백으로 */
  blankEmptyCells?: boolean
}) {
  const colCount = headers.length
  const bodyRows = hideEmptyPairs ? rows.filter(row => rowHasVisiblePair(row, colCount)) : rows
  /** 연번·행정정보명 쌍 표(행정정보 공동이용)만 연번 열 100px — 그 외 4열 표는 균등 폭 */
  const tableClassName =
    hideEmptyPairs || blankEmptyCells
      ? `${styles.infoTable} ${styles.infoTableSerialPairs}`
      : styles.infoTable

  return (
    <div className={styles.tableWrap}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`${index}-${header}`}>
                <span className={styles.headerText}>{header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: colCount }, (_, cellIndex) => {
                if (!shouldRenderCell(row, cellIndex, hideEmptyPairs)) {
                  return null
                }
                const cell = row[cellIndex] ?? ''
                return (
                  <td key={`${rowIndex}-${cellIndex}`} data-label={headers[cellIndex] ?? ''}>
                    {renderCellContent(
                      hideEmptyPairs || blankEmptyCells ? cell : cell || '—',
                      cellIndex,
                      emphasizedColumns
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
