/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/impact-story/lib/category.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { categoryIdFromKey } from './category.ts'

const remote = [{ id: 1, name: '스토리' }]

assert.equal(categoryIdFromKey(remote, 'all'), undefined)
assert.equal(categoryIdFromKey(remote, 'story'), 1)
assert.equal(categoryIdFromKey(remote, 'press'), undefined)
assert.equal(categoryIdFromKey(remote, 'report'), undefined)
assert.equal(categoryIdFromKey([{ id: 4, name: ' 언론보도 ' }], 'press'), 4)

console.log('impact-story category selfcheck: ok')
