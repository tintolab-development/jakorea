import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import styles from './assignment-table.module.css'

type AssignmentTableColumn<T> = {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center'
  render: (row: T) => ReactNode
}

type AssignmentTableProps<T> = {
  title: string
  count: number
  rows: T[]
  rowKey: (row: T) => string
  columns: AssignmentTableColumn<T>[]
  emptyMessage: string
}

export function VolunteerAssignmentTable<T>({
  title,
  count,
  rows,
  rowKey,
  columns,
  emptyMessage,
}: AssignmentTableProps<T>) {
  return (
    <section className={styles.block}>
      <PFText as="h3" typo="hl-lg" color="black" className={styles.title}>
        {title} {count}건
      </PFText>
      {rows.length === 0 ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
          {emptyMessage}
        </PFText>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    style={column.width ? { width: column.width } : undefined}
                    className={column.align === 'left' ? styles.left : undefined}
                  >
                    <PFText as="span" typo="bd-md-sb" color="black">
                      {column.label}
                    </PFText>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={rowKey(row)}>
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={column.align === 'left' ? styles.left : undefined}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function VolunteerScheduleLines({ lines }: { lines: string[] }) {
  const showCount = lines.length <= 3 ? lines.length : 2
  const displayLines = lines.slice(0, showCount)
  const restCount = lines.length - showCount

  return (
    <div className={styles.scheduleCell}>
      {displayLines.map(line => (
        <PFText key={line} as="span" typo="bd-md-rg" color="black">
          {line}
        </PFText>
      ))}
      {restCount > 0 ? (
        <PFText as="span" typo="bd-sm-rg" color="neutral-cool-500" className={styles.more}>
          외 {restCount}개의 봉사 일정
        </PFText>
      ) : null}
    </div>
  )
}

export function VolunteerAssignmentStatusText({
  status,
}: {
  status: 'waiting' | 'cancelled'
}) {
  const isWaiting = status === 'waiting'
  return (
    <PFText
      as="span"
      typo="bd-md-md"
      className={isWaiting ? styles.statusWaiting : styles.statusCancelled}
    >
      {isWaiting ? '배정 대기' : '배정 취소'}
    </PFText>
  )
}

export function VolunteerCellText({ children }: { children: ReactNode }) {
  return (
    <PFText as="span" typo="bd-md-rg" color="black">
      {children}
    </PFText>
  )
}
