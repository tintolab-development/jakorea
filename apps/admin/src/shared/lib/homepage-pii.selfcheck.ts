/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/shared/lib/homepage-pii.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  HOMEPAGE_PII_VIEW_PERMISSION,
  hasHomepagePiiView,
  toRevealPiiQueryParam,
} from './homepage-pii.ts'

assert.equal(hasHomepagePiiView(undefined), false)
assert.equal(hasHomepagePiiView([]), false)
assert.equal(hasHomepagePiiView(['HOMEPAGE_NOTICE_WRITE']), false)
assert.equal(hasHomepagePiiView([HOMEPAGE_PII_VIEW_PERMISSION]), true)
assert.equal(hasHomepagePiiView(['HOMEPAGE_NOTICE_WRITE', HOMEPAGE_PII_VIEW_PERMISSION]), true)

assert.equal(toRevealPiiQueryParam(undefined), false)
assert.equal(toRevealPiiQueryParam(false), false)
assert.equal(toRevealPiiQueryParam(true), true)

console.log('homepage-pii selfcheck: ok')
