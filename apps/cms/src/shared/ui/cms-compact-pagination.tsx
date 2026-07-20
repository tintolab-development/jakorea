/**
 * CMS 공용 compact 페이지네이션 — `<` `현재 / 전체` `>` (Platform PFPagination compact 패턴)
 */

import './cms-compact-pagination.css'

export interface CmsCompactPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  ariaLabel?: string
}

function ChevronLeftIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden>
      <path
        d="M6.5 1L1.5 6L6.5 11"
        stroke={muted ? '#C5CCD0' : '#3D3D3D'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden>
      <path
        d="M1.5 1L6.5 6L1.5 11"
        stroke={muted ? '#C5CCD0' : '#3D3D3D'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CmsCompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ariaLabel = '페이지네이션',
}: CmsCompactPaginationProps) {
  if (totalPages <= 1) return null

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages
  const rootClassName = ['cms-compact-pagination', className].filter(Boolean).join(' ')

  return (
    <nav className={rootClassName} aria-label={ariaLabel}>
      <button
        type="button"
        className="cms-compact-pagination__btn"
        aria-label="이전 페이지"
        disabled={isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeftIcon muted={isFirstPage} />
      </button>
      <span
        className="cms-compact-pagination__status"
        aria-label={`${currentPage} / ${totalPages} 페이지`}
      >
        <span className="cms-compact-pagination__current">{currentPage}</span>
        <span className="cms-compact-pagination__divider" aria-hidden="true">
          /
        </span>
        <span className="cms-compact-pagination__total">{totalPages}</span>
      </span>
      <button
        type="button"
        className="cms-compact-pagination__btn"
        aria-label="다음 페이지"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRightIcon muted={isLastPage} />
      </button>
    </nav>
  )
}
