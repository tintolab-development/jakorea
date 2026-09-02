import type { ReactNode } from 'react'
import { PFPagination, PFText } from '@/shared/ui'
import styles from './session-list.module.css'

type EducationSessionListProps = {
  title: string
  totalCount: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  emptyMessage: string
  children: ReactNode
  paginationAriaLabel?: string
}

export function EducationSessionList({
  title,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  emptyMessage,
  children,
  paginationAriaLabel,
}: EducationSessionListProps) {
  if (totalCount === 0) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
        {emptyMessage}
      </PFText>
    )
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <PFText as="h2" typo="hl-sm" color="black" className={styles.count}>
          {`${title} `}
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.count}>
          {totalCount}건
        </PFText>
      </div>

      <div className={styles.list}>{children}</div>

      {totalPages > 1 ? (
        <div className={styles.pagination}>
          <PFPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            ariaLabel={paginationAriaLabel ?? `${title} 페이지`}
          />
        </div>
      ) : null}
    </div>
  )
}
