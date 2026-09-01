import type { ReactNode } from 'react'
import styles from './consent-form.module.css'

function isEmptyPair(row: readonly string[], pairStart: number): boolean {
  const serial = row[pairStart]?.trim() ?? ''
  const name = row[pairStart + 1]?.trim() ?? ''
  return serial === '' && name === ''
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
}: {
  headers: readonly string[]
  rows: readonly (readonly string[])[]
  emphasizedColumns?: readonly number[]
  /** 행정정보 공동이용 표 — 완전 빈 행 숨김, 빈 셀은 `-` 대신 공백(테두리 유지) */
  hideEmptyPairs?: boolean
}) {
  const colCount = headers.length
  const bodyRows = hideEmptyPairs ? rows.filter(row => rowHasVisiblePair(row, colCount)) : rows

  return (
    <div className={styles.tableWrap}>
      <table className={styles.infoTable}>
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
                const cell = row[cellIndex] ?? ''
                return (
                  <td key={`${rowIndex}-${cellIndex}`} data-label={headers[cellIndex] ?? ''}>
                    {renderCellContent(
                      hideEmptyPairs ? cell : cell || '—',
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
