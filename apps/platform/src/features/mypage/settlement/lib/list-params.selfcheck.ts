import assert from 'node:assert/strict'
import { MYPAGE_SETTLEMENT_PATH } from '../../lib/constants.ts'
import { buildSettlementOverviewPath, readSettlementOverviewParams } from './list-params.ts'

const now = new Date(2026, 9, 25)

const defaults = readSettlementOverviewParams('', now)
assert.equal(defaults.view, 'list')
assert.equal(defaults.month, '2026-10')
assert.equal(defaults.date, '2026-10-25')
assert.equal(defaults.q, '')
assert.equal(defaults.status, 'all')
assert.equal(defaults.fixture, false)
assert.equal(buildSettlementOverviewPath(defaults), MYPAGE_SETTLEMENT_PATH)

const parsed = readSettlementOverviewParams(
  '?view=calendar&month=2026-01&date=2026-01-26&q=기업가&status=paid&fixture=1',
  now,
)
assert.equal(parsed.view, 'calendar')
assert.equal(parsed.month, '2026-01')
assert.equal(parsed.date, '2026-01-26')
assert.equal(parsed.q, '기업가')
assert.equal(parsed.status, 'paid')
assert.equal(parsed.fixture, true)
assert.equal(
  buildSettlementOverviewPath(parsed),
  `${MYPAGE_SETTLEMENT_PATH}?view=calendar&month=2026-01&date=2026-01-26&q=${encodeURIComponent('기업가')}&status=paid&fixture=1`,
)

const fixtureDefaultMonth = readSettlementOverviewParams('?fixture=1', now)
assert.equal(fixtureDefaultMonth.month, '2026-01')
assert.equal(fixtureDefaultMonth.date, '2026-01-01')

const invalidDateFallsBack = readSettlementOverviewParams('?month=2026-01&date=2026-02-01', now)
assert.equal(invalidDateFallsBack.date, '2026-01-01')

console.log('settlement list-params.selfcheck: ok')
