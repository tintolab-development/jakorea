/**
 * CMS 공용 compact 페이지네이션 — `<` `현재 / 전체` `>` (Platform PFPagination compact 패턴)
 */

import './cms-compact-pagination.css'

export type CmsCompactPaginationVariant = 'default' | 'modal'

export interface CmsCompactPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** default: 36×36 · modal: 26×26 (템플릿 선택 등 ContentModal) */
  variant?: CmsCompactPaginationVariant
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

function ModalChevronLeftIcon({ disabled }: { disabled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="6"
      height="9"
      viewBox="0 0 6 9"
      fill="none"
      aria-hidden
      className="cms-compact-pagination__modal-icon"
    >
      <path
        d="M1.44229 4.44967L4.83667 7.84384C4.95194 7.95925 5.01097 8.10432 5.01375 8.27904C5.01639 8.45363 4.95736 8.60134 4.83667 8.72217C4.71583 8.84286 4.56944 8.90321 4.3975 8.90321C4.22556 8.90321 4.07917 8.84286 3.95833 8.72217L0.213125 4.97696C0.135208 4.8989 0.0802083 4.81661 0.0481249 4.73008C0.0160416 4.64356 0 4.55009 0 4.44967C0 4.34925 0.0160416 4.25578 0.0481249 4.16925C0.0802083 4.08272 0.135208 4.00043 0.213125 3.92238L3.95833 0.177168C4.07375 0.0618903 4.21882 0.00286247 4.39354 8.46941e-05C4.56812 -0.0025542 4.71583 0.0564736 4.83667 0.177168C4.95736 0.298001 5.01771 0.444391 5.01771 0.616335C5.01771 0.78828 4.95736 0.934669 4.83667 1.0555L1.44229 4.44967Z"
        fill={disabled ? 'var(--disabled-txt, rgba(61, 61, 61, 0.50))' : 'var(--default-BK, #3D3D3D)'}
      />
    </svg>
  )
}

function ModalChevronRightIcon({ disabled }: { disabled?: boolean }) {
  return (
    <span className="cms-compact-pagination__modal-icon-flip" aria-hidden>
      <ModalChevronLeftIcon disabled={disabled} />
    </span>
  )
}

export function CmsCompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'default',
  className,
  ariaLabel = '페이지네이션',
}: CmsCompactPaginationProps) {
  if (totalPages <= 0) return null

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages
  const isModal = variant === 'modal'
  const rootClassName = [
    'cms-compact-pagination',
    isModal ? 'cms-compact-pagination--modal' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <nav className={rootClassName} aria-label={ariaLabel}>
      <button
        type="button"
        className="cms-compact-pagination__btn"
        aria-label="이전 페이지"
        disabled={isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {isModal ? (
          <ModalChevronLeftIcon disabled={isFirstPage} />
        ) : (
          <ChevronLeftIcon muted={isFirstPage} />
        )}
      </button>
      <span
        className="cms-compact-pagination__status"
        aria-label={`${currentPage} / ${totalPages} 페이지`}
      >
        <span className="cms-compact-pagination__current">{currentPage}</span>
        <span className="cms-compact-pagination__suffix" aria-hidden="true">{` / ${totalPages}`}</span>
      </span>
      <button
        type="button"
        className="cms-compact-pagination__btn"
        aria-label="다음 페이지"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {isModal ? (
          <ModalChevronRightIcon disabled={isLastPage} />
        ) : (
          <ChevronRightIcon muted={isLastPage} />
        )}
      </button>
    </nav>
  )
}
