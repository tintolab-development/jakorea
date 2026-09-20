/**
 * 로그 목록 서버 페이징 (0-based page, size=20)
 */

import type { TablePaginationConfig } from 'antd/es/table'

export const LOG_LIST_PAGE_SIZE = 20

export function parseLogListPage(raw: string | null): number {
  if (raw == null || raw.trim() === '') return 0
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0) return 0
  return n
}

export function setLogListPageParam(
  params: URLSearchParams,
  key: string,
  page: number,
): void {
  if (page > 0) params.set(key, String(page))
  else params.delete(key)
}

export function paginateLogRows<T>(
  rows: readonly T[],
  page = 0,
  size = LOG_LIST_PAGE_SIZE,
): { rows: T[]; total: number } {
  const total = rows.length
  const start = page * size
  return { rows: rows.slice(start, start + size), total }
}

export function logListRowNumber(
  total: number,
  page: number,
  index: number,
  size = LOG_LIST_PAGE_SIZE,
): number {
  return total - (page * size + index)
}

export function logTablePagination(args: {
  page: number
  total: number
  onChange: (page0: number) => void
}): TablePaginationConfig {
  return {
    current: args.page + 1,
    pageSize: LOG_LIST_PAGE_SIZE,
    total: args.total,
    showSizeChanger: false,
    hideOnSinglePage: true,
    onChange: current => args.onChange(Math.max(0, (current ?? 1) - 1)),
  }
}
