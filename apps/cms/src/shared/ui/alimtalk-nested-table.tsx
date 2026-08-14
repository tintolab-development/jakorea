import { Fragment, useState } from 'react'
import { CaretDownFilled, CaretUpFilled } from '@ant-design/icons'
import './alimtalk-nested-table.css'

export type AlimtalkNestedLine = {
  label: string
  value: string
}

export type AlimtalkNestedTableRow = {
  id?: string
  cells: [string, string]
  nestedLines?: AlimtalkNestedLine[]
}

export type AlimtalkNestedTableProps = {
  columns: [string, string]
  rows: AlimtalkNestedTableRow[]
  className?: string
}

function rowKey(row: AlimtalkNestedTableRow, index: number): string {
  return row.id ?? `${row.cells[0]}-${index}`
}

export function AlimtalkNestedTable({ columns, rows, className }: AlimtalkNestedTableProps) {
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({})

  function isExpanded(key: string, hasNested: boolean): boolean {
    if (!hasNested) return false
    return expandedById[key] ?? true
  }

  function toggle(key: string) {
    setExpandedById(prev => ({ ...prev, [key]: !(prev[key] ?? true) }))
  }

  return (
    <div className={['alimtalk-nested-table-wrap', className].filter(Boolean).join(' ')}>
      <table className="alimtalk-nested-table">
        <colgroup>
          <col className="alimtalk-nested-table__col-toggle" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th className="alimtalk-nested-table__toggle" aria-hidden />
            <th>{columns[0]}</th>
            <th>{columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row, index)
            const nestedLines = row.nestedLines ?? []
            const hasNested = nestedLines.length > 0
            const expanded = isExpanded(key, hasNested)
            return (
              <Fragment key={key}>
                <tr>
                  <td className="alimtalk-nested-table__toggle">
                    {hasNested ? (
                      <button
                        type="button"
                        className="alimtalk-nested-table__toggle-btn"
                        aria-expanded={expanded}
                        aria-label={expanded ? '접기' : '펼치기'}
                        onClick={() => toggle(key)}
                      >
                        {expanded ? <CaretUpFilled /> : <CaretDownFilled />}
                      </button>
                    ) : null}
                  </td>
                  <td>{row.cells[0]}</td>
                  <td>{row.cells[1]}</td>
                </tr>
                {hasNested && expanded ? (
                  <tr className="alimtalk-nested-table__row--detail">
                    <td colSpan={3}>
                      <div className="alimtalk-nested-table__detail">
                        {nestedLines.map(line => (
                          <p key={`${line.label}-${line.value}`} className="alimtalk-nested-table__detail-line">
                            <span className="alimtalk-nested-table__nested-label">{line.label}</span>
                            <span className="alimtalk-nested-table__nested-sep" aria-hidden>
                              :
                            </span>
                            <span className="alimtalk-nested-table__nested-value">{line.value}</span>
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
