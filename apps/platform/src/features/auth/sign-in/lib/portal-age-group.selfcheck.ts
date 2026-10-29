import assert from 'node:assert/strict'
import {
  isUnder14FromAgeGroup,
  parsePortalAgeGroup,
  PORTAL_AGE_GROUP,
  resolvePortalAgeGroupFromTokenOrMe,
} from './portal-age-group.ts'

assert.equal(parsePortalAgeGroup('UNDER_14'), PORTAL_AGE_GROUP.UNDER_14)
assert.equal(parsePortalAgeGroup('OVER_14'), PORTAL_AGE_GROUP.OVER_14)
assert.equal(parsePortalAgeGroup(' under_14 '), PORTAL_AGE_GROUP.UNDER_14)
assert.equal(parsePortalAgeGroup(null), undefined)
assert.equal(parsePortalAgeGroup(''), undefined)
assert.equal(parsePortalAgeGroup('ADULT'), undefined)

assert.equal(isUnder14FromAgeGroup('UNDER_14'), true)
assert.equal(isUnder14FromAgeGroup('OVER_14'), false)
assert.equal(isUnder14FromAgeGroup(undefined), false)
assert.equal(isUnder14FromAgeGroup(null), false)

const fromToken = await resolvePortalAgeGroupFromTokenOrMe('UNDER_14', async () => {
  throw new Error('me must not run when token has ageGroup')
})
assert.equal(fromToken, PORTAL_AGE_GROUP.UNDER_14)

const fromMe = await resolvePortalAgeGroupFromTokenOrMe(null, async () => ({
  ageGroup: 'OVER_14',
}))
assert.equal(fromMe, PORTAL_AGE_GROUP.OVER_14)

const missing = await resolvePortalAgeGroupFromTokenOrMe('', async () => ({}))
assert.equal(missing, undefined)

console.log('portal-age-group.selfcheck: ok')
