import assert from 'node:assert/strict'
import { resolveEducationIncomingDeeplinkBouncePath } from './education-application-route.ts'

assert.equal(
  resolveEducationIncomingDeeplinkBouncePath('INSTRUCTOR', '1694798'),
  '/mypage/lectures/INSTRUCTOR/1694798',
)
assert.equal(
  resolveEducationIncomingDeeplinkBouncePath('VOLUNTEER', '1691660'),
  '/mypage/volunteer/VOLUNTEER/1691660',
)
assert.equal(resolveEducationIncomingDeeplinkBouncePath('INDIVIDUAL', '1694740'), null)
assert.equal(resolveEducationIncomingDeeplinkBouncePath('ORGANIZATION', '100'), null)

console.log('education-incoming-deeplink-bounce.selfcheck ok')
