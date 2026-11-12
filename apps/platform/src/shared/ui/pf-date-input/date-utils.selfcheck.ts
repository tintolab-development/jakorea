import assert from 'node:assert/strict'
import { parseYear, parseYearMonth } from './date-utils.ts'

assert.equal(parseYear('2009'), 2009)
assert.equal(parseYear('2009.03'), 2009)
assert.equal(parseYear('2009-03'), 2009)
assert.equal(parseYear('2009.03.01'), 2009)
assert.equal(parseYear('09'), null)

assert.deepEqual(parseYearMonth('2020-03'), { year: 2020, month: 3 })
assert.deepEqual(parseYearMonth('2020.03'), { year: 2020, month: 3 })
assert.deepEqual(parseYearMonth('2020.3'), { year: 2020, month: 3 })
assert.deepEqual(parseYearMonth('2020-03-01'), { year: 2020, month: 3 })
assert.equal(parseYearMonth('2020'), null)

console.log('date-utils.selfcheck: ok')
