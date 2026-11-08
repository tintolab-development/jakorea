/**
 * Admin compact 페이지네이션 — `<` `현재 / 전체` `>`
 * Figma 2991:82674 (Button / Etc / Arrow M 34 · 아이콘 24 · gap 16 · 18 Bold · 비활성 opacity 0.6)
 * CMS `CmsCompactPagination` 대응 (apps/cms import 금지 — Admin 전용 구현)
 */

import chevronLeftUrl from '@/shared/assets/icons/pagination/chevron-left.svg'
import chevronRightUrl from '@/shared/assets/icons/pagination/chevron-right.svg'
import './admin-compact-pagination.css'

export interface AdminCompactPaginationProps {
  /** 1-based 현재 페이지 */
  currentPage: number
  /** 전체 페이지 수 (0이면 1로 표시) */
  totalPages: number
  /** 1-based 이동할 페이지 */
  onPageChange: (page: number) => void
  className?: string
  ariaLabel?: string
}

export function AdminCompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ariaLabel = '페이지네이션',
}: AdminCompactPaginationProps) {
  const total = Math.max(1, totalPages)
  const current = Math.min(Math.max(1, currentPage), total)
  const isFirstPage = current <= 1
  const isLastPage = current >= total

  return (
    <nav
      className={['admin-compact-pagination', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="admin-compact-pagination__btn"
        aria-label="이전 페이지"
        disabled={isFirstPage}
        onClick={() => onPageChange(current - 1)}
      >
        <img src={chevronLeftUrl} width={24} height={24} alt="" aria-hidden />
      </button>
      <span className="admin-compact-pagination__status" aria-label={`${current} / ${total} 페이지`}>
        {`${current} / ${total}`}
      </span>
      <button
        type="button"
        className="admin-compact-pagination__btn"
        aria-label="다음 페이지"
        disabled={isLastPage}
        onClick={() => onPageChange(current + 1)}
      >
        <img src={chevronRightUrl} width={24} height={24} alt="" aria-hidden />
      </button>
    </nav>
  )
}
