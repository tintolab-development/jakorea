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
  /** 1페이지뿐이어도 페이지네이션 노출 (기본: 2페이지 이상일 때만) */
  alwaysShowPagination?: boolean
  /** 건수 헤더 숨김 (월 아코디언 등 자체 헤더가 있을 때) */
  hideHeader?: boolean
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
  alwaysShowPagination = false,
  hideHeader = false,
}: EducationSessionListProps) {
  const showPagination = alwaysShowPagination || totalPages > 1

  if (totalCount === 0) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
        {emptyMessage}
      </PFText>
    )
  }

  return (
    <div className={styles.shell}>
      {hideHeader ? null : (
        <div className={styles.header}>
          <PFText as="h2" typo="hl-sm" color="black" className={styles.count}>
            {`${title} `}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.count}>
            {totalCount}건
          </PFText>
        </div>
      )}

      <div className={styles.list}>{children}</div>

      {showPagination ? (
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
