import assert from 'node:assert/strict'
import { resolvePortalNotificationPath } from './resolve-portal-notification-path.ts'

assert.equal(
  resolvePortalNotificationPath({
    eventType: 'PORTRAIT_CONSENT_COMPLETED',
    linkType: 'CONSENT',
  }),
  '/mypage/settings?tab=consents',
)

assert.equal(
  resolvePortalNotificationPath({
    eventType: 'MARKETING_AGREED',
    linkType: 'MEMBER',
  }),
  '/mypage/settings?tab=consents',
)

assert.equal(
  resolvePortalNotificationPath({
    eventType: 'NOTICE',
    linkType: 'NOTICE',
    linkId: 12,
  }),
  '/notices/12',
)

assert.equal(
  resolvePortalNotificationPath({
    eventType: 'INDIVIDUAL_APPLICATION_APPROVED',
    linkType: 'PROGRAM_APPLICATION',
    linkId: 7001,
    programId: 120,
  }),
  '/mypage/education/7001',
)

assert.equal(
  resolvePortalNotificationPath({
    eventType: 'PROGRAM_OPEN',
    linkType: 'PROGRAM',
    programId: 120,
  }),
  '/programs/120',
)

assert.equal(
  resolvePortalNotificationPath({
    eventType: 'UNKNOWN',
    linkType: 'INTERNAL_ROUTE',
    linkId: 1,
  }),
  null,
)

assert.equal(
  resolvePortalNotificationPath({
    eventType: 'MEMBER_IDENTITY_VERIFIED',
    linkType: 'MEMBER_PROFILE',
    sourceDomain: 'MEMBER',
    linkId: 3,
  }),
  '/mypage/settings',
)

/** 같은 MEMBER_PROFILE이라도 본인인증 완료가 아니면 이동하지 않는다 */
assert.equal(
  resolvePortalNotificationPath({
    eventType: 'MEMBER_SIGNUP_COMPLETED',
    linkType: 'MEMBER_PROFILE',
    sourceDomain: 'MEMBER',
    linkId: 3,
  }),
  null,
)

console.log('resolve-portal-notification-path.selfcheck: ok')
