/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/shared/lib/homepage-pii-display.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { displayServerPiiAsIs } from './homepage-pii-display.ts'

assert.equal(displayServerPiiAsIs('010-****-9154'), '010-****-9154')
assert.equal(displayServerPiiAsIs('wldnj***@naver.com'), 'wldnj***@naver.com')
assert.equal(displayServerPiiAsIs('홍**'), '홍**')
assert.equal(displayServerPiiAsIs('서울시 ****'), '서울시 ****')
assert.equal(displayServerPiiAsIs(null), '-')
assert.equal(displayServerPiiAsIs(undefined), '-')
assert.equal(displayServerPiiAsIs(''), '-')
assert.equal(displayServerPiiAsIs('   '), '-')
assert.equal(displayServerPiiAsIs('010-1234-5678'), '010-1234-5678')

console.log('homepage-pii-display selfcheck: ok')
