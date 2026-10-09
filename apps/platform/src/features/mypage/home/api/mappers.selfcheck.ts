import assert from 'node:assert/strict'
import { portalCalendarRange } from './mappers.ts'

const range = portalCalendarRange(new Date(2026, 9, 15))
assert.match(range.from, /^2026-10-01T00:00:00[+-]\d{2}:\d{2}$/)
assert.match(range.to, /^2026-10-31T23:59:59[+-]\d{2}:\d{2}$/)

console.log('mypage home calendar mappers.selfcheck: ok')
