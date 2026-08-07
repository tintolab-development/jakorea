/**
 * 파일 다운로드 이력 — local seed
 */

import type {
  FileDownloadListFilter,
  FileDownloadListResult,
  FileDownloadLog,
} from '@/entities/file-download-log/model/types'
import {
  includesIgnoreCase,
  isIsoInDateRange,
} from '@/features/logs/shared/lib/filter-date-range'

const FILES = [
  '회원정보 테이블.xlsx',
  '고객리스트.csv',
  '후원사_목록.xlsx',
  '공지사항_첨부.pdf',
  '정산보고서.docx',
  '통계_월간.xlsx',
  '상담신청_목록.csv',
]

const NAMES = [
  '홍길동',
  '김철수',
  '이명희',
  '박민수',
  '최지훈',
  '정은지',
  '이수진',
]

function buildSeed(): FileDownloadLog[] {
  const rows: FileDownloadLog[] = []
  const base = Date.UTC(2026, 2, 30, 1, 10, 32)
  for (let i = 0; i < 130; i += 1) {
    const at = new Date(base - i * 4_200_000)
    rows.push({
      id: `file-dl-${i + 1}`,
      fileName: FILES[i % FILES.length]!,
      userName: NAMES[i % NAMES.length]!,
      downloadedAt: at.toISOString(),
      ip: `14.${92 + (i % 8)}.${18 + (i % 25)}.${12 + (i % 40)}`,
    })
  }
  return rows
}

const SEED = buildSeed()

export function listFileDownloadLogs(
  filter: FileDownloadListFilter
): FileDownloadListResult {
  let rows = [...SEED]
  if (filter.fileName) {
    rows = rows.filter(r => includesIgnoreCase(r.fileName, filter.fileName!))
  }
  if (filter.userName) {
    rows = rows.filter(r => includesIgnoreCase(r.userName, filter.userName!))
  }
  rows = rows.filter(r =>
    isIsoInDateRange(r.downloadedAt, filter.from, filter.to)
  )
  rows.sort(
    (a, b) =>
      new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
  )
  return { rows, total: rows.length }
}
