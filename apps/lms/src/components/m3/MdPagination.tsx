/**
 * Material Design 3 Pagination
 * 페이지네이션 컴포넌트 (M3 버튼 스타일 사용)
 */

import { MdButton } from './index'

interface MdPaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export default function MdPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: MdPaginationProps) {
  const pages: number[] = []
  const maxVisiblePages = 7

  // 페이지 번호 계산
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        gap: '16px',
      }}
    >
      <div style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant, #49454f)' }}>
        총 {total}건 ({currentPage}/{totalPages} 페이지)
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <MdButton variant="outlined" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
          « 처음
        </MdButton>
        <MdButton
          variant="outlined"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          이전
        </MdButton>

        {startPage > 1 && (
          <>
            <MdButton variant="text" onClick={() => onPageChange(1)} disabled>
              1
            </MdButton>
            {startPage > 2 && (
              <span style={{ padding: '0 4px', color: 'var(--md-sys-color-on-surface-variant)' }}>...</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <MdButton
            key={page}
            variant={currentPage === page ? 'filled' : 'outlined'}
            onClick={() => onPageChange(page)}
            ariaLabel={`페이지 ${page}로 이동`}
          >
            {page}
          </MdButton>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span style={{ padding: '0 4px', color: 'var(--md-sys-color-on-surface-variant)' }}>...</span>
            )}
            <MdButton variant="text" onClick={() => onPageChange(totalPages)} disabled>
              {totalPages}
            </MdButton>
          </>
        )}

        <MdButton
          variant="outlined"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          다음
        </MdButton>
        <MdButton
          variant="outlined"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          끝 »
        </MdButton>
      </div>

      {onPageSizeChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <label
            style={{
              fontSize: '14px',
              color: 'var(--md-sys-color-on-surface-variant, #49454f)',
              fontWeight: 500,
            }}
          >
            페이지 크기:
          </label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--md-sys-color-outline-variant, #cac4d0)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--md-sys-color-surface, #fffbfe)',
              color: 'var(--md-sys-color-on-surface, #1c1b1f)',
              cursor: 'pointer',
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      )}
    </div>
  )
}
