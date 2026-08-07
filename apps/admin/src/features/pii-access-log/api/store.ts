/**
 * 개인정보 조회 이력 — local seed
 */

import type {
  PiiAccessListFilter,
  PiiAccessListResult,
  PiiAccessLog,
} from '@/entities/pii-access-log/model/types'
import {
  includesIgnoreCase,
  isIsoInDateRange,
} from '@/features/logs/shared/lib/filter-date-range'

const TARGETS = ['박틴토', '김회원', '이학생', '최부모', '정후원']
const PURPOSES = [
  '기업 상담 신청 대응을 위함',
  '정산 문의 확인',
  '회원 정보 수정 요청 처리',
  '후원 상담 이력 확인',
  '계정 문의 응대',
]
const ACCESSORS = [
  '홍길동',
  '김철수',
  '이명희',
  '박민수',
  '최지훈',
  '정은지',
  '이수진',
  '김명호',
  '배수현',
  '홍성민',
  '유정민',
  '오상민',
  '문지혜',
]

function buildSeed(): PiiAccessLog[] {
  const rows: PiiAccessLog[] = []
  const base = Date.UTC(2026, 2, 30, 1, 10, 32)
  for (let i = 0; i < 130; i += 1) {
    const at = new Date(base - i * 3_300_000)
    rows.push({
      id: `pii-${i + 1}`,
      targetName: TARGETS[i % TARGETS.length]!,
      purpose: PURPOSES[i % PURPOSES.length]!,
      accessorName: ACCESSORS[i % ACCESSORS.length]!,
      accessedAt: at.toISOString(),
      ip: `14.${(i % 50) + 10}.${(i % 40) + 5}.${(i % 100) + 1}`,
    })
  }
  return rows
}

const SEED = buildSeed()

export function listPiiAccessLogs(
  filter: PiiAccessListFilter
): PiiAccessListResult {
  let rows = [...SEED]
  if (filter.purpose) {
    rows = rows.filter(r => includesIgnoreCase(r.purpose, filter.purpose!))
  }
  if (filter.accessorName) {
    rows = rows.filter(r =>
      includesIgnoreCase(r.accessorName, filter.accessorName!)
    )
  }
  rows = rows.filter(r =>
    isIsoInDateRange(r.accessedAt, filter.from, filter.to)
  )
  rows.sort(
    (a, b) =>
      new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime()
  )
  return { rows, total: rows.length }
}
