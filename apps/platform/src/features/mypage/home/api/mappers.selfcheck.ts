import assert from 'node:assert/strict'
import { portalCalendarRange } from './mappers.ts'

const november = portalCalendarRange(new Date(2026, 10, 15))
assert.equal(november.from, '2026-10-31T15:00:00Z')
assert.equal(november.to, '2026-11-30T15:00:00Z')

const october = portalCalendarRange(new Date(2026, 9, 15))
assert.equal(october.from, '2026-09-30T15:00:00Z')
assert.equal(october.to, '2026-10-31T15:00:00Z')

console.log('mypage home calendar mappers.selfcheck: ok')
