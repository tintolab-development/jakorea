/**
 * Run:
 *   node --experimental-strip-types --experimental-transform-types \
 *     src/features/system-inbox/lib/action-path.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  fallbackInboxActionPath,
  resolveInboxNavigationPath,
  sanitizeInboxActionPath,
} from './action-path.ts'

assert.equal(
  fallbackInboxActionPath('CAREER_TALENT_APPLICATION', 11),
  '/ja-korea/recruit/applicants?applicationId=11',
)
assert.equal(
  fallbackInboxActionPath('CORPORATE_CONSULTATION', 22),
  '/sponsor/corporate/consultations?applicationId=22',
)
assert.equal(
  fallbackInboxActionPath('TALENT_APPLICATION', 33),
  '/sponsor/talent/applications?applicationId=33',
)
assert.equal(
  fallbackInboxActionPath('CAREER_POSTING_DEADLINE', 44),
  '/ja-korea/recruit/postings',
)
assert.equal(fallbackInboxActionPath('CAREER_POSTING_DEADLINE', undefined), '/ja-korea/recruit/postings')
assert.equal(fallbackInboxActionPath('UNKNOWN', 1), null)

assert.equal(
  sanitizeInboxActionPath('/ja-korea/recruit/applicants?applicationId=11'),
  '/ja-korea/recruit/applicants?applicationId=11',
)
assert.equal(
  sanitizeInboxActionPath('/ja-korea/recruit/postings?postingId=44'),
  '/ja-korea/recruit/postings?postingId=44',
)
assert.equal(sanitizeInboxActionPath('/ja-korea/recruit/postings/44'), '/ja-korea/recruit/postings/44')
assert.equal(sanitizeInboxActionPath('javascript:alert(1)'), null)
assert.equal(sanitizeInboxActionPath('https://evil.example/phish'), null)
assert.equal(sanitizeInboxActionPath('//evil.example/phish'), null)
assert.equal(sanitizeInboxActionPath('/main/hero-banners'), null)
assert.equal(
  sanitizeInboxActionPath('/ja-korea/recruit/applicants?applicationId=11&utm=x'),
  '/ja-korea/recruit/applicants?applicationId=11',
)

assert.equal(
  resolveInboxNavigationPath({
    actionPath: '/sponsor/talent/applications?applicationId=9',
    notificationType: 'TALENT_APPLICATION',
    aggregateId: 9,
  }),
  '/sponsor/talent/applications?applicationId=9',
)
assert.equal(
  resolveInboxNavigationPath({
    actionPath: '',
    notificationType: 'CORPORATE_CONSULTATION',
    aggregateId: 7,
  }),
  '/sponsor/corporate/consultations?applicationId=7',
)
assert.equal(
  resolveInboxNavigationPath({
    actionPath: '',
    notificationType: 'CAREER_POSTING_DEADLINE',
    aggregateId: 44,
  }),
  '/ja-korea/recruit/postings',
)
assert.equal(
  resolveInboxNavigationPath({
    actionPath: '/ja-korea/recruit/postings?postingId=44',
    notificationType: 'CAREER_POSTING_DEADLINE',
    aggregateId: 44,
  }),
  '/ja-korea/recruit/postings?postingId=44',
)

console.log('system-inbox action-path selfcheck: ok')
