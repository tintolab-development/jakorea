import assert from 'node:assert/strict'
import { DEFAULT_PROGRAMS_LIST_PARAMS } from '../lib/constants.ts'
import { HOME_PORTAL_PROGRAMS_QUERY, toPortalProgramListQuery } from './list-query.ts'

const home = HOME_PORTAL_PROGRAMS_QUERY
assert.equal(home.page, 0)
assert.equal(home.size, 8)
assert.equal(home.featuredOnHome, true)
assert.equal(home.sort, undefined)

const all = toPortalProgramListQuery({ ...DEFAULT_PROGRAMS_LIST_PARAMS }, 10)
assert.equal(all.page, 0)
assert.equal(all.size, 10)
assert.equal(all.portalTab, undefined)
assert.equal(all.keyword, undefined)
assert.equal(all.programType, undefined)
assert.equal(all.sort, 'LATEST')

const filtered = toPortalProgramListQuery(
  {
    ...DEFAULT_PROGRAMS_LIST_PARAMS,
    category: 'youth',
    q: '금융',
    programType: 'UJAT',
    recruitmentStatus: 'scheduled',
    educationForm: 'online',
    educationTarget: 'university',
    recruitmentTarget: 'high',
    operatingPeriod: '2026-09-01~2026-12-31',
    sort: 'closing-soon',
    page: 3,
  },
  10,
)
assert.equal(filtered.portalTab, 'YOUTH_YOUNG')
assert.equal(filtered.keyword, '금융')
assert.equal(filtered.programType, 'UJAT')
assert.equal(filtered.recruitmentStatus, 'UPCOMING')
assert.equal(filtered.educationMethod, 'ONLINE')
assert.equal(filtered.educationTargets, undefined)

const recruitmentOnly = toPortalProgramListQuery(
  {
    ...DEFAULT_PROGRAMS_LIST_PARAMS,
    recruitmentTarget: 'high',
  },
  10,
)
assert.equal(recruitmentOnly.educationTargets, 'high')

const educationOnly = toPortalProgramListQuery(
  {
    ...DEFAULT_PROGRAMS_LIST_PARAMS,
    educationTarget: 'university',
  },
  10,
)
assert.equal(educationOnly.educationTargets, 'university')
assert.equal(filtered.operatingFrom, '2026-09-01')
assert.equal(filtered.operatingTo, '2026-12-31')
assert.equal(filtered.sort, 'CLOSING_SOON')
assert.equal(filtered.page, 2)
assert.equal(filtered.featuredOnHome, undefined)

console.log('program portal list-query.selfcheck: ok')
