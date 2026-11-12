/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/format-display-date.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  formatDisplayDate,
  formatDisplayDateRange,
  formatDisplayDateRangeCompact,
  formatDisplayDateTime,
  formatDisplayDateTimeRange,
  formatDottedSeoulDateTime,
  formatPaddedKoreanSeoulDate,
  normalizeScheduleDisplayLabel,
  parseScheduleDisplayLabel,
  toSeoulDateOnly,
} from './format-display-date.ts'

assert.equal(formatDisplayDate('2026-04-20'), '2026년 4월 20일(월)')
assert.equal(formatDisplayDate('2026-04-24'), '2026년 4월 24일(금)')
assert.equal(formatDisplayDateTime('2026-04-20T00:00:00+09:00'), '2026년 4월 20일(월) 00:00')

assert.equal(
  formatDisplayDateTimeRange('2026-04-20T00:00:00+09:00', '2026-04-20T00:00:00+09:00'),
  '2026년 4월 20일(월) 00:00 ~ 00:00',
)
assert.equal(
  formatDisplayDateTimeRange('2026-04-20T00:00:00+09:00', '2026-04-21T00:00:00+09:00'),
  '2026년 4월 20일(월) 00:00 ~ 2026년 4월 21일(화) 00:00',
)

assert.equal(
  formatDisplayDateRange('2026-04-20', '2026-11-20'),
  '2026년 4월 20일(월) ~ 2026년 11월 20일(금)',
)
assert.equal(formatDisplayDateRange('2026-04-20', '2026-04-20'), '2026년 4월 20일(월)')
assert.equal(
  formatDisplayDateRange('2026-08-15', '2026-09-16', { weekday: false }),
  '2026년 8월 15일 ~ 2026년 9월 16일',
)
assert.equal(formatDisplayDateRange(null, null), '-')
assert.equal(
  formatDisplayDateRangeCompact('2026-05-15', '2026-06-15'),
  '2026년 5월 15일 ~ 6월 15일',
)
assert.equal(
  formatDisplayDateRangeCompact('2026-12-15', '2027-01-15'),
  '2026년 12월 15일 ~ 2027년 1월 15일',
)
assert.equal(formatDisplayDateRangeCompact('2026-05-15', '2026-05-15'), '2026년 5월 15일')

assert.equal(
  normalizeScheduleDisplayLabel('26년 4월 20일(월) 9:30 ~ 12:20'),
  '2026년 4월 20일(월) 09:30 ~ 12:20',
)
assert.equal(
  normalizeScheduleDisplayLabel('2026년 04월 20일(월) 9:30 ~ 12:20 | 2차시'),
  '2026년 4월 20일(월) 09:30 ~ 12:20 | 2차시',
)
assert.equal(
  normalizeScheduleDisplayLabel('2026.04.03(금) – 2026.11.20(금)'),
  '2026년 4월 3일(금) ~ 2026년 11월 20일(금)',
)
assert.equal(
  normalizeScheduleDisplayLabel('2026.04.03 – 2026.11.20'),
  '2026년 4월 3일(금) ~ 2026년 11월 20일(금)',
)
assert.equal(
  normalizeScheduleDisplayLabel('26년 4월 20일(월) 9:30 ~ 12:20 | 26년 4월 27일(일) 13:00 ~ 15:50'),
  '2026년 4월 20일(월) 09:30 ~ 12:20 | 2026년 4월 27일(월) 13:00 ~ 15:50',
)
assert.equal(
  normalizeScheduleDisplayLabel('26년 11월 19일(목) 0:00 ~ 26년 11월 30일(월) 23:59', {
    dateOnly: true,
  }),
  '2026년 11월 19일(목) ~ 2026년 11월 30일(월)',
)
assert.equal(
  normalizeScheduleDisplayLabel('2026-11-08 ~ 2027-02-24 종일'),
  '2026년 11월 8일(일) ~ 2027년 2월 24일(수) 종일',
)
assert.equal(
  normalizeScheduleDisplayLabel('강서초등학교 : 2026년 3월 9일 (09:20 ~ 12:00)'),
  '강서초등학교 : 2026년 3월 9일(월) 09:20 ~ 12:00',
)
assert.equal(normalizeScheduleDisplayLabel('첫째 날 | 2차시'), '첫째 날 | 2차시')
assert.equal(normalizeScheduleDisplayLabel('2026년 3월 첫째 주 평일'), '2026년 3월 첫째 주 평일')

const parsed = parseScheduleDisplayLabel('26년 4월 20일(월) 9:30 ~ 12:20 | 2차시')
assert.equal(parsed.dateKey, '2026-04-20')
assert.equal(parsed.timeRange, '09:30 ~ 12:20')
assert.equal(parsed.sessionLabel, '2차시')

assert.equal(formatDottedSeoulDateTime('2026-10-31T07:30:08Z'), '2026.10.31 16:30')
assert.equal(formatDottedSeoulDateTime('2026-10-31T15:30:00Z'), '2026.11.01 00:30')
assert.equal(formatDottedSeoulDateTime('2026-10-31T16:30:08+09:00'), '2026.10.31 16:30')
assert.equal(formatDottedSeoulDateTime('2026-10-31'), '2026.10.31')
assert.equal(formatDottedSeoulDateTime('2026-10-31 16:30'), '2026.10.31 16:30')
assert.equal(formatDottedSeoulDateTime(''), undefined)
assert.equal(formatDottedSeoulDateTime('not-a-date'), undefined)
assert.equal(toSeoulDateOnly('2026-10-31T15:30:00Z'), '2026-11-01')
assert.equal(toSeoulDateOnly('2026-10-31'), '2026-10-31')
assert.equal(formatDisplayDate(toSeoulDateOnly('2026-10-31T15:30:00Z') ?? ''), '2026년 11월 1일(일)')
assert.equal(formatPaddedKoreanSeoulDate('2026-10-31T15:30:00Z'), '2026년 11월 01일')

console.log('format-display-date.selfcheck: ok')
