import chevronLeftBlackUrl from '@/shared/assets/icons/chevron-left-black.svg'
import chevronLeftGrayUrl from '@/shared/assets/icons/chevron-left-gray.svg'
import chevronRightBlackUrl from '@/shared/assets/icons/chevron-right-black.svg'
import chevronRightGrayUrl from '@/shared/assets/icons/chevron-right-gray.svg'
import styles from './pf-pagination.module.css'

export type PFPaginationVariant = 'numbered' | 'compact'
export type PFPaginationSize = 'large' | 'small'

export type PFPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  variant?: PFPaginationVariant
  size?: PFPaginationSize
  className?: string
  ariaLabel?: string
}

type PageItem = number | 'ellipsis'

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), totalPages)
}

function normalizePageCount(totalPages: number) {
  if (!Number.isFinite(totalPages)) return 0

  return Math.max(0, Math.trunc(totalPages))
}

function normalizeCurrentPage(currentPage: number, totalPages: number) {
  if (!Number.isFinite(currentPage)) return 1

  return clampPage(Math.trunc(currentPage), totalPages)
}

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages < 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 'ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

export function PFPagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'numbered',
  size = 'large',
  className,
  ariaLabel = '페이지네이션',
}: PFPaginationProps) {
  const totalPageCount = normalizePageCount(totalPages)

  if (totalPageCount <= 0) return null

  const safeCurrentPage = normalizeCurrentPage(currentPage, totalPageCount)
  const isFirstPage = safeCurrentPage === 1
  const isLastPage = safeCurrentPage === totalPageCount

  const handlePageChange = (page: number) => {
    const nextPage = clampPage(page, totalPageCount)

    if (nextPage === safeCurrentPage) return

    onPageChange(nextPage)
  }

  const rootClassName = [styles.pagination, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')

  return (
    <nav className={rootClassName} aria-label={ariaLabel}>
      <button
        className={styles.control}
        type="button"
        aria-label="이전 페이지"
        disabled={isFirstPage}
        onClick={() => handlePageChange(safeCurrentPage - 1)}
      >
        <img
          className={styles.icon}
          src={isFirstPage ? chevronLeftGrayUrl : chevronLeftBlackUrl}
          alt=""
          aria-hidden="true"
        />
      </button>

      {variant === 'numbered' ? (
        <div className={styles.pages}>
          {getPageItems(safeCurrentPage, totalPageCount).map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <span className={styles.ellipsis} aria-hidden="true" key={`ellipsis-${index}`}>
                  ...
                </span>
              )
            }

            const isSelected = item === safeCurrentPage

            return (
              <button
                className={[styles.pageButton, isSelected ? styles.selected : undefined]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                aria-label={`${item} 페이지`}
                aria-current={isSelected ? 'page' : undefined}
                onClick={() => handlePageChange(item)}
                key={item}
              >
                {item}
              </button>
            )
          })}
        </div>
      ) : (
        <div className={styles.compactStatus} aria-label={`${safeCurrentPage} / ${totalPageCount} 페이지`}>
          <span className={styles.currentPage}>{safeCurrentPage}</span>
          <span className={styles.divider} aria-hidden="true">
            /
          </span>
          <span className={[styles.totalPage, isLastPage ? styles.disabledText : undefined].filter(Boolean).join(' ')}>
            {totalPageCount}
          </span>
        </div>
      )}

      <button
        className={styles.control}
        type="button"
        aria-label="다음 페이지"
        disabled={isLastPage}
        onClick={() => handlePageChange(safeCurrentPage + 1)}
      >
        <img
          className={styles.icon}
          src={isLastPage ? chevronRightGrayUrl : chevronRightBlackUrl}
          alt=""
          aria-hidden="true"
        />
      </button>
    </nav>
  )
}
