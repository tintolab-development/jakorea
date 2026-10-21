import type { ReactNode } from 'react'
import { PFText } from '../pf-text'
import styles from './pf-data-table.module.css'

export type PFDataTableColumn<T> = {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center'
  render: (row: T) => ReactNode
}

export type PFDataTableProps<T> = {
  columns: PFDataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
  minWidth?: string
  className?: string
}

const DEFAULT_MIN_WIDTH = '720px'

export function PFDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  minWidth = DEFAULT_MIN_WIDTH,
  className,
}: PFDataTableProps<T>) {
  const isEmpty = rows.length === 0

  if (isEmpty && !emptyMessage) {
    return null
  }

  return (
    <div className={[styles.frame, className].filter(Boolean).join(' ')}>
      <table className={styles.table} style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                <PFText as="span" typo="bd-md-bd" color="black">
                  {column.label}
                </PFText>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length}>
                <PFText as="span" typo="bd-md-rg" color="neutral-cool-600">
                  {emptyMessage}
                </PFText>
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr key={rowKey(row)}>
                {columns.map(column => (
                  <td key={column.key} className={column.align === 'left' ? styles.left : undefined}>
                    <PFText as="span" typo="bd-md-md" color="black">
                      {column.render(row)}
                    </PFText>
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
