import assert from 'node:assert/strict'
import { EMPTY_SETTLEMENT_OVERVIEW } from './empty-overview.ts'
import {
  filterSettlementCalendarItems,
  filterSettlementListItems,
  withListNumbers,
} from './filter-items.ts'
import {
  formatMonthExpectedLabel,
  formatMonthHeading,
  formatMonthPaidLabel,
} from './date-keys.ts'
import { formatWonAmount, formatWonNumber } from './format-amount.ts'
import { formatSettlementHeldAt } from './format-held-at.ts'
import type { SettlementOverviewItem } from '../model/types.ts'

const items: SettlementOverviewItem[] = [
  {
    id: 'b',
    programName: '기업가 정신',
    organizationName: '서울특별시교육청',
    startsAt: '2026-01-09T10:00:00+09:00',
    endsAt: '2026-01-09T11:20:00+09:00',
    sessionLabel: '1차시',
    status: 'paid',
    appliedAmount: 30_000,
  },
  {
    id: 'a',
    programName: '금융 문해력',
    organizationName: '인천광역시교육청',
    startsAt: '2026-01-09T10:00:00+09:00',
    endsAt: '2026-01-09T11:20:00+09:00',
    sessionLabel: '1차시',
    status: 'confirmed',
    appliedAmount: null,
  },
  {
    id: 'c',
    programName: '진로 탐색',
    organizationName: '부산광역시교육청',
    startsAt: '2025-12-31T10:00:00+09:00',
    endsAt: '2025-12-31T12:00:00+09:00',
    sessionLabel: '1차시',
    status: 'confirmed',
    appliedAmount: 0,
  },
]

const january = filterSettlementListItems(items, { month: '2026-01', q: '', status: 'all' })
assert.equal(january.length, 2)

const paid = filterSettlementListItems(items, { month: '2026-01', q: '', status: 'paid' })
assert.deepEqual(paid.map(item => item.id), ['b'])

const search = filterSettlementListItems(items, { month: '2026-01', q: '서울', status: 'all' })
assert.deepEqual(search.map(item => item.id), ['b'])

const calendar = filterSettlementCalendarItems(items, { q: '', status: 'confirmed' })
assert.equal(calendar.length, 2)

const numbered = withListNumbers(january)
assert.deepEqual(
  numbered.map(row => row.no),
  [2, 1],
)

assert.equal(formatWonAmount(null), '0원')
assert.equal(formatWonAmount(0), '0원')
assert.equal(formatWonNumber(null), '0')
assert.equal(formatWonNumber(2_500_000), '2,500,000')
assert.equal(
  formatSettlementHeldAt('2026-01-09T10:00:00+09:00', '2026-01-09T11:20:00+09:00'),
  '2026년 01월 09일(금) 10:00~11:20',
)
assert.equal(formatMonthHeading('2026-01', 7), '2026년 1월 정산 현황 7건')
assert.equal(formatMonthPaidLabel('2026-01'), '1월 정산 완료금')
assert.equal(formatMonthExpectedLabel('2026-10'), '10월 정산 예정금')

assert.equal(EMPTY_SETTLEMENT_OVERVIEW.items.length, 0)
assert.equal(EMPTY_SETTLEMENT_OVERVIEW.summary.totalPaidAmount, null)

// 대체된 이전 재신청 이력은 원래 결과를 알 수 없어 '전체'에서만 보인다
{
  const history: SettlementOverviewItem[] = [
    { ...items[0], id: 'old', status: 'reapplied', superseded: true },
    { ...items[0], id: 'new', status: 'reapplied' },
  ]
  const month = history[0].startsAt.slice(0, 7)
  assert.deepEqual(
    filterSettlementListItems(history, { month, q: '', status: 'all' }).map(item => item.id),
    ['old', 'new'],
  )
  assert.deepEqual(
    filterSettlementListItems(history, { month, q: '', status: 'reapplied' }).map(item => item.id),
    ['new'],
  )
  assert.deepEqual(
    filterSettlementCalendarItems(history, { q: '', status: 'reapplied' }).map(item => item.id),
    ['new'],
  )
}

console.log('settlement filter-items.selfcheck: ok')
