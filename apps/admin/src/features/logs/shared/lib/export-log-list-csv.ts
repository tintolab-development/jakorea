/**
 * 로그 엑셀 다운로드 — `/export` 가 DATA_INTEGRITY_CONFLICT 로 실패하므로
 * 동일 필터의 목록 GET 전 페이지로 CSV(Excel BOM)를 만든다.
 */

import { downloadCsv } from './export-csv'
import { displayLogField } from './display-log-field'
import { formatLogDateTime } from './format-datetime'
import { fetchAllAdminListPages, type AdminListPage } from '@/shared/lib/admin-infinite-list'

export function logExportDateTime(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? formatLogDateTime(trimmed) : '-'
}

export async function downloadFilteredLogCsv<T>(options: {
  filenameBase: string
  headers: string[]
  fetchPage: (page: number) => Promise<AdminListPage<T>>
  toCells: (row: T) => Array<string | number | null | undefined>
}): Promise<void> {
  const rows = await fetchAllAdminListPages(options.fetchPage)
  const total = rows.length
  downloadCsv({
    filenameBase: options.filenameBase,
    headers: options.headers,
    rows: rows.map((row, index) => [total - index, ...options.toCells(row)]),
  })
}

export { displayLogField }
