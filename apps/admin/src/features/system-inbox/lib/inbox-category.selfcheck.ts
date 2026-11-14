/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/system-inbox/lib/inbox-category.selfcheck.ts
 */
import assert from 'node:assert/strict'
import { resolveSystemInboxCategory } from './inbox-category.ts'

for (const type of [
  'CAREER_POSTING_DEADLINE',
  'CAREER_TALENT_APPLICATION',
  'CORPORATE_CONSULTATION',
  'TALENT_APPLICATION',
]) {
  assert.equal(resolveSystemInboxCategory(type), 'matching', type)
}
assert.equal(resolveSystemInboxCategory('career_talent_application'), 'matching')
assert.equal(resolveSystemInboxCategory('UNKNOWN_TYPE'), 'system')
assert.equal(resolveSystemInboxCategory(undefined), 'system')

console.log('inbox-category.selfcheck: ok')
