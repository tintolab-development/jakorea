import { ADMIN_LIST_PAGE_SIZE } from '@/shared/lib/admin-infinite-list'

/** 무한 스크롤 목록 No. — 서버 totalCount 기준 역순 (0-based page·size=20). */
export function historyAwardsCertsListRowNo(
  totalCount: number,
  rowIndex: number,
  pageSize = ADMIN_LIST_PAGE_SIZE,
): number {
  const page = Math.floor(rowIndex / pageSize)
  const indexInPage = rowIndex - page * pageSize
  return totalCount - page * pageSize - indexInPage
}
