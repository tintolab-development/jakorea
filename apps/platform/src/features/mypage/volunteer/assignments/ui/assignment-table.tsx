import type { ReactNode } from 'react'
import { PFDataTable, PFText, type PFDataTableColumn } from '@/shared/ui'
import styles from './assignment-table.module.css'

type AssignmentTableProps<T> = {
  title: string
  count: number
  rows: T[]
  rowKey: (row: T) => string
  columns: PFDataTableColumn<T>[]
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
      <p className={styles.heading}>
        <PFText as="span" typo="hl-sm" color="black" className={styles.title}>
          {title}
        </PFText>
        <PFText as="span" typo="bd-md-rg" color="neutral-cool-500">
          {count}건
        </PFText>
      </p>
      <PFDataTable columns={columns} rows={rows} rowKey={rowKey} emptyMessage={emptyMessage} />
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

export function VolunteerAssignmentStatusText({ status }: { status: 'waiting' | 'cancelled' }) {
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
